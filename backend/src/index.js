require('dotenv').config();
const express = require('express');
const cors = require('cors');
const uploadRoutes = require('./routes/upload');
const dashboardRoutes = require('./routes/dashboards');
const billingRoutes = require('./routes/billing');
const webhookRoutes = require('./routes/webhooks');
const shareRoutes = require('./routes/share');
const folderRoutes = require('./routes/folders');
const { withClerk } = require('./middleware/auth');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Behind a load balancer (EB / Fly) we need to trust the proxy so Express
// reads the real client IP from X-Forwarded-For and treats HTTPS correctly.
app.set('trust proxy', 1);

// CORS — only allow our own frontend(s). Comma-separated origins via env;
// dev falls back to localhost:3000 so the React dev server works.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / non-browser requests (no Origin header) and
      // anything matching the explicit allowlist.
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin "${origin}" not allowed`));
    },
    credentials: true,
  })
);

// Stripe webhook needs the RAW request body for signature verification, so it
// must be mounted BEFORE express.json() with its own raw parser.
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());
app.use(withClerk());

app.get('/', (req, res) => {
  res.json({ message: 'Datuma API is running', db: db.isReady() });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/folders', folderRoutes);

db.init().finally(() => {
  app.listen(PORT, () => {
    console.log(`Datuma server running on port ${PORT}`);
  });
});
