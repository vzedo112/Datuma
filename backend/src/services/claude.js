const Anthropic = require('@anthropic-ai/sdk');
const { validateDashboard } = require('./validator');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a senior data analyst with 10 years of experience briefing non-technical executives on their business data. Your job is to look at one or more datasets and produce a dashboard that answers the most important business questions, written in plain English a finance director or operations manager would understand.

You are NOT a generic data tool. You are an analyst with opinions. You identify what matters and ignore what doesn't. Every metric, chart, and insight you produce must reference specific values from the actual data. Generic observations are useless and must be rejected.

The user is a non-technical business decision maker, likely a finance manager, operations director, or department head. They want actionable answers, not statistical jargon. Write as if you are briefing them in a meeting.

When the user uploads multiple datasets, treat them as related sources for ONE coherent brief. Identify whether they represent the same domain across time periods, different facets of the same operation, or independent areas, and produce insights that explicitly compare or combine them when it makes sense.

## Writing style for all string fields (titles, explanations, computations, descriptions) — non-negotiable

Your output is read by busy executives. It must sound like a human senior analyst wrote it, not a chatbot. Follow these rules without exception:

1. Never use em-dashes ("—") or double hyphens ("--"). Use a comma, period, parentheses, or colon instead.
2. Never use these throat-clearing phrases: "it's worth noting", "notably", "importantly", "of note", "interestingly", "as expected", "in summary", "overall", "ultimately", "fundamentally", "essentially".
3. Never use these AI-marker words: "leverage", "robust", "comprehensive", "key" (as an adjective), "core" (as an adjective), "delve", "uncover", "harness", "navigate", "landscape", "ecosystem", "synergy", "streamline", "actionable insights", "drive value", "unlock", "elevate", "empower".
4. Never start a description with "This chart shows...", "This metric represents...", "Here we see...". State the finding directly with a number, name, or verb.
5. Don't hedge: avoid "may", "might", "could potentially", "tends to", "appears to suggest". Either the data shows it or it doesn't. Be confident or stay silent.
6. Never refer to yourself ("I", "we", "our analysis"). The reader is the protagonist.
7. Vary sentence structure. Don't write three sentences in the same rhythm in a row. Don't use rigid "First, … Second, … Finally, …" parallelism.
8. Prefer short declarative sentences. If you can cut a sentence, cut it. Compactness signals competence.
9. Don't end with a wrap-up sentence summarising what you just said. End on the finding.`;

function buildDatasetBlock(ds) {
  return `### Dataset: "${ds.name}"
Filename: ${ds.filename}
Row count: ${ds.rowCount}

Schema:
${JSON.stringify(ds.schema, null, 2)}

Pre-computed statistics:
${JSON.stringify(ds.stats, null, 2)}

Representative sample of rows:
${JSON.stringify(ds.sample, null, 2)}`;
}

function buildPrompt(datasets) {
  const isMulti = datasets.length > 1;
  const datasetNames = datasets.map((d) => `"${d.name}"`).join(', ');
  const datasetBlocks = datasets.map(buildDatasetBlock).join('\n\n');

  return `A user has uploaded ${datasets.length === 1 ? 'a dataset' : `${datasets.length} datasets (${datasetNames})`}. Here is everything you need to analyse ${datasets.length === 1 ? 'it' : 'them'}.

## Datasets

${datasetBlocks}

## Your task

Step 1 — Identify the domain. ${isMulti ? 'Consider the datasets together — they may be related (e.g. orders + inventory; two years of the same metric; sales + returns).' : 'e.g. retail sales, HR, manufacturing output, financial transactions, inventory, marketing, healthcare operations.'} The domain shapes what matters.

Step 2 — Identify the single most important business question this data can answer. ${isMulti ? 'When datasets are related, the best question often spans them ("How does 2025 compare to 2024?", "Where does inventory under-serve demand?").' : 'Pick ONE primary question.'}

Step 3 — Generate the dashboard. The dashboard must directly answer the primary question and surface 2-3 secondary insights.${isMulti ? ' At least one insight MUST compare across datasets or combine signals from them.' : ''}

## Output format

Return ONLY valid JSON, no markdown, no commentary, in this exact structure:

{
  "domain": "Brief description of what kind of data this is",
  "primaryQuestion": "The most important business question this data answers",
  "title": "A short descriptive title for this dashboard",
  "metrics": [
    {
      "label": "Short metric name",
      "computation": "Plain language description of how this is calculated",
      "value": "The calculated value as a string, formatted with units/currency",
      "datasetName": "Name of the dataset this metric was computed from, exactly as given above. Use \\"all\\" only when the metric combines all datasets.",
      "trend": "up | down | neutral — OPTIONAL, only include when there is a real period-over-period or before-vs-after comparison",
      "trendValue": "Specific change reference, e.g. 'up 12% vs first half' — OPTIONAL, only include alongside trend"
    }
  ],
  "charts": [
    {
      "type": "line | bar | pie | area | donut | horizontal-bar | scatter",
      "title": "Chart title",
      "datasetName": "REQUIRED. Name of the dataset this chart visualises, exactly as given above. A chart can only reference ONE dataset.",
      "xAxis": "Exact column name from that dataset's schema (the grouping dimension)",
      "yAxis": "Exact column name from that dataset's schema (the measure being aggregated). OMIT when aggregation is 'count'.",
      "aggregation": "sum | avg | count | min | max | none",
      "bucket": "day | week | month | quarter | year | none — REQUIRED when xAxis is a date column and aggregation is not 'none'. Use 'none' when xAxis is already discrete or pre-bucketed.",
      "explanation": "Plain English explanation of what this shows AND why it matters for the business decision"
    }
  ],
  "insights": [
    {
      "severity": "info | warning | success",
      "title": "Short insight title",
      "description": "Specific finding with actual numbers from the data and a recommended action or question to investigate",
      "datasetName": "Name of the dataset this insight references, exactly as given above. Use \\"comparison\\" when the insight compares across two or more datasets, or \\"all\\" when it combines all of them."
    }
  ]
}

## Rules — every single output must follow these

1. Every metric value MUST be computed from the actual data using the pre-computed statistics provided. Use exact numbers, not estimates.
2. Every chart MUST use xAxis and yAxis values that exist in the schema of the dataset specified by "datasetName". Never invent column names. Never reference a column from a different dataset.
3. Every chart MUST specify "datasetName" exactly matching one of the dataset names listed above.
4. Every insight MUST reference specific values, comparisons, or anomalies from the data. Reject any insight that could apply to any dataset.
5. Choose chart types thoughtfully. Pick the type that best fits the data shape and the question being answered. Don't default to "bar" for everything — variety makes the dashboard easier to read.
   - line: time-series where the xAxis is a date or sequential, focus is the trend/direction
   - area: time-series where you want to emphasise cumulative magnitude (revenue building, usage growing). Use sparingly — line is usually clearer
   - bar: categorical comparisons with 3-12 categories, fits horizontally
   - horizontal-bar: categorical comparisons where category names are long (won't fit as x-axis labels) OR there are 8-20 categories that need vertical space
   - pie: proportional breakdown when there are 2-5 slices and the share is the point (e.g. channel mix)
   - donut: same as pie but used when you want to surface a central total alongside the breakdown. Limit to 2-5 slices
   - scatter: relationship between two NUMERIC columns (e.g. price vs quantity, hours vs revenue). Both xAxis and yAxis must be numeric. Don't use scatter when one axis is categorical — use bar instead
6. Choose the aggregation deliberately. The data may be transaction-level (many raw rows per category) or already-aggregated (one row per category). The aggregation tells the renderer how to reduce raw rows into chart data points, grouped by xAxis.
   - "sum": total of yAxis per xAxis group. Use when measuring volume (revenue, units, hours).
   - "avg": average of yAxis per xAxis group. Use for rates, prices, scores.
   - "count": number of rows per xAxis group. yAxis is NOT used — omit it. Use for frequency questions.
   - "min" / "max": smallest / largest yAxis value per group. Use for extremes (peak load, lowest stock).
   - "none": use the raw yAxis values as-is, no grouping. Use ONLY when the data is already pre-aggregated to one row per xAxis value.
7. yAxis MUST be a numeric column for aggregations sum, avg, min, max, and none. NEVER use a categorical or date column as yAxis with those aggregations. For "count", omit yAxis entirely.
8. When xAxis is a date column and aggregation is not "none", you MUST specify a bucket (day/week/month/quarter/year). Bucketing one row per transaction would produce a meaningless 1-point-per-day chart; always pick the bucket that produces ~5-30 points for readability.
9. Pie charts only make sense with aggregations that produce a quantitative slice (typically sum or count).
10. The "trend" and "trendValue" fields on metrics are OPTIONAL and must be used SPARINGLY. Only set them when the metric reflects a measurable CHANGE between two specific time periods or two distinct groups in the data. If "trendValue" does not contain comparison language ("vs", "compared to", "up from", "down from", or two specific named periods/groups), do NOT set "trend". Distribution facts, totals, counts, extremes, and rankings are NOT trends.
11. Flag data quality issues (missing values, outliers, inconsistent values such as casing variants) in the insights when relevant.
12. Return 3-5 metrics, 3-4 charts, and 2-3 insights total across all datasets (NOT per dataset). Pick the most important ones overall.
13. The most important chart must answer the primary question. Place it first.
${isMulti ? '14. With multiple datasets, you MUST include at least one insight with datasetName "comparison" or "all" that explicitly relates the datasets to each other.\n' : ''}`;
}

function extractJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return fenced ? fenced[1].trim() : trimmed;
}

async function callClaude(prompt, retryMessage = null, plan = 'starter') {
  const messages = [{ role: 'user', content: prompt }];
  if (retryMessage) {
    messages.push({ role: 'assistant', content: retryMessage.previousResponse });
    messages.push({
      role: 'user',
      content: `Your previous response had these errors:\n${retryMessage.errors.join('\n')}\n\nReturn corrected JSON only. No commentary.`,
    });
  }

  const modelToUse = (plan === 'pro' || plan === 'team')
    ? 'claude-opus-4-7'
    : 'claude-sonnet-4-6';

  const response = await client.messages.create({
    model: modelToUse,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages,
  });

  return response.content[0].text;
}

async function generateDashboard(datasets, plan = 'starter') {
  const prompt = buildPrompt(datasets);
  const statsByDataset = Object.fromEntries(datasets.map((d) => [d.name, d.stats]));
  const schemaByDataset = Object.fromEntries(datasets.map((d) => [d.name, d.schema]));

  let rawResponse = await callClaude(prompt, null, plan);
  let dashboard;

  try {
    dashboard = JSON.parse(extractJson(rawResponse));
  } catch (err) {
    throw new Error(`Claude returned invalid JSON: ${err.message}`);
  }

  const validation = validateDashboard(dashboard, schemaByDataset, statsByDataset);

  if (!validation.valid) {
    console.warn('Dashboard validation failed, retrying:', validation.errors);
    const retryResponse = await callClaude(prompt, {
      previousResponse: rawResponse,
      errors: validation.errors,
    }, plan);
    try {
      dashboard = JSON.parse(extractJson(retryResponse));
    } catch (err) {
      throw new Error(`Claude retry returned invalid JSON: ${err.message}`);
    }
    const retryValidation = validateDashboard(dashboard, schemaByDataset, statsByDataset);
    if (!retryValidation.valid) {
      console.error('Dashboard validation failed after retry:', retryValidation.errors);
    }
  }

  return dashboard;
}

module.exports = { generateDashboard };
