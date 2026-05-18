const ss = require('simple-statistics');

const DATE_FORMATS = [
  { name: 'YYYY-MM-DD', re: /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/ },
  { name: 'DD/MM/YYYY', re: /^\d{1,2}\/\d{1,2}\/\d{4}$/ },
  { name: 'MM/DD/YYYY', re: /^\d{1,2}-\d{1,2}-\d{4}$/ },
  { name: 'DD-MM-YYYY', re: /^\d{1,2}\.\d{1,2}\.\d{4}$/ },
  { name: 'DD Mon YYYY', re: /^\d{1,2} [A-Za-z]{3,9} \d{4}$/ },
];

function classifyType(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && !isNaN(value)) return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    if (!isNaN(Number(trimmed)) && Number.isFinite(Number(trimmed))) return 'number';
    if (DATE_FORMATS.some((f) => f.re.test(trimmed))) return 'date';
    return 'string';
  }
  if (value instanceof Date && !isNaN(value)) return 'date';
  return 'string';
}

function detectDateFormat(value) {
  if (value === null || value === undefined || value === '') return null;
  const s = String(value).trim();
  for (const f of DATE_FORMATS) {
    if (f.re.test(s)) return f.name;
  }
  return null;
}

function analyzeNulls(rows, schema) {
  const flags = [];
  for (const col of schema) {
    let count = 0;
    for (const r of rows) {
      const v = r[col.name];
      if (v === null || v === undefined || v === '') count++;
    }
    if (count > 0) {
      flags.push({
        column: col.name,
        count,
        percentage: Number(((count / rows.length) * 100).toFixed(1)),
      });
    }
  }
  return flags.sort((a, b) => b.count - a.count);
}

function analyzeDuplicates(rows) {
  if (rows.length === 0) return { count: 0, examples: [] };
  const seen = new Map();
  for (const r of rows) {
    const key = JSON.stringify(
      Object.keys(r)
        .sort()
        .reduce((acc, k) => {
          acc[k] = r[k];
          return acc;
        }, {})
    );
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  let dupes = 0;
  const examples = [];
  for (const [key, count] of seen.entries()) {
    if (count > 1) {
      dupes += count - 1;
      if (examples.length < 3) examples.push(JSON.parse(key));
    }
  }
  return { count: dupes, examples };
}

function analyzeDateFormats(rows, schema) {
  const flags = [];
  for (const col of schema) {
    const seen = new Map();
    let candidates = 0;
    for (const r of rows) {
      const fmt = detectDateFormat(r[col.name]);
      if (fmt) {
        candidates++;
        seen.set(fmt, (seen.get(fmt) || 0) + 1);
      }
    }
    if (candidates < Math.max(3, rows.length * 0.05)) continue;
    if (seen.size >= 2) {
      flags.push({
        column: col.name,
        formats: [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n),
        inconsistent: true,
      });
    }
  }
  return flags;
}

function analyzeMixedTypes(rows, schema) {
  const flags = [];
  for (const col of schema) {
    const typeBuckets = new Map();
    for (const r of rows) {
      const t = classifyType(r[col.name]);
      if (!t) continue;
      if (!typeBuckets.has(t)) typeBuckets.set(t, []);
      const bucket = typeBuckets.get(t);
      if (bucket.length < 3) bucket.push(r[col.name]);
    }
    if (typeBuckets.size >= 2) {
      flags.push({
        column: col.name,
        types: [...typeBuckets.keys()],
        samples: [...typeBuckets.entries()].map(([type, vals]) => ({ type, examples: vals })),
      });
    }
  }
  return flags;
}

function analyzeOutliers(rows, schema) {
  const flags = [];
  for (const col of schema) {
    const values = rows
      .map((r) => r[col.name])
      .map((v) => (typeof v === 'number' ? v : Number(v)))
      .filter((v) => typeof v === 'number' && !isNaN(v) && isFinite(v));
    if (values.length < 10) continue;
    const mean = ss.mean(values);
    const std = ss.standardDeviation(values);
    if (std === 0) continue;
    const outliers = values.filter((v) => Math.abs(v - mean) > 3 * std);
    if (outliers.length > 0) {
      outliers.sort((a, b) => Math.abs(b - mean) - Math.abs(a - mean));
      flags.push({
        column: col.name,
        count: outliers.length,
        method: '3-sigma',
        examples: outliers.slice(0, 5),
      });
    }
  }
  return flags;
}

function computeSeverity(report) {
  const total = report.totalRows || 1;
  if (
    report.mixedTypes.length > 0 ||
    report.dateFormats.length > 0 ||
    (report.duplicateRows.count / total) >= 0.01
  ) {
    return 'critical';
  }
  if (
    report.nullCounts.length > 0 ||
    report.outliers.length > 0 ||
    report.duplicateRows.count > 0
  ) {
    return 'warn';
  }
  return 'ok';
}

function analyzeQuality(rows, schema) {
  const report = {
    totalRows: rows.length,
    nullCounts: analyzeNulls(rows, schema),
    duplicateRows: analyzeDuplicates(rows),
    dateFormats: analyzeDateFormats(rows, schema),
    mixedTypes: analyzeMixedTypes(rows, schema),
    outliers: analyzeOutliers(rows, schema),
  };
  report.severity = computeSeverity(report);
  return report;
}

module.exports = { analyzeQuality };
