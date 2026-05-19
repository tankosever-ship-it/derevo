require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const personsRoutes = require('./routes/persons');
const relationshipsRoutes = require('./routes/relationships');
const mediaRoutes = require('./routes/media');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/persons', personsRoutes);
app.use('/api/relationships', relationshipsRoutes);
app.use('/api/media', mediaRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Serve built React frontend (production)
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('*', (_, res) => res.sendFile(path.join(publicDir, 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});
