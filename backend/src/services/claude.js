const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateDashboard(schema, sampleRows, totalRows) {
  const prompt = `You are a data analyst helping a non-technical business user understand their data.

The user has uploaded a dataset with ${totalRows} rows. Here is the schema and a sample of rows:

Schema:
${JSON.stringify(schema, null, 2)}

Sample rows (first 30):
${JSON.stringify(sampleRows, null, 2)}

Analyse this data and return a JSON object with the following structure:

{
  "title": "A short descriptive title for what this data represents",
  "metrics": [
    {
      "label": "Short metric name",
      "value": "The computed value as a string (include currency or unit if relevant)",
      "trend": "up | down | neutral",
      "trendValue": "Optional change description"
    }
  ],
  "charts": [
    {
      "type": "line | bar | pie",
      "title": "Chart title",
      "xAxis": "Column name for x axis",
      "yAxis": "Column name for y axis",
      "explanation": "Plain English explanation of what this chart shows and why it matters"
    }
  ],
  "insights": [
    {
      "severity": "info | warning | success",
      "title": "Short insight title",
      "description": "Plain English explanation of an interesting pattern, anomaly, or recommendation"
    }
  ]
}

Return between 3 and 5 metrics, 3 and 4 charts, and 2 and 3 insights. Return ONLY valid JSON. No markdown, no commentary.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text;
  return JSON.parse(text);
}

module.exports = { generateDashboard };