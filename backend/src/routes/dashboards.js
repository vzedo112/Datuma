const express = require('express');
const { requireUser, getUserId, getUserPlan } = require('../middleware/auth');
const { getPlan, serializePlan } = require('../services/plans');
const {
  listDashboards,
  getDashboard,
  countThisMonth,
} = require('../services/dashboardStore');

const router = express.Router();

router.get('/', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const items = await listDashboards(userId);
    res.json({ items });
  } catch (err) {
    console.error('List dashboards error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/usage', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const [used, planKey] = await Promise.all([
      countThisMonth(userId),
      getUserPlan(req),
    ]);
    const plan = getPlan(planKey);
    res.json({
      used,
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
      filename: row.filename,
      rowCount: row.row_count,
      dashboard: row.dashboard,
      createdAt: row.created_at,
    });
  } catch (err) {
    console.error('Get dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
