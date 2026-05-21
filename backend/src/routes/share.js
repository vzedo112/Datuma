const express = require('express');
const { getDashboardByToken } = require('../services/dashboardStore');

const router = express.Router();

// Public viewers see only the rendered dashboard, never the raw rows or
// append-history that lives in analysisContext. This is the user's actual
// data — only the owner gets it (via the authed GET /api/dashboards/:id).
function stripPrivateFields(dashboard) {
  if (!dashboard || typeof dashboard !== 'object') return dashboard;
  const { analysisContext, appendSummary, ...safe } = dashboard;
  return safe;
}

router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || typeof token !== 'string' || token.length > 200) {
      return res.status(404).json({ error: 'Not found' });
    }
    const row = await getDashboardByToken(token);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({
      filename: row.filename,
      rowCount: row.row_count,
      dashboard: stripPrivateFields(row.dashboard),
      createdAt: row.created_at,
    });
  } catch (err) {
    console.error('Get shared dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
