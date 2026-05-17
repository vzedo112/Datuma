require('dotenv').config();
const express = require('express');
const cors = require('cors');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Datuma API is running' });
});

app.use('/api/upload', uploadRoutes);

app.listen(PORT, () => {
  console.log(`Datuma server running on port ${PORT}`);
});