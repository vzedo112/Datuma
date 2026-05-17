const VALID_BUCKETS = ['none', 'day', 'week', 'month', 'quarter', 'year'];
const OUTLIER_FACTOR = 20;

function bucketDate(value, bucket) {
  if (!bucket || bucket === 'none') return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;

  const y = d.getUTCFullYear();
  if (bucket === 'year') return `${y}`;
  if (bucket === 'quarter') {
    const q = Math.floor(d.getUTCMonth() / 3) + 1;
    return `${y}-Q${q}`;
  }
  if (bucket === 'month') {
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
  if (bucket === 'day') {
    return d.toISOString().split('T')[0];
  }
  if (bucket === 'week') {
    const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
    return `${tmp.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }
  return value;
}

function normalizeCategoricalKey(value) {
  return String(value).trim().toLowerCase();
}

function isOutlier(value, median) {
  if (typeof median !== 'number' || median === 0) return false;
  if (typeof value !== 'number' || isNaN(value)) return false;
  return Math.abs(value) > OUTLIER_FACTOR * Math.abs(median);
}

function pickDisplay(displayCounts) {
  let best = null;
  let bestCount = -1;
  for (const [d, c] of displayCounts) {
    if (c > bestCount) {
      best = d;
      bestCount = c;
    }
  }
  return best;
}

function sortData(data, chartType) {
  if (chartType === 'line') {
    return [...data].sort((a, b) => {
      const an = Number(a.x);
      const bn = Number(b.x);
      if (!isNaN(an) && !isNaN(bn)) return an - bn;
      return String(a.x).localeCompare(String(b.x));
    });
  }
  return [...data].sort((a, b) => b.y - a.y);
}

function aggregateChart(rows, chart, stats = null) {
  const { xAxis, yAxis, aggregation, bucket, type, title } = chart;

  if (!xAxis) return [];

  const xType = stats && stats[xAxis] ? stats[xAxis].type : null;
  const yMedian = stats && yAxis && stats[yAxis] ? stats[yAxis].median : null;
  const isCategorical = xType === 'categorical';
  const isDateBucketed = bucket && bucket !== 'none';

  const baseRows = rows.filter(r => r[xAxis] !== null && r[xAxis] !== undefined && r[xAxis] !== '');

  if (aggregation === 'none') {
    if (!yAxis) return [];
    let dropped = 0;
    const data = [];
    for (const r of baseRows) {
      if (r[yAxis] === null || r[yAxis] === undefined || r[yAxis] === '') continue;
      const y = typeof r[yAxis] === 'number' ? r[yAxis] : Number(r[yAxis]);
      if (isNaN(y)) continue;
      if (isOutlier(y, yMedian)) { dropped++; continue; }
      const x = isDateBucketed ? bucketDate(r[xAxis], bucket) : r[xAxis];
      if (x === null) continue;
      data.push({ x, y });
    }
    if (dropped > 0) console.log(`Chart "${title}": dropped ${dropped} outlier value(s) from yAxis "${yAxis}"`);
    return sortData(data, type);
  }

  const groups = new Map();
  for (const row of baseRows) {
    const rawX = row[xAxis];
    let key;
    if (isDateBucketed) key = bucketDate(rawX, bucket);
    else if (isCategorical) key = normalizeCategoricalKey(rawX);
    else key = rawX;
    if (key === null || key === undefined) continue;

    if (!groups.has(key)) groups.set(key, { rows: [], displayCounts: new Map() });
    const g = groups.get(key);
    g.rows.push(row);

    const displayLabel = isDateBucketed ? key : String(rawX);
    g.displayCounts.set(displayLabel, (g.displayCounts.get(displayLabel) || 0) + 1);
  }

  const data = [];
  let totalDropped = 0;
  for (const [, group] of groups.entries()) {
    let y;
    if (aggregation === 'count') {
      y = group.rows.length;
    } else {
      const raw = group.rows
        .map(r => r[yAxis])
        .map(v => (typeof v === 'number' ? v : Number(v)))
        .filter(v => !isNaN(v));
      const values = raw.filter(v => {
        if (isOutlier(v, yMedian)) { totalDropped++; return false; }
        return true;
      });
      if (values.length === 0) continue;
      if (aggregation === 'sum') y = values.reduce((s, v) => s + v, 0);
      else if (aggregation === 'avg') y = values.reduce((s, v) => s + v, 0) / values.length;
      else if (aggregation === 'min') y = Math.min(...values);
      else if (aggregation === 'max') y = Math.max(...values);
      else continue;
    }
    data.push({ x: pickDisplay(group.displayCounts), y: Number(y.toFixed(2)) });
  }

  if (totalDropped > 0) console.log(`Chart "${title}": dropped ${totalDropped} outlier value(s) from yAxis "${yAxis}"`);
  return sortData(data, type);
}

function attachChartData(rows, dashboard, stats = null) {
  if (!dashboard || !Array.isArray(dashboard.charts)) return dashboard;
  return {
    ...dashboard,
    charts: dashboard.charts.map(chart => ({
      ...chart,
      data: aggregateChart(rows, chart, stats),
    })),
  };
}

module.exports = { attachChartData, VALID_BUCKETS };
