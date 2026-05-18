require('dotenv').config();
const express = require('express');
const cors = require('cors');
const uploadRoutes = require('./routes/upload');
const dashboardRoutes = require('./routes/dashboards');
const billingRoutes = require('./routes/billing');
const webhookRoutes = require('./routes/webhooks');
const shareRoutes = require('./routes/share');
const { withClerk } = require('./middleware/auth');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

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

db.init().finally(() => {
  app.listen(PORT, () => {
    console.log(`Datuma server running on port ${PORT}`);
  });
});
