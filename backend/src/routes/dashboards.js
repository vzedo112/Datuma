const express = require('express');
const { requireUser, getUserId, getUserPlan } = require('../middleware/auth');
const { getPlan, serializePlan } = require('../services/plans');
const {
  listDashboards,
  getDashboard,
  countThisMonth,
  createShareToken,
  revokeShareToken,
  renameDashboard,
  deleteDashboard,
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

module.exports = router;
