require('dotenv').config();
const express = require('express');
const cors = require('cors');
const uploadRoutes = require('./routes/upload');
const dashboardRoutes = require('./routes/dashboards');
const { withClerk } = require('./middleware/auth');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(withClerk());

app.get('/', (req, res) => {
  res.json({ message: 'Datuma API is running', db: db.isReady() });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/dashboards', dashboardRoutes);

db.init().finally(() => {
  app.listen(PORT, () => {
    console.log(`Datuma server running on port ${PORT}`);
  });
});
