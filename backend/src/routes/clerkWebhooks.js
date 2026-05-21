const express = require('express');
const { Webhook } = require('svix');
const { notifyFounder } = require('../services/notify');

const router = express.Router();

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

// Body is mounted as `express.raw` in index.js so svix can verify the signature.
router.post('/', async (req, res) => {
  if (!webhookSecret) {
    return res.status(503).json({ error: 'Clerk webhook not configured' });
  }

  const payload = req.body;
  const headers = {
    'svix-id': req.headers['svix-id'],
    'svix-timestamp': req.headers['svix-timestamp'],
    'svix-signature': req.headers['svix-signature'],
  };

  let event;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(payload, headers);
  } catch (err) {
    console.error('[clerk-webhook] signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  console.log(`[clerk-webhook] received ${event.type}`);

  try {
    if (event.type === 'user.created') {
      const u = event.data;
      const email = u.email_addresses?.[0]?.email_address || '(no email)';
      const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || '(no name)';
      const createdAt = new Date(u.created_at || Date.now()).toISOString();

      const subject = `New Datuma signup: ${name} <${email}>`;
      const body = [
        `A new user just signed up for Datuma.`,
        ``,
        `Name:     ${name}`,
        `Email:    ${email}`,
        `Clerk ID: ${u.id}`,
        `Time:     ${createdAt}`,
        ``,
        `If this looks like a cold-outreach target, follow up personally.`,
      ].join('\n');

      await notifyFounder(subject, body);
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[clerk-webhook] handler error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
