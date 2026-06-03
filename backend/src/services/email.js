// Datuma email service.
//
// Built on Resend for transactional delivery. Every public function is
// best-effort: if RESEND_API_KEY isn't set we log to console and return false
// so calling code can keep moving. Email failures must never block a dashboard
// generation, an invite, or a billing event — they're nice-to-have signals.

const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.EMAIL_FROM || 'Datuma <hello@datuma.app>';
const appUrl = process.env.APP_URL || 'http://localhost:3000';

const isEmailConfigured = Boolean(apiKey);
const resend = isEmailConfigured ? new Resend(apiKey) : null;

if (!isEmailConfigured) {
  console.warn(
    '[email] RESEND_API_KEY not set — emails will be logged to console only.'
  );
}

// Pulls a friendly first-name from a Clerk user object, falling back to the
// local-part of the email address. Used in greetings.
function firstNameFromUser(user) {
  return (
    user?.firstName ||
    (user?.fullName ? user.fullName.split(' ')[0] : null) ||
    (user?.primaryEmailAddress?.emailAddress
      ? user.primaryEmailAddress.emailAddress.split('@')[0]
      : null) ||
    'there'
  );
}

// Wraps plain copy in the Datuma email shell. Inline styles only — most email
// clients strip <style> tags.
function shell({ preheader, title, bodyHtml, ctaUrl, ctaText, footerNote }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f6f4ee;color:#14110d;font-family:'Instrument Sans',-apple-system,Segoe UI,Roboto,sans-serif;">
  <div style="display:none;font-size:1px;color:#f6f4ee;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f6f4ee;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;background:#ffffff;border:1px solid #d8d2c4;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;border-bottom:1px solid #ece8df;">
              <div style="font-family:Geist,Inter,system-ui,sans-serif;font-weight:600;font-size:18px;letter-spacing:-0.02em;">
                Datuma <span style="color:#7d3d5b;font-family:'JetBrains Mono',monospace;font-size:11px;">™</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;">
              ${bodyHtml}
              ${
                ctaUrl
                  ? `<div style="margin-top:28px;">
                       <a href="${ctaUrl}" style="display:inline-block;background:#14110d;color:#f6f4ee;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:500;font-size:14px;">${ctaText}</a>
                     </div>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;border-top:1px solid #ece8df;font-size:12px;color:#6b6457;">
              ${
                footerNote ||
                `You're receiving this because you have a Datuma account. <a href="${appUrl}/app/settings" style="color:#7d3d5b;text-decoration:underline;">Manage notification settings</a>.`
              }
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:#a39c8d;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:0.1em;">
          Datuma — Spreadsheets, briefed.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function send({ to, subject, html, text }) {
  if (!to) return false;
  if (!isEmailConfigured) {
    console.log(
      `[email] (would send) to=${to} subject=${JSON.stringify(subject)}`
    );
    return false;
  }
  try {
    await resend.emails.send({ from: fromAddress, to, subject, html, text });
    return true;
  } catch (err) {
    console.warn(`[email] send failed (${subject}):`, err.message);
    return false;
  }
}

// --- Public senders ---

// Dashboard finished generating. Sent right after upload save succeeds, only
// when the user has opted in via Settings → Notifications.
async function sendDashboardReady({ user, dashboardTitle, dashboardId, filename }) {
  const to = user?.primaryEmailAddress?.emailAddress;
  if (!to) return false;
  const name = firstNameFromUser(user);
  const url = `${appUrl}/app/dashboard/${dashboardId}`;
  const bodyHtml = `
    <h1 style="font-family:Geist,Inter,system-ui,sans-serif;font-weight:600;font-size:24px;line-height:1.2;letter-spacing:-0.02em;margin:0 0 12px;">
      Your dashboard is ready.
    </h1>
    <p style="margin:0 0 16px;line-height:1.6;color:#3d362a;">
      Hi ${name}, Datuma finished briefing
      <strong style="color:#14110d;">${escapeHtml(dashboardTitle || filename)}</strong>.
      Tap below to open it.
    </p>
    <p style="margin:0;font-size:13px;color:#6b6457;line-height:1.6;">
      Source: <code style="font-family:'JetBrains Mono',monospace;font-size:12px;background:#ece8df;padding:2px 6px;border-radius:4px;">${escapeHtml(filename || '')}</code>
    </p>
  `;
  return send({
    to,
    subject: `${dashboardTitle || filename} — your Datuma brief is ready`,
    html: shell({
      preheader: `${dashboardTitle || filename} is ready in Datuma.`,
      title: 'Your dashboard is ready',
      bodyHtml,
      ctaUrl: url,
      ctaText: 'Open dashboard →',
    }),
    text: `Your dashboard is ready: ${dashboardTitle || filename}\nOpen it: ${url}`,
  });
}

// Sent when monthly usage crosses 80% of the included quota so users aren't
// surprised by overage at the next invoice.
async function sendOverageWarning({
  user,
  planName,
  used,
  included,
  overageEuros,
}) {
  const to = user?.primaryEmailAddress?.emailAddress;
  if (!to) return false;
  const name = firstNameFromUser(user);
  const remaining = included - used;
  const bodyHtml = `
    <h1 style="font-family:Geist,Inter,system-ui,sans-serif;font-weight:600;font-size:24px;line-height:1.2;letter-spacing:-0.02em;margin:0 0 12px;">
      You're close to your monthly limit.
    </h1>
    <p style="margin:0 0 16px;line-height:1.6;color:#3d362a;">
      Hi ${name}, you've used <strong>${used} of ${included}</strong>
      dashboards on the ${planName} plan this month
      ${remaining > 0 ? `(${remaining} left)` : ''}.
    </p>
    <p style="margin:0 0 16px;line-height:1.6;color:#3d362a;">
      Past your include, each additional dashboard costs
      <strong>€${overageEuros.toFixed(2)}</strong>. You can set a hard monthly
      spend cap in Settings so the meter stops at your number.
    </p>
  `;
  return send({
    to,
    subject: `You're at 80% of your monthly Datuma limit`,
    html: shell({
      preheader: `${used} of ${included} dashboards used this month.`,
      title: 'Approaching your limit',
      bodyHtml,
      ctaUrl: `${appUrl}/app/settings`,
      ctaText: 'Manage usage & cap',
      footerNote: `You're getting this because you opted in to usage alerts. <a href="${appUrl}/app/settings" style="color:#7d3d5b;text-decoration:underline;">Turn off</a>.`,
    }),
    text: `You've used ${used} of ${included} Datuma dashboards this month on ${planName}. Overage: €${overageEuros.toFixed(
      2
    )}/dashboard. Manage: ${appUrl}/app/settings`,
  });
}

// Sent when an owner invites a teammate. The inviteeUrl is the sign-up flow
// with the email pre-filled so the join experience is one click.
async function sendTeamInvite({ inviterId, toEmail }) {
  if (!toEmail) return false;
  // Lazy require to avoid forcing every email entrypoint to pay the Clerk
  // bootstrap cost, and so this module still loads when Clerk isn't wired.
  let inviter = null;
  try {
    const { clerkClient } = require('@clerk/express');
    inviter = await clerkClient.users.getUser(inviterId);
  } catch {
    /* graceful — we can still send a generic invite */
  }
  const inviterName =
    inviter?.fullName ||
    inviter?.primaryEmailAddress?.emailAddress ||
    'a Datuma user';
  const signupUrl = `${appUrl}/sign-up?invite=${encodeURIComponent(toEmail)}`;

  const bodyHtml = `
    <h1 style="font-family:Geist,Inter,system-ui,sans-serif;font-weight:600;font-size:24px;line-height:1.2;letter-spacing:-0.02em;margin:0 0 12px;">
      You've been invited to a Datuma team.
    </h1>
    <p style="margin:0 0 16px;line-height:1.6;color:#3d362a;">
      <strong>${escapeHtml(inviterName)}</strong> wants to share a Datuma
      workspace with you. Datuma turns spreadsheets into one-page dashboards
      with AI — drop a CSV, get a brief in 30 seconds.
    </p>
    <p style="margin:0;font-size:13px;color:#6b6457;line-height:1.6;">
      The link below opens the sign-up flow with your email pre-filled. You'll
      land in the shared workspace once you finish creating an account.
    </p>
  `;
  return send({
    to: toEmail,
    subject: `${inviterName} invited you to a Datuma workspace`,
    html: shell({
      preheader: `Join ${inviterName}'s Datuma workspace.`,
      title: 'You have a Datuma invite',
      bodyHtml,
      ctaUrl: signupUrl,
      ctaText: 'Accept invite →',
      footerNote: `This invite was sent to ${escapeHtml(
        toEmail
      )}. If you weren't expecting it, you can ignore this email.`,
    }),
    text: `${inviterName} invited you to a Datuma workspace.\nAccept: ${signupUrl}`,
  });
}

// Minimal HTML escape so dashboard titles and emails don't break the markup.
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  isEmailConfigured,
  sendDashboardReady,
  sendOverageWarning,
  sendTeamInvite,
};
