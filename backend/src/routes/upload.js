const express = require('express');
const multer = require('multer');
const { parseFile, getSchema } = require('../services/parser');
const { getDatasetStats, getRepresentativeSample } = require('../services/stats');
const { generateDashboard } = require('../services/claude');
const { attachChartData } = require('../services/aggregator');
const { requireUser, getUserId } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', requireUser(), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = getUserId(req);
    const rows = parseFile(req.file);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'File contains no data' });
    }

    const schema = getSchema(rows);
    const stats = getDatasetStats(rows, schema);
    const sampleRows = getRepresentativeSample(rows, 30);

    const dashboard = await generateDashboard(schema, sampleRows, stats, rows.length);
    const dashboardWithData = attachChartData(rows, dashboard, stats);

    res.json({
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
