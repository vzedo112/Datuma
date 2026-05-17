const ss = require('simple-statistics');

function getColumnStats(rows, columnName) {
  const values = rows.map(r => r[columnName]).filter(v => v !== null && v !== undefined && v !== '');

  if (values.length === 0) return null;

  const allNumeric = values.every(v => typeof v === 'number' && !isNaN(v));
  const allDates = values.every(v => !isNaN(Date.parse(v)));

  if (allNumeric) {
    return {
      type: 'numeric',
      count: values.length,
      missing: rows.length - values.length,
      min: ss.min(values),
      max: ss.max(values),
      mean: Number(ss.mean(values).toFixed(2)),
      median: ss.median(values),
      sum: Number(ss.sum(values).toFixed(2)),
      stdDev: Number(ss.standardDeviation(values).toFixed(2)),
    };
  }

  if (allDates && !allNumeric) {
    const dates = values.map(v => new Date(v));
    return {
      type: 'date',
      count: values.length,
      missing: rows.length - values.length,
      earliest: new Date(Math.min(...dates)).toISOString().split('T')[0],
      latest: new Date(Math.max(...dates)).toISOString().split('T')[0],
    };
  }

  const counts = {};
  values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return {
    type: 'categorical',
    count: values.length,
    missing: rows.length - values.length,
    uniqueValues: sorted.length,
    topValues: sorted.slice(0, 5).map(([value, count]) => ({ value, count })),
  };
}

function getDatasetStats(rows, schema) {
  const stats = {};
  schema.forEach(col => {
    stats[col.name] = getColumnStats(rows, col.name);
  });
  return stats;
}

function getRepresentativeSample(rows, size = 30) {
  if (rows.length <= size) return rows;
  const third = Math.floor(size / 3);
  const middleStart = Math.floor(rows.length / 2) - Math.floor(third / 2);
  return [
    ...rows.slice(0, third),
    ...rows.slice(middleStart, middleStart + third),
    ...rows.slice(-third),
  ];
}

module.exports = { getDatasetStats, getRepresentativeSample };
