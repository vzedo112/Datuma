const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { parseFile, getSchema } = require('../services/parser');
const { getDatasetStats, getRepresentativeSample } = require('../services/stats');
const { analyzeQuality } = require('../services/dataQuality');
const { analyzeCrossFile, analyzeCrossUpload } = require('../services/overlapAnalysis');
const { appendDataset, ROW_CAP_PER_DATASET } = require('../services/appendEngine');
const { generateDashboard } = require('../services/claude');
const { attachChartData } = require('../services/aggregator');
const {
  requireUser,
  getUserId,
  getUserPlan,
  getUserSpendCap,
  getStripeCustomerId,
} = require('../middleware/auth');
const { createOverageInvoiceItem } = require('../services/stripe');
const {
  sendDashboardReady,
  sendOverageWarning,
} = require('../services/email');
const {
  saveDashboard,
  countThisMonth,
  listRecentWithContext,
  getDashboard,
} = require('../services/dashboardStore');
const { getPlan } = require('../services/plans');
const uploadSession = require('../services/uploadSession');
const db = require('../db');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const HARD_FILE_CEILING = 20;

// Rate-limit the expensive endpoints. Keyed by Clerk user id when available so
// a single bad actor can't burn shared IP buckets; falls back to IP for
// pre-auth callers. Anthropic credits are real money — this is the cheap
// guardrail before we hit the Stripe / Anthropic spend.
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getUserId(req) || req.ip,
  message: {
    error: 'Too many requests, please slow down for a moment.',
    code: 'RATE_LIMITED',
  },
});

function dedupeDatasetNames(datasets) {
  const counts = new Map();
  return datasets.map((ds) => {
    const base = (ds.name || '').toString().trim() || ds.filename.replace(/\.[^.]+$/, '');
    const seen = counts.get(base) || 0;
    counts.set(base, seen + 1);
    return { ...ds, name: seen === 0 ? base : `${base} (${seen + 1})` };
  });
}

function parseDatasetNames(body) {
  if (!body || !body.datasetNames) return null;
  try {
    const raw = typeof body.datasetNames === 'string'
      ? JSON.parse(body.datasetNames)
      : body.datasetNames;
    if (!Array.isArray(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

router.post(
  '/analyze',
  requireUser(),
  uploadLimiter,
  upload.array('files', HARD_FILE_CEILING),
  async (req, res) => {
    try {
      const files = req.files || [];
      if (files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const userId = getUserId(req);
      const planKey = await getUserPlan(req);
      const plan = getPlan(planKey);

      if (files.length > plan.fileLimit) {
        return res.status(413).json({
          error: `Your ${plan.name} plan allows up to ${plan.fileLimit} file${plan.fileLimit === 1 ? '' : 's'} per dashboard. You uploaded ${files.length}.`,
          code: 'FILE_LIMIT_EXCEEDED',
          fileLimit: plan.fileLimit,
          plan: plan.key,
        });
      }

      const used = await countThisMonth(userId);
      const monthlyIncluded = plan.monthlyIncluded;
      const overInclusive =
        Number.isFinite(monthlyIncluded) && used >= monthlyIncluded;

      if (overInclusive && plan.overageCents === null) {
        return res.status(402).json({
          error: `You've used all ${monthlyIncluded} dashboards in your ${plan.name} plan this month. Upgrade to keep going.`,
          code: 'QUOTA_EXCEEDED',
          used,
          limit: monthlyIncluded,
          plan: plan.key,
        });
      }

      // Spend cap check — only relevant when the next dashboard would be an
      // overage and the plan supports paid overages (Pro/Team/Enterprise).
      if (overInclusive && plan.overageCents > 0) {
        const spendCap = await getUserSpendCap(req);
        const overageAfter = used - monthlyIncluded + 1;
        const chargeAfterCents = overageAfter * plan.overageCents;
        if (chargeAfterCents > spendCap) {
          return res.status(402).json({
            error: spendCap === 0
              ? `You've used all ${monthlyIncluded} dashboards included in your ${plan.name} plan. Raise your monthly spend cap in Settings to keep going at €${plan.overageEuros.toFixed(2)} each.`
              : `Generating this dashboard would put you over your €${(spendCap / 100).toFixed(2)} monthly spend cap. Raise it in Settings to continue.`,
            code: 'SPEND_CAP_HIT',
            used,
            limit: monthlyIncluded,
            spendCapCents: spendCap,
            overageCents: plan.overageCents,
            plan: plan.key,
          });
        }
      }

      const nameOverrides = parseDatasetNames(req.body) || [];
      const nameByFilename = new Map(
        nameOverrides
          .filter((o) => o && o.filename)
          .map((o) => [o.filename, (o.name || '').toString().trim()])
      );

      const parentDashboardId = req.body?.parentDashboardId
        ? Number(req.body.parentDashboardId)
        : null;
      const parentDashboard = Number.isInteger(parentDashboardId)
        ? await getDashboard(parentDashboardId, userId)
        : null;

      const parsed = [];
      for (const file of files) {
        const rows = parseFile(file);
        if (rows.length === 0) {
          return res.status(400).json({
            error: `${file.originalname} contains no data.`,
            code: 'EMPTY_FILE',
          });
        }
        if (rows.length > plan.rowLimit) {
          return res.status(413).json({
            error: `${file.originalname} has ${rows.length.toLocaleString()} rows, but your ${plan.name} plan allows up to ${plan.rowLimit.toLocaleString()} per file.`,
            code: 'ROW_LIMIT_EXCEEDED',
            rowCount: rows.length,
            rowLimit: plan.rowLimit,
            plan: plan.key,
          });
        }

        const schema = getSchema(rows);
        const stats = getDatasetStats(rows, schema);
        const sample = getRepresentativeSample(rows, 30);
        const quality = analyzeQuality(rows, schema);

        const providedName = nameByFilename.get(file.originalname);
        const baseName = providedName || file.originalname.replace(/\.[^.]+$/, '');

        parsed.push({
          name: baseName,
          filename: file.originalname,
          rowCount: rows.length,
          rows,
          schema,
          stats,
          sample,
          quality,
        });
      }

      const deduped = dedupeDatasetNames(parsed);

      // Cross-file overlap (only meaningful with 2+ files in the same upload).
      const crossFile = analyzeCrossFile(deduped);

      // Cross-upload overlap — compare against the user's most recent saved
      // dashboards that carry an analysisContext. If we're updating a specific
      // parent, prepend it so it's always considered even when it's old.
      // Best-effort: if persistence is unavailable, we just skip this signal.
      let crossUpload = [];
      try {
        const recent = await listRecentWithContext(userId, { limit: 5 });
        const priors = parentDashboard
          ? [
              parentDashboard,
              ...recent.filter((r) => r.id !== parentDashboard.id),
            ]
          : recent;
        crossUpload = analyzeCrossUpload(deduped, priors);
      } catch (err) {
        console.warn('Cross-upload overlap check failed:', err.message);
      }

      const uploadId = uploadSession.create(userId, deduped, {
        parentDashboardId: parentDashboard ? parentDashboard.id : null,
      });

      res.json({
        uploadId,
        datasets: deduped.map((d) => ({
          name: d.name,
          filename: d.filename,
          rowCount: d.rowCount,
          quality: d.quality,
        })),
        crossFileFindings: crossFile,
        crossUploadFindings: crossUpload,
        overage: overInclusive
          ? { isOverage: true, overageEuros: plan.overageEuros, used: used + 1 }
          : null,
      });
    } catch (err) {
      console.error('Analyze upload error:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.post('/generate', requireUser(), uploadLimiter, express.json(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const { uploadId, datasetNames } = req.body || {};
    if (!uploadId) return res.status(400).json({ error: 'Missing uploadId' });

    const session = uploadSession.get(uploadId, userId);
    if (!session) {
      return res.status(410).json({
        error: 'Upload session expired or not found. Re-upload your files.',
        code: 'SESSION_EXPIRED',
      });
    }

    // Apply any final name overrides from the report screen.
    let datasets = session.datasets;
    if (Array.isArray(datasetNames)) {
      const renameByFilename = new Map(
        datasetNames
          .filter((o) => o && o.filename && typeof o.name === 'string')
          .map((o) => [o.filename, o.name.trim()])
      );
      if (renameByFilename.size > 0) {
        datasets = dedupeDatasetNames(
          datasets.map((d) => ({
            ...d,
            name: renameByFilename.get(d.filename) || d.name,
          }))
        );
      }
    }

    const planKey = await getUserPlan(req);
    const plan = getPlan(planKey);

    // If updating a parent dashboard, append the parent's stored rows into
    // each matching new dataset. Pure-Append semantics: never overwrite, never
    // dedupe by PK — only exact-row dupes are collapsed. Datasets without a
    // parent match stay as-is; parent datasets with no new file are carried
    // forward unchanged.
    let appendSummary = null;
    if (session.parentDashboardId) {
      try {
        const parent = await getDashboard(session.parentDashboardId, userId);
        const priorDatasets = parent?.dashboard?.analysisContext?.datasets;
        if (Array.isArray(priorDatasets) && priorDatasets.length > 0) {
          const priorByName = new Map(priorDatasets.map((p) => [p.name, p]));
          const perDataset = [];

          datasets = datasets.map((d) => {
            const prior = priorByName.get(d.name);
            if (!prior) {
              perDataset.push({ name: d.name, status: 'new', added: d.rowCount });
              return d;
            }
            const result = appendDataset(prior, d);
            if (!result) {
              perDataset.push({
                name: d.name,
                status: 'no-schema-overlap',
                added: d.rowCount,
              });
              return d;
            }
            const combinedSchema = getSchema(result.rows);
            const combinedStats = getDatasetStats(result.rows, combinedSchema);
            const combinedSample = getRepresentativeSample(result.rows, 30);
            perDataset.push({
              name: d.name,
              status: 'merged',
              priorCount: prior.rowCount,
              freshCount: d.rowCount,
              added: result.added,
              deduped: result.deduped,
              mergedCount: result.rows.length,
              schemaDiff: result.schemaDiff,
              capApplied: result.capApplied,
            });
            return {
              ...d,
              rows: result.rows,
              schema: combinedSchema,
              stats: combinedStats,
              sample: combinedSample,
              rowCount: result.rows.length,
            };
          });

          // Carry forward any parent datasets the user didn't re-upload.
          const newNames = new Set(datasets.map((d) => d.name));
          for (const p of priorDatasets) {
            if (newNames.has(p.name)) continue;
            if (!Array.isArray(p.rows) || p.rows.length === 0) continue;
            datasets.push({
              name: p.name,
              filename: p.filename || `${p.name}.csv`,
              rowCount: p.rowCount,
              rows: p.rows,
              schema: p.schema,
              stats: p.stats,
              sample: p.sample,
            });
            perDataset.push({
              name: p.name,
              status: 'carried-over',
              rowCount: p.rowCount,
            });
          }

          appendSummary = { mode: 'append', perDataset };
        }
      } catch (err) {
        console.warn('Append from parent failed:', err.message);
      }
    }

    const claudeInput = datasets.map((d) => ({
      name: d.name,
      filename: d.filename,
      rowCount: d.rowCount,
      schema: d.schema,
      stats: d.stats,
      sample: d.sample,
    }));

    const dashboard = await generateDashboard(claudeInput, planKey);

    const datasetsForAggregator = Object.fromEntries(
      datasets.map((d) => [d.name, { rows: d.rows, stats: d.stats }])
    );
    const dashboardWithData = attachChartData(datasetsForAggregator, dashboard);

    dashboardWithData.datasets = datasets.map((d) => ({
      name: d.name,
      filename: d.filename,
      rowCount: d.rowCount,
    }));

    // Persist full rows so future updates can append against this dashboard.
    // Capped per dataset to keep the JSONB blob bounded; row truncation here
    // is FIFO (oldest history dropped first).
    dashboardWithData.analysisContext = {
      datasets: datasets.map((d) => ({
        name: d.name,
        filename: d.filename,
        rowCount: d.rowCount,
        schema: d.schema,
        stats: d.stats,
        sample: d.sample,
        rows:
          d.rows.length <= ROW_CAP_PER_DATASET
            ? d.rows
            : d.rows.slice(d.rows.length - ROW_CAP_PER_DATASET),
        rowsTruncated: d.rows.length > ROW_CAP_PER_DATASET,
      })),
    };

    if (appendSummary) {
      dashboardWithData.appendSummary = appendSummary;
    }

    const totalRows = datasets.reduce((sum, d) => sum + d.rowCount, 0);
    const primaryFilename = datasets.length === 1
      ? datasets[0].filename
      : `${datasets.length} files`;

    let savedId = null;
    let shareToken = null;
    let saveError = null;
    try {
      const saved = await saveDashboard({
        userId,
        filename: primaryFilename,
        rowCount: totalRows,
        dashboard: dashboardWithData,
        parentId: session.parentDashboardId ?? null,
      });
      savedId = saved?.id ?? null;
    } catch (err) {
      console.warn('Failed to persist dashboard:', err.message);
      saveError = err.message;
    }
    const persistenceUnavailable =
      savedId === null && (saveError !== null || !db.isReady());

    uploadSession.evict(uploadId);

    const used = await countThisMonth(userId);
    const wasOverage =
      Number.isFinite(plan.monthlyIncluded) && used > plan.monthlyIncluded;
    const overage = wasOverage
      ? { isOverage: true, overageEuros: plan.overageEuros, used }
      : null;

    // Bill the overage immediately as a Stripe invoice item on the next renewal.
    // Best-effort: if Stripe / customer ID are unavailable we log and move on so
    // the user still gets their dashboard. Saving succeeded; refunding their
    // generation effort is worse than a missed invoice line we can backfill.
    if (wasOverage && plan.overageCents > 0 && savedId !== null) {
      try {
        const customerId = await getStripeCustomerId(userId);
        if (customerId) {
          await createOverageInvoiceItem({
            customerId,
            amountCents: plan.overageCents,
            description: `Datuma — dashboard overage (${plan.name})`,
          });
        }
      } catch (err) {
        console.warn('[billing] failed to record overage invoice item:', err.message);
      }
    }

    res.json({
      id: savedId,
      filename: primaryFilename,
      rowCount: totalRows,
      dashboard: dashboardWithData,
      datasets: dashboardWithData.datasets,
      appendSummary,
      shareToken,
      userId,
      overage,
      persistenceWarning: persistenceUnavailable
        ? "Your dashboard was generated but couldn't be saved — the database is unreachable right now. It won't appear in History if you reload."
        : null,
    });
  } catch (err) {
    console.error('Generate dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Legacy single-file shim — keeps any older client working.
router.post('/', requireUser(), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const userId = getUserId(req);
    const planKey = await getUserPlan(req);
    const plan = getPlan(planKey);

    const rows = parseFile(req.file);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'File contains no data' });
    }
    if (rows.length > plan.rowLimit) {
      return res.status(413).json({
        error: `File has ${rows.length.toLocaleString()} rows, but your ${plan.name} plan allows up to ${plan.rowLimit.toLocaleString()} per file.`,
        code: 'ROW_LIMIT_EXCEEDED',
        rowCount: rows.length,
        rowLimit: plan.rowLimit,
        plan: plan.key,
      });
    }
    const used = await countThisMonth(userId);
    const monthlyIncluded = Number.isFinite(plan.monthlyIncluded)
      ? plan.monthlyIncluded
      : null;
    const overInclusive =
      monthlyIncluded !== null && used >= monthlyIncluded;

    // Hard cap (Starter): no paid overage available, refuse.
    if (overInclusive && plan.overageCents === null) {
      return res.status(402).json({
        error: `You've used all ${monthlyIncluded} dashboards in your ${plan.name} plan this month.`,
        code: 'QUOTA_EXCEEDED',
        used,
        limit: monthlyIncluded,
        plan: plan.key,
      });
    }

    // Soft cap (Pro/Team): allowed past included, but respect the user's
    // monthly spend cap configured in Settings.
    if (overInclusive && plan.overageCents > 0) {
      const spendCap = await getUserSpendCap(req);
      const overageAfter = used - monthlyIncluded + 1;
      const chargeAfterCents = overageAfter * plan.overageCents;
      if (chargeAfterCents > spendCap) {
        return res.status(402).json({
          error:
            spendCap === 0
              ? `You've used all ${monthlyIncluded} dashboards included in your ${plan.name} plan. Raise your monthly spend cap in Settings to keep going at €${plan.overageEuros.toFixed(2)} each.`
              : `Generating this dashboard would put you over your €${(spendCap / 100).toFixed(2)} monthly spend cap. Raise it in Settings to continue.`,
          code: 'SPEND_CAP_HIT',
          used,
          limit: monthlyIncluded,
          spendCapCents: spendCap,
          overageCents: plan.overageCents,
          plan: plan.key,
        });
      }
    }

    const schema = getSchema(rows);
    const stats = getDatasetStats(rows, schema);
    const sample = getRepresentativeSample(rows, 30);
    const baseName = req.file.originalname.replace(/\.[^.]+$/, '');

    const dashboard = await generateDashboard(
      [{ name: baseName, filename: req.file.originalname, rowCount: rows.length, schema, stats, sample }],
      planKey
    );
    const dashboardWithData = attachChartData(
      { [baseName]: { rows, stats } },
      dashboard
    );
    dashboardWithData.datasets = [{
      name: baseName,
      filename: req.file.originalname,
      rowCount: rows.length,
    }];

    // Persist rows on the legacy path too so an "update" against this
    // dashboard later can still append. Same FIFO cap as the main path.
    dashboardWithData.analysisContext = {
      datasets: [{
        name: baseName,
        filename: req.file.originalname,
        rowCount: rows.length,
        schema,
        stats,
        sample,
        rows:
          rows.length <= ROW_CAP_PER_DATASET
            ? rows
            : rows.slice(rows.length - ROW_CAP_PER_DATASET),
        rowsTruncated: rows.length > ROW_CAP_PER_DATASET,
      }],
    };

    let savedId = null;
    let saveError = null;
    try {
      const saved = await saveDashboard({
        userId,
        filename: req.file.originalname,
        rowCount: rows.length,
        dashboard: dashboardWithData,
      });
      savedId = saved?.id ?? null;
    } catch (err) {
      console.warn('Failed to persist dashboard:', err.message);
      saveError = err.message;
    }
    const persistenceUnavailable =
      savedId === null && (saveError !== null || !db.isReady());

    // Recount usage after the save so we can correctly flag overage.
    const usedAfter = await countThisMonth(userId);
    const wasOverage =
      monthlyIncluded !== null && usedAfter > monthlyIncluded;
    const overage = wasOverage
      ? { isOverage: true, overageEuros: plan.overageEuros, used: usedAfter }
      : null;

    // Bill the overage immediately as a Stripe invoice item on the next
    // renewal. Best-effort: if Stripe is unavailable we log and move on; the
    // dashboard is already saved and the user shouldn't lose access over a
    // billing hiccup that we can backfill.
    if (wasOverage && plan.overageCents > 0 && savedId !== null) {
      try {
        const customerId = await getStripeCustomerId(userId);
        if (customerId) {
          await createOverageInvoiceItem({
            customerId,
            amountCents: plan.overageCents,
            description: `Datuma — dashboard overage (${plan.name})`,
          });
        } else {
          console.warn(
            `[billing] no Stripe customer for ${userId}, skipping overage invoice item`
          );
        }
      } catch (err) {
        console.warn('[billing] failed to record overage invoice item:', err.message);
      }
    }

    // Fire-and-forget transactional emails. Both are wrapped — anything
    // throwing here would block the response, which is worse than a missed
    // email we can always backfill.
    fireEmailTriggers({
      userId,
      planName: plan.name,
      monthlyIncluded,
      overageEuros: plan.overageEuros,
      usedAfter,
      dashboard: dashboardWithData,
      savedId,
      filename: req.file.originalname,
    }).catch((err) =>
      console.warn('[email] trigger error:', err.message)
    );

    res.json({
      id: savedId,
      filename: req.file.originalname,
      rowCount: rows.length,
      dashboard: dashboardWithData,
      userId,
      overage,
      persistenceWarning: persistenceUnavailable
        ? "Your dashboard was generated but couldn't be saved — the database is unreachable right now. It won't appear in History if you reload."
        : null,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fires post-save transactional emails. Single-shot per upload — dashboard
// ready always sends, overage-warning fires once per calendar month per user
// (tracked via Clerk publicMetadata.overageWarnedMonth = 'YYYY-MM').
async function fireEmailTriggers({
  userId,
  planName,
  monthlyIncluded,
  overageEuros,
  usedAfter,
  dashboard,
  savedId,
  filename,
}) {
  let clerkClient;
  try {
    ({ clerkClient } = require('@clerk/express'));
  } catch {
    return; // Clerk not wired — nothing to do.
  }

  let user = null;
  try {
    user = await clerkClient.users.getUser(userId);
  } catch (err) {
    console.warn('[email] could not fetch user for triggers:', err.message);
    return;
  }
  if (!user) return;

  // 1) Dashboard ready — always when the dashboard saved successfully.
  if (savedId !== null) {
    try {
      await sendDashboardReady({
        user,
        dashboardTitle: dashboard?.title,
        dashboardId: savedId,
        filename,
      });
    } catch (err) {
      console.warn('[email] dashboard-ready send failed:', err.message);
    }
  }

  // 2) Overage warning — only when crossing 80% AND we haven't already warned
  // this calendar month. Skip on Starter (no overage path) and Enterprise
  // (unlimited).
  if (
    Number.isFinite(monthlyIncluded) &&
    monthlyIncluded > 0 &&
    overageEuros &&
    overageEuros > 0
  ) {
    const ratio = usedAfter / monthlyIncluded;
    const now = new Date();
    const yyyymm = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const lastWarned = user.publicMetadata?.overageWarnedMonth;

    if (ratio >= 0.8 && lastWarned !== yyyymm) {
      try {
        await sendOverageWarning({
          user,
          planName,
          used: usedAfter,
          included: monthlyIncluded,
          overageEuros,
        });
        await clerkClient.users.updateUserMetadata(userId, {
          publicMetadata: {
            ...user.publicMetadata,
            overageWarnedMonth: yyyymm,
          },
        });
      } catch (err) {
        console.warn('[email] overage-warn send failed:', err.message);
      }
    }
  }
}

module.exports = router;
