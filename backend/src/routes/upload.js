const express = require('express');
const multer = require('multer');
const { parseFile, getSchema } = require('../services/parser');
const { getDatasetStats, getRepresentativeSample } = require('../services/stats');
const { generateDashboard } = require('../services/claude');
const { attachChartData } = require('../services/aggregator');
const { requireUser, getUserId, getUserPlan } = require('../middleware/auth');
const { saveDashboard, countThisMonth } = require('../services/dashboardStore');
const { getPlan } = require('../services/plans');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', requireUser(), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = getUserId(req);
    const planKey = await getUserPlan(req);
    const plan = getPlan(planKey);

    const rows = parseFile(req.file);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'File contains no data' });
    }

    // Row-count cap (per plan)
    if (rows.length > plan.rowLimit) {
      return res.status(413).json({
        error: `File has ${rows.length.toLocaleString()} rows, but your ${plan.name} plan allows up to ${plan.rowLimit.toLocaleString()} per file.`,
        code: 'ROW_LIMIT_EXCEEDED',
        rowCount: rows.length,
        rowLimit: plan.rowLimit,
        plan: plan.key,
      });
    }

    // Monthly quota check
    const used = await countThisMonth(userId);
    const monthlyIncluded = plan.monthlyIncluded;
    const overInclusive =
      Number.isFinite(monthlyIncluded) && used >= monthlyIncluded;

    if (overInclusive && plan.overageEuros === null) {
      // Hard cap (Starter)
      return res.status(402).json({
        error: `You've used all ${monthlyIncluded} dashboards in your ${plan.name} plan this month. Upgrade to keep going.`,
        code: 'QUOTA_EXCEEDED',
        used,
        limit: monthlyIncluded,
        plan: plan.key,
      });
    }

    const schema = getSchema(rows);
    const stats = getDatasetStats(rows, schema);
    const sampleRows = getRepresentativeSample(rows, 30);

    const dashboard = await generateDashboard(schema, sampleRows, stats, rows.length, planKey);
    const dashboardWithData = attachChartData(rows, dashboard, stats);

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
      overage: overInclusive
        ? { isOverage: true, overageEuros: plan.overageEuros, used: used + 1 }
        : null,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
