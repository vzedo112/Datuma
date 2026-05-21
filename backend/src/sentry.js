const Sentry = require('@sentry/node');

const dsn = process.env.SENTRY_DSN;
const enabled = Boolean(dsn);

if (enabled) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    sendDefaultPii: true,
    tracesSampleRate: 0.1,
  });
  console.log('[sentry] initialised');
}

module.exports = { Sentry, enabled };
