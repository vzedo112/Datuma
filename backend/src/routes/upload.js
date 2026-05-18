const express = require('express');
const multer = require('multer');
const { parseFile, getSchema } = require('../services/parser');
const { getDatasetStats, getRepresentativeSample } = require('../services/stats');
const { analyzeQuality } = require('../services/dataQuality');
const { analyzeCrossFile, analyzeCrossUpload } = require('../services/overlapAnalysis');
const { generateDashboard } = require('../services/claude');
const { attachChartData } = require('../services/aggregator');
const { requireUser, getUserId, getUserPlan } = require('../middleware/auth');
const {
  saveDashboard,
  countThisMonth,
  listRecentWithContext,
  getDashboard,
} = require('../services/dashboardStore');
const { getPlan } = require('../services/plans');
const uploadSession = require('../services/uploadSession');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const HARD_FILE_CEILING = 20;

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

      if (overInclusive && plan.overageEuros === null) {
        return res.status(402).json({
          error: `You've used all ${monthlyIncluded} dashboards in your ${plan.name} plan this month. Upgrade to keep going.`,
          code: 'QUOTA_EXCEEDED',
          used,
          limit: monthlyIncluded,
          plan: plan.key,
        });
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

router.post('/generate', requireUser(), express.json(), async (req, res) => {
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

    const totalRows = datasets.reduce((sum, d) => sum + d.rowCount, 0);
    const primaryFilename = datasets.length === 1
      ? datasets[0].filename
      : `${datasets.length} files`;

    let savedId = null;
    let shareToken = null;
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
    }

    uploadSession.evict(uploadId);

    const used = await countThisMonth(userId);
    const overage = Number.isFinite(plan.monthlyIncluded) && used > plan.monthlyIncluded
      ? { isOverage: true, overageEuros: plan.overageEuros, used }
      : null;

    res.json({
      id: savedId,
      filename: primaryFilename,
      rowCount: totalRows,
      dashboard: dashboardWithData,
      datasets: dashboardWithData.datasets,
      shareToken,
      userId,
      overage,
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
    if (
      Number.isFinite(plan.monthlyIncluded) &&
      used >= plan.monthlyIncluded &&
      plan.overageEuros === null
    ) {
      return res.status(402).json({
        error: `You've used all ${plan.monthlyIncluded} dashboards in your ${plan.name} plan this month.`,
        code: 'QUOTA_EXCEEDED',
        used,
        limit: plan.monthlyIncluded,
        plan: plan.key,
      });
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

    let savedId = null;
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
    }

    res.json({
      id: savedId,
      filename: req.file.originalname,
      rowCount: rows.length,
      dashboard: dashboardWithData,
      userId,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
