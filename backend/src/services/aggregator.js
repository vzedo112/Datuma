const VALID_BUCKETS = ['none', 'day', 'week', 'month', 'quarter', 'year'];

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

function aggregateChart(rows, chart) {
  const { xAxis, yAxis, aggregation, bucket, type } = chart;

  if (!xAxis) return [];

  const baseRows = rows.filter(r => r[xAxis] !== null && r[xAxis] !== undefined && r[xAxis] !== '');

  if (aggregation === 'none') {
    if (!yAxis) return [];
    const data = baseRows
      .filter(r => r[yAxis] !== null && r[yAxis] !== undefined && r[yAxis] !== '')
      .map(r => ({
        x: bucketDate(r[xAxis], bucket),
        y: typeof r[yAxis] === 'number' ? r[yAxis] : Number(r[yAxis]),
      }))
      .filter(p => p.x !== null && !isNaN(p.y));
    return sortData(data, type);
  }

  const groups = new Map();
  for (const row of baseRows) {
    const key = bucketDate(row[xAxis], bucket);
    if (key === null || key === undefined) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const data = [];
  for (const [key, group] of groups.entries()) {
    let y;
    if (aggregation === 'count') {
      y = group.length;
    } else {
      const values = group
        .map(r => r[yAxis])
        .map(v => (typeof v === 'number' ? v : Number(v)))
        .filter(v => !isNaN(v));
      if (values.length === 0) continue;
      if (aggregation === 'sum') y = values.reduce((s, v) => s + v, 0);
      else if (aggregation === 'avg') y = values.reduce((s, v) => s + v, 0) / values.length;
      else if (aggregation === 'min') y = Math.min(...values);
      else if (aggregation === 'max') y = Math.max(...values);
      else continue;
    }
    data.push({ x: key, y: Number(y.toFixed(2)) });
  }

  return sortData(data, type);
}

function attachChartData(rows, dashboard) {
  if (!dashboard || !Array.isArray(dashboard.charts)) return dashboard;
  return {
    ...dashboard,
    charts: dashboard.charts.map(chart => ({
      ...chart,
      data: aggregateChart(rows, chart),
    })),
  };
}

module.exports = { attachChartData, VALID_BUCKETS };
