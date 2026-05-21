// Founder alerts — currently just emails hello@datuma.app via Resend.
// No-ops if RESEND_API_KEY is unset, so dev/CI work without credentials.

const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;
const enabled = Boolean(apiKey);
const client = enabled ? new Resend(apiKey) : null;

// Until you verify datuma.app in Resend, fall back to their default
// onboarding@resend.dev sender. Once verified, set FROM_EMAIL=notifications@datuma.app.
const FROM = process.env.NOTIFY_FROM_EMAIL || 'Datuma <onboarding@resend.dev>';
const TO = process.env.NOTIFY_TO_EMAIL || 'hello@datuma.app';

async function notifyFounder(subject, body) {
  if (!enabled) {
    console.log(`[notify] (disabled) ${subject}\n${body}`);
    return;
  }
  try {
    await client.emails.send({
      from: FROM,
      to: TO,
      subject,
      text: body,
    });
    console.log(`[notify] sent: ${subject}`);
  } catch (err) {
    console.error(`[notify] failed: ${err.message}`);
  }
}

module.exports = { notifyFounder, enabled };
