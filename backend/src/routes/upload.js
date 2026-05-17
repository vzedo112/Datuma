const express = require('express');
const multer = require('multer');
const { parseFile, getSchema } = require('../services/parser');
const { generateDashboard } = require('../services/claude');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const rows = parseFile(req.file);
    const schema = getSchema(rows);
    const sampleRows = rows.slice(0, 30);

    const dashboard = await generateDashboard(schema, sampleRows, rows.length);

    res.json({
      filename: req.file.originalname,
      rowCount: rows.length,
      dashboard,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;