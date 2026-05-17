const Anthropic = require('@anthropic-ai/sdk');
const { validateDashboard } = require('./validator');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a senior data analyst with 10 years of experience briefing non-technical executives on their business data. Your job is to look at a dataset and produce a dashboard that answers the most important business questions, written in plain English a finance director or operations manager would understand.

You are NOT a generic data tool. You are an analyst with opinions. You identify what matters and ignore what doesn't. Every metric, chart, and insight you produce must reference specific values from the actual data. Generic observations are useless and must be rejected.

The user is a non-technical business decision maker — likely a finance manager, operations director, or department head. They want actionable answers, not statistical jargon. Write as if you are briefing them in a meeting.`;

function buildPrompt(schema, sampleRows, stats, totalRows) {
  return `A user has uploaded a dataset with ${totalRows} rows. Here is everything you need to analyse it.

## Schema
${JSON.stringify(schema, null, 2)}

## Pre-computed statistics for each column
${JSON.stringify(stats, null, 2)}

## Representative sample of rows (beginning, middle, end of dataset)
${JSON.stringify(sampleRows, null, 2)}

## Your task

Step 1 — Identify the domain of this data (e.g. retail sales, HR, manufacturing output, financial transactions, inventory, marketing, healthcare operations). The domain shapes what matters.

Step 2 — Identify the single most important business question this dataset can answer. Examples: "Which products drive the most profit?" "Where are operational bottlenecks?" "How does performance vary across regions?" Pick ONE primary question.

Step 3 — Generate the dashboard. The dashboard must directly answer the primary question and surface 2-3 secondary insights.

## Output format

Return ONLY valid JSON, no markdown, no commentary, in this exact structure:

{
  "domain": "Brief description of what kind of data this is",
  "primaryQuestion": "The most important business question this data answers",
  "title": "A short descriptive title for this dashboard",
  "metrics": [
    {
      "label": "Short metric name",
      "computation": "Plain language description of how this is calculated (e.g. 'Sum of revenue column')",
      "value": "The calculated value as a string, formatted with units/currency",
      "trend": "up | down | neutral",
      "trendValue": "Specific change reference, e.g. 'up 12% vs first half'"
    }
  ],
  "charts": [
    {
      "type": "line | bar | pie",
      "title": "Chart title",
      "xAxis": "Exact column name from schema (the grouping dimension)",
      "yAxis": "Exact column name from schema (the measure being aggregated). OMIT when aggregation is 'count'.",
      "aggregation": "sum | avg | count | min | max | none",
      "explanation": "Plain English explanation of what this shows AND why it matters for the business decision"
    }
  ],
  "insights": [
    {
      "severity": "info | warning | success",
      "title": "Short insight title",
      "description": "Specific finding with actual numbers from the data and a recommended action or question to investigate"
    }
  ]
}

## Rules — every single output must follow these

1. Every metric value MUST be computed from the actual data using the pre-computed statistics provided. Use exact numbers, not estimates.
2. Every chart MUST use xAxis and yAxis values that exist in the schema. Never invent column names.
3. Every insight MUST reference specific values, comparisons, or anomalies from the data. Reject any insight that could apply to any dataset.
4. Choose chart types thoughtfully:
   - line for time-series data (when x axis is a date or sequential)
   - bar for categorical comparisons
   - pie for proportional breakdowns (only when there are 6 or fewer categories)
5. Choose the aggregation deliberately. The data may be transaction-level (many raw rows per category) or already-aggregated (one row per category). The aggregation tells the renderer how to reduce raw rows into chart data points, grouped by xAxis.
   - "sum": total of yAxis per xAxis group. Use when measuring volume (revenue, units, hours).
   - "avg": average of yAxis per xAxis group. Use for rates, prices, scores.
   - "count": number of rows per xAxis group. yAxis is NOT used — omit it. Use for frequency questions ("how many records per region").
   - "min" / "max": smallest / largest yAxis value per group. Use for extremes (peak load, lowest stock).
   - "none": use the raw yAxis values as-is, no grouping. Use ONLY when the data is already pre-aggregated to one row per xAxis value (e.g. one row per month with monthly total).
6. yAxis MUST be a numeric column for aggregations sum, avg, min, max, and none. NEVER use a categorical or date column as yAxis with those aggregations. For "count", omit yAxis entirely.
7. Pie charts only make sense with aggregations that produce a quantitative slice (typically sum or count). Each slice must be a meaningful proportion.
8. Flag data quality issues (missing values, outliers, inconsistent values) in the insights when relevant.
9. Return 3-5 metrics, 3-4 charts, and 2-3 insights.
10. The most important chart must answer the primary question. Place it first.`;
}

function extractJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return fenced ? fenced[1].trim() : trimmed;
}

async function callClaude(prompt, retryMessage = null) {
  const messages = [{ role: 'user', content: prompt }];
  if (retryMessage) {
    messages.push({ role: 'assistant', content: retryMessage.previousResponse });
    messages.push({
      role: 'user',
      content: `Your previous response had these errors:\n${retryMessage.errors.join('\n')}\n\nReturn corrected JSON only. No commentary.`,
    });
  }

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages,
  });

  return response.content[0].text;
}

async function generateDashboard(schema, sampleRows, stats, totalRows) {
  const prompt = buildPrompt(schema, sampleRows, stats, totalRows);

  let rawResponse = await callClaude(prompt);
  let dashboard;

  try {
    dashboard = JSON.parse(extractJson(rawResponse));
  } catch (err) {
    throw new Error(`Claude returned invalid JSON: ${err.message}`);
  }

  const validation = validateDashboard(dashboard, schema, stats);

  if (!validation.valid) {
    console.warn('Dashboard validation failed, retrying:', validation.errors);
    const retryResponse = await callClaude(prompt, {
      previousResponse: rawResponse,
      errors: validation.errors,
    });
    try {
      dashboard = JSON.parse(extractJson(retryResponse));
    } catch (err) {
      throw new Error(`Claude retry returned invalid JSON: ${err.message}`);
    }
    const retryValidation = validateDashboard(dashboard, schema, stats);
    if (!retryValidation.valid) {
      console.error('Dashboard validation failed after retry:', retryValidation.errors);
    }
  }

  return dashboard;
}

module.exports = { generateDashboard };
