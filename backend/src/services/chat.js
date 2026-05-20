const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CHAT_MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 800;

const SYSTEM_PROMPT = `You are Datuma's data analyst, embedded inside a dashboard the user is looking at right now. You wrote this dashboard from their CSV/Excel upload, and they're asking follow-up questions about it.

How to answer:
- Plain English, no statistical jargon. The reader is a finance director, ops manager, or founder — not a data scientist.
- Reference exact numbers from the dashboard JSON. Cite metric values, chart data points, and insight findings directly.
- 2-4 sentences by default. Go longer only when the question genuinely needs it (e.g. "summarize this for a CFO").
- If the question can't be answered from the data shown (e.g. they ask about a column not in the dataset), say so clearly and suggest what they'd need to upload.
- Never invent numbers. If a calculation requires data not present, say what's missing.
- No headings, no markdown lists unless the user explicitly asks for a list. Conversational prose, like you're in a meeting.`;

function trimThread(messages, maxTurns = 12) {
  // Keep the last N messages so we don't bloat the prompt indefinitely.
  return messages.slice(-maxTurns);
}

/**
 * Reply to a user message about a specific dashboard.
 *
 * The dashboard JSON is cached via Anthropic's prompt cache (5-min TTL), so
 * multi-turn chats within the same session pay only for the question + thread
 * tail — not the full context every turn.
 */
async function reply({ dashboard, thread, userMessage }) {
  const trimmed = trimThread(thread || []);

  const response = await client.messages.create({
    model: CHAT_MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      { type: 'text', text: SYSTEM_PROMPT },
      {
        type: 'text',
        text: `## Dashboard the user is looking at\n${JSON.stringify(dashboard, null, 2)}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      ...trimmed.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ],
  });

  const text =
    response.content
      ?.filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n')
      .trim() || '';

  return {
    text,
    usage: response.usage ?? null,
  };
}

module.exports = { reply, CHAT_MODEL };
