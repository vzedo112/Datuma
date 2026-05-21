import * as Sentry from "@sentry/react";

const dsn = process.env.REACT_APP_SENTRY_DSN;

export const sentryEnabled = Boolean(dsn);

if (sentryEnabled) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    sendDefaultPii: true,
    tracesSampleRate: 0.1,
  });
}

export { Sentry };
