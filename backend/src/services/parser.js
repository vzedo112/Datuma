const Papa = require('papaparse');
const XLSX = require('xlsx');

function parseCSV(buffer) {
  const text = buffer.toString('utf-8');
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  return result.data;
}

function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
}

function parseFile(file) {
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (ext === 'csv') return parseCSV(file.buffer);
  if (ext === 'xlsx' || ext === 'xls') return parseExcel(file.buffer);
  throw new Error('Unsupported file type');
}

function getSchema(rows) {
  if (rows.length === 0) return [];
  const sample = rows[0];
  return Object.keys(sample).map(key => ({
    name: key,
    type: typeof sample[key],
  }));
}

module.exports = { parseFile, getSchema };