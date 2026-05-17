const { VALID_BUCKETS } = require('./aggregator');

const VALID_CHART_TYPES = ['line', 'bar', 'pie'];
const VALID_TRENDS = ['up', 'down', 'neutral'];
const VALID_SEVERITIES = ['info', 'warning', 'success'];
const VALID_AGGREGATIONS = ['sum', 'avg', 'count', 'min', 'max', 'none'];
const NUMERIC_AGGREGATIONS = ['sum', 'avg', 'min', 'max', 'none'];

function validateDashboard(dashboard, schema, stats = null) {
  const errors = [];
  const columnNames = schema.map(c => c.name);

  if (!dashboard.title) errors.push('Missing title');
  if (!Array.isArray(dashboard.metrics)) errors.push('Metrics must be an array');
  if (!Array.isArray(dashboard.charts)) errors.push('Charts must be an array');
  if (!Array.isArray(dashboard.insights)) errors.push('Insights must be an array');

  (dashboard.metrics || []).forEach((m, i) => {
    if (!m.label) errors.push(`Metric ${i} missing label`);
    if (m.value === undefined) errors.push(`Metric ${i} missing value`);
    if (m.trend && !VALID_TRENDS.includes(m.trend)) {
      errors.push(`Metric ${i} has invalid trend: ${m.trend}`);
    }
  });

  (dashboard.charts || []).forEach((c, i) => {
    if (!VALID_CHART_TYPES.includes(c.type)) {
      errors.push(`Chart ${i} has invalid type: ${c.type}`);
    }
    if (!c.title) errors.push(`Chart ${i} missing title`);
    if (!c.explanation) errors.push(`Chart ${i} missing explanation`);

    if (!c.aggregation) {
      errors.push(`Chart ${i} missing aggregation (one of: ${VALID_AGGREGATIONS.join(', ')})`);
    } else if (!VALID_AGGREGATIONS.includes(c.aggregation)) {
      errors.push(`Chart ${i} has invalid aggregation: ${c.aggregation}`);
    }

    if (c.xAxis && !columnNames.includes(c.xAxis)) {
      errors.push(`Chart ${i} references unknown xAxis column: ${c.xAxis}`);
    }

    const needsYAxis = c.aggregation !== 'count';
    if (needsYAxis) {
      if (!c.yAxis) {
        errors.push(`Chart ${i} requires a yAxis when aggregation is "${c.aggregation}"`);
      } else if (!columnNames.includes(c.yAxis)) {
        errors.push(`Chart ${i} references unknown yAxis column: ${c.yAxis}`);
      } else if (
        stats &&
        NUMERIC_AGGREGATIONS.includes(c.aggregation) &&
        stats[c.yAxis] &&
        stats[c.yAxis].type !== 'numeric'
      ) {
        errors.push(
          `Chart ${i} yAxis "${c.yAxis}" is ${stats[c.yAxis].type}, but aggregation "${c.aggregation}" requires a numeric column`
        );
      }
    }

    if (c.bucket && !VALID_BUCKETS.includes(c.bucket)) {
      errors.push(`Chart ${i} has invalid bucket: ${c.bucket} (allowed: ${VALID_BUCKETS.join(', ')})`);
    }
    if (
      c.xAxis &&
      stats &&
      stats[c.xAxis] &&
      stats[c.xAxis].type === 'date' &&
      c.aggregation !== 'none' &&
      !c.bucket
    ) {
      errors.push(
        `Chart ${i} has date xAxis "${c.xAxis}" with aggregation "${c.aggregation}" but missing bucket (use one of: ${VALID_BUCKETS.join(', ')})`
      );
    }
  });

  (dashboard.insights || []).forEach((ins, i) => {
    if (ins.severity && !VALID_SEVERITIES.includes(ins.severity)) {
      errors.push(`Insight ${i} has invalid severity: ${ins.severity}`);
    }
    if (!ins.title) errors.push(`Insight ${i} missing title`);
    if (!ins.description) errors.push(`Insight ${i} missing description`);
  });

  return { valid: errors.length === 0, errors };
}

module.exports = { validateDashboard };
