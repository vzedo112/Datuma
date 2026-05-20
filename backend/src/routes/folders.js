const express = require('express');
const { requireUser, getUserId } = require('../middleware/auth');
const {
  listFolders,
  countUnfiled,
  createFolder,
  renameFolder,
  deleteFolder,
  moveDashboardToFolder,
} = require('../services/folderStore');

const router = express.Router();

// GET /api/folders → all folders for the current user, with dashboard counts
//                    plus the count of unfiled (top-level) dashboards.
router.get('/', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const [items, unfiled] = await Promise.all([
      listFolders(userId),
      countUnfiled(userId),
    ]);
    res.json({ items, unfiled });
  } catch (err) {
    console.error('List folders error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const folder = await createFolder(userId, name);
    if (!folder) return res.status(503).json({ error: 'Persistence unavailable' });
    res.status(201).json({ folder });
  } catch (err) {
    console.error('Create folder error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid folder id' });
    }
    const { name } = req.body || {};
    if (typeof name !== 'string') {
      return res.status(400).json({ error: 'Missing name' });
    }
    const ok = await renameFolder(userId, id, name);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Rename folder error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid folder id' });
    }
    // Dashboards in this folder fall back to top-level via ON DELETE SET NULL.
    const ok = await deleteFolder(userId, id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete folder error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/folders/move — body: { dashboardId, folderId | null }
router.patch('/move', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const { dashboardId, folderId } = req.body || {};
    const did = Number(dashboardId);
    if (!Number.isInteger(did)) {
      return res.status(400).json({ error: 'dashboardId required' });
    }
    let target = null;
    if (folderId !== null && folderId !== undefined) {
      const fid = Number(folderId);
      if (!Number.isInteger(fid)) {
        return res.status(400).json({ error: 'folderId must be an integer or null' });
      }
      target = fid;
    }
    const ok = await moveDashboardToFolder(userId, did, target);
    if (!ok) return res.status(404).json({ error: 'Dashboard or folder not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Move dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
