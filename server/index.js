require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const personsRoutes = require('./routes/persons');
const relationshipsRoutes = require('./routes/relationships');
const mediaRoutes = require('./routes/media');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/persons', personsRoutes);
app.use('/api/relationships', relationshipsRoutes);
app.use('/api/media', mediaRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});
