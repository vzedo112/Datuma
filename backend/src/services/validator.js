const { VALID_BUCKETS } = require('./aggregator');

const VALID_CHART_TYPES = ['line', 'bar', 'pie', 'area', 'donut', 'horizontal-bar', 'scatter'];
const VALID_TRENDS = ['up', 'down', 'neutral'];
const VALID_SEVERITIES = ['info', 'warning', 'success'];
const VALID_AGGREGATIONS = ['sum', 'avg', 'count', 'min', 'max', 'none'];
const NUMERIC_AGGREGATIONS = ['sum', 'avg', 'min', 'max', 'none'];

// schemaByDataset: { [datasetName]: schema[] }
// statsByDataset:  { [datasetName]: stats }
// For single-dataset (legacy) callers, pass plain arrays/objects — they'll be wrapped.
function validateDashboard(dashboard, schemaByDataset, statsByDataset = null) {
  if (Array.isArray(schemaByDataset)) {
    schemaByDataset = { __single__: schemaByDataset };
    statsByDataset = statsByDataset ? { __single__: statsByDataset } : null;
  }

  const errors = [];
  const datasetNames = Object.keys(schemaByDataset);
  const isMulti = datasetNames.length > 1;
  const singleName = datasetNames[0];

  const resolveDatasetName = (name) => {
    if (!name) return singleName;
    if (datasetNames.includes(name)) return name;
    return null;
  };

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

    let dsName = isMulti ? c.datasetName : singleName;
    if (isMulti && !c.datasetName) {
      errors.push(`Chart ${i} missing datasetName (must be one of: ${datasetNames.join(', ')})`);
    } else {
      dsName = resolveDatasetName(c.datasetName);
      if (isMulti && !dsName) {
        errors.push(`Chart ${i} references unknown dataset: ${c.datasetName}`);
      }
    }

    const schema = dsName ? schemaByDataset[dsName] : null;
    const stats = dsName && statsByDataset ? statsByDataset[dsName] : null;
    const columnNames = schema ? schema.map((col) => col.name) : [];

    if (c.xAxis && columnNames.length && !columnNames.includes(c.xAxis)) {
      errors.push(`Chart ${i} references unknown xAxis column: ${c.xAxis} (dataset: ${dsName || 'unknown'})`);
    }

    const needsYAxis = c.aggregation !== 'count';
    if (needsYAxis) {
      if (!c.yAxis) {
        errors.push(`Chart ${i} requires a yAxis when aggregation is "${c.aggregation}"`);
      } else if (columnNames.length && !columnNames.includes(c.yAxis)) {
        errors.push(`Chart ${i} references unknown yAxis column: ${c.yAxis} (dataset: ${dsName || 'unknown'})`);
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
