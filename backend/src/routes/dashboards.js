const express = require('express');
const {
  requireUser,
  getUserId,
  getUserPlan,
  getUserSpendCap,
} = require('../middleware/auth');
const { getPlan, serializePlan } = require('../services/plans');
const {
  listDashboards,
  getDashboard,
  countThisMonth,
  createShareToken,
  revokeShareToken,
  renameDashboard,
  deleteDashboard,
  updateDashboardSpec,
} = require('../services/dashboardStore');
const { validateDashboard } = require('../services/validator');
const { attachChartData } = require('../services/aggregator');
const {
  listMessages,
  appendMessage,
  clearThread,
  countUserMessagesThisMonth,
} = require('../services/chatStore');
const { reply: chatReply } = require('../services/chat');
const {
  createOverageInvoiceItem,
  isStripeConfigured,
} = require('../services/stripe');
const { getStripeCustomerId } = require('../middleware/auth');

const CHAT_PLANS = new Set(['pro', 'team', 'enterprise']);

const router = express.Router();

router.get('/', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    // ?folder=123 → that folder; ?folder=none → top-level only; absent → all
    let folderId;
    if (req.query.folder === 'none') folderId = null;
    else if (req.query.folder !== undefined) {
      const n = Number(req.query.folder);
      if (Number.isInteger(n)) folderId = n;
    }
    const items = await listDashboards(userId, { folderId });
    res.json({ items });
  } catch (err) {
    console.error('List dashboards error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/usage', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const [used, planKey, spendCapCents] = await Promise.all([
      countThisMonth(userId),
      getUserPlan(req),
      getUserSpendCap(req),
    ]);
    const plan = getPlan(planKey);

    const monthlyIncluded = Number.isFinite(plan.monthlyIncluded)
      ? plan.monthlyIncluded
      : null;
    const overageCount =
      monthlyIncluded === null ? 0 : Math.max(0, used - monthlyIncluded);
    const overageCents =
      plan.overageCents !== null && plan.overageCents !== undefined
        ? overageCount * plan.overageCents
        : 0;

    res.json({
      used,
      overageCount,
      overageCents,
      spendCapCents,
      plan: serializePlan(plan),
    });
  } catch (err) {
    console.error('Usage error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid dashboard id' });
    }
    const row = await getDashboard(id, userId);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({
      id: row.id,
      name: row.name ?? null,
      filename: row.filename,
      rowCount: row.row_count,
      dashboard: row.dashboard,
      createdAt: row.created_at,
      shareToken: row.share_token ?? null,
    });
  } catch (err) {
    console.error('Get dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid dashboard id' });
    }
    const { name } = req.body || {};
    if (typeof name !== 'string') {
      return res.status(400).json({ error: 'Missing name' });
    }
    const ok = await renameDashboard(id, userId, name);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, name: name.trim().slice(0, 120) });
  } catch (err) {
    console.error('Rename dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/dashboards/:id/spec — update the dashboard's chart spec from
// the editor. Body: { charts: [...] }. We validate each chart against the
// stored dataset schemas, re-aggregate against the stored rows, and persist
// the result. Metrics + insights are preserved as-is; only `charts` is
// rewritten. The endpoint is idempotent and safe to retry.
router.patch('/:id/spec', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid dashboard id' });
    }

    const incomingCharts = req.body?.charts;
    if (!Array.isArray(incomingCharts)) {
      return res.status(400).json({ error: 'charts must be an array' });
    }
    if (incomingCharts.length > 12) {
      return res.status(400).json({ error: 'A dashboard supports up to 12 charts.' });
    }

    const row = await getDashboard(id, userId);
    if (!row) return res.status(404).json({ error: 'Not found' });

    const current = row.dashboard || {};
    const datasets = current?.analysisContext?.datasets || [];
    if (datasets.length === 0) {
      return res.status(409).json({
        error:
          "This dashboard was generated before we started storing source rows, so it can't be edited. Re-run it to enable editing.",
        code: 'NO_SOURCE_ROWS',
      });
    }

    // Validate each incoming chart against the appropriate dataset schema.
    const schemaByDataset = Object.fromEntries(
      datasets.map((d) => [d.name, d.schema])
    );
    const statsByDataset = Object.fromEntries(
      datasets.map((d) => [d.name, d.stats])
    );
    const validation = validateDashboard(
      { ...current, charts: incomingCharts },
      schemaByDataset,
      statsByDataset
    );
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.errors.join('; '),
        code: 'INVALID_CHART_SPEC',
        details: validation.errors,
      });
    }

    // Re-aggregate every chart against the stored rows so the editor doesn't
    // need to know about aggregation. The aggregator picks the right dataset
    // per chart via chart.datasetName.
    const datasetsByName = Object.fromEntries(
      datasets.map((d) => [d.name, { rows: d.rows || [], stats: d.stats }])
    );
    const reAggregated = attachChartData(datasetsByName, {
      ...current,
      charts: incomingCharts,
    });

    const updated = await updateDashboardSpec(id, userId, reAggregated);
    if (!updated) return res.status(404).json({ error: 'Not found' });

    res.json({
      id: updated.id,
      name: updated.name ?? null,
      filename: updated.filename,
      rowCount: updated.row_count,
      dashboard: updated.dashboard,
      createdAt: updated.created_at,
      shareToken: updated.share_token ?? null,
    });
  } catch (err) {
    console.error('Edit dashboard spec error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid dashboard id' });
    }
    const ok = await deleteDashboard(id, userId);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/share', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid dashboard id' });
    }
    const token = await createShareToken(id, userId);
    if (!token) return res.status(404).json({ error: 'Not found' });
    res.json({ token });
  } catch (err) {
    console.error('Create share token error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/share', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid dashboard id' });
    }
    const ok = await revokeShareToken(id, userId);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Revoke share token error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Chat (Pro / Team / Enterprise only) ---

router.get('/:id/chat', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid dashboard id' });
    }

    const planKey = await getUserPlan(req);
    const plan = getPlan(planKey);
    const [messages, used] = await Promise.all([
      listMessages(id, userId),
      countUserMessagesThisMonth(userId),
    ]);
    res.json({
      messages,
      allowed: CHAT_PLANS.has(planKey),
      planKey,
      usage: {
        used,
        included: Number.isFinite(plan.chatIncluded) ? plan.chatIncluded : null,
        overageCents: plan.chatOverageCents ?? null,
      },
    });
  } catch (err) {
    console.error('List chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/chat', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid dashboard id' });
    }

    const planKey = await getUserPlan(req);
    if (!CHAT_PLANS.has(planKey)) {
      return res.status(402).json({
        error: "Ask Datuma is a Pro feature — upgrade to chat with your dashboards.",
        code: 'CHAT_REQUIRES_UPGRADE',
        currentPlan: planKey,
      });
    }

    const { message } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const trimmed = message.trim().slice(0, 2000);

    const row = await getDashboard(id, userId);
    if (!row) return res.status(404).json({ error: 'Dashboard not found' });

    // Quota gate. Pro has 200 included, Team 1000, Enterprise unlimited.
    // Pro/Team pay overage per message past the include; Enterprise free.
    const plan = getPlan(planKey);
    const usedBefore = await countUserMessagesThisMonth(userId);
    const includedFinite = Number.isFinite(plan.chatIncluded);
    const overInclude = includedFinite && usedBefore >= plan.chatIncluded;
    const overageCents = plan.chatOverageCents ?? 0;

    // If over the include and the plan has no paid overage path (shouldn't
    // happen for Pro/Team but guard anyway), block.
    if (overInclude && (plan.chatOverageCents === null || overageCents <= 0)) {
      return res.status(402).json({
        error: `You've used all ${plan.chatIncluded} chat messages included in your ${plan.name} plan this month.`,
        code: 'CHAT_QUOTA_EXCEEDED',
        used: usedBefore,
        limit: plan.chatIncluded,
        plan: plan.key,
      });
    }

    // Spend-cap check — overage chat messages count against the same monthly
    // spend cap as dashboard overage. If charging this one would push the user
    // past their cap, refuse.
    if (overInclude && overageCents > 0) {
      const spendCap = await getUserSpendCap(req);
      const overageAfter = usedBefore - plan.chatIncluded + 1;
      const chargeAfterCents = overageAfter * overageCents;
      if (chargeAfterCents > spendCap) {
        return res.status(402).json({
          error:
            spendCap === 0
              ? `You've used all ${plan.chatIncluded} chat messages included in your ${plan.name} plan. Raise your monthly spend cap in Settings to keep chatting at €${(overageCents / 100).toFixed(2)} each.`
              : `Sending this chat message would put you over your €${(spendCap / 100).toFixed(2)} monthly spend cap.`,
          code: 'SPEND_CAP_HIT',
          used: usedBefore,
          limit: plan.chatIncluded,
          spendCapCents: spendCap,
          overageCents,
          plan: plan.key,
        });
      }
    }

    // Load existing thread first so the user message + reply share the same
    // history snapshot Claude sees.
    const existing = await listMessages(id, userId);

    const userMsg = await appendMessage({
      dashboardId: id,
      userId,
      role: 'user',
      content: trimmed,
    });

    const { text } = await chatReply({
      dashboard: row.dashboard,
      thread: existing,
      userMessage: trimmed,
    });

    const finalText = text || "I couldn't generate a reply for that — try rewording the question.";

    const assistantMsg = await appendMessage({
      dashboardId: id,
      userId,
      role: 'assistant',
      content: finalText,
    });

    // Bill chat overage if this message landed past the included quota. Same
    // best-effort pattern as dashboard overage — failure here just logs.
    if (overInclude && overageCents > 0 && isStripeConfigured) {
      try {
        const customerId = await getStripeCustomerId(userId);
        if (customerId) {
          await createOverageInvoiceItem({
            customerId,
            amountCents: overageCents,
            description: `Datuma — chat message overage (${plan.name})`,
          });
        }
      } catch (err) {
        console.warn('[billing] failed to record chat overage:', err.message);
      }
    }

    res.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      usage: {
        used: usedBefore + 1,
        included: includedFinite ? plan.chatIncluded : null,
        overageCents: plan.chatOverageCents ?? null,
      },
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Chat failed' });
  }
});

router.delete('/:id/chat', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid dashboard id' });
    }
    await clearThread(id, userId);
    res.json({ ok: true });
  } catch (err) {
    console.error('Clear chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
