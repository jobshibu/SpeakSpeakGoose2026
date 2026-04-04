require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const authRoutes     = require('./routes/auth');
const phrasesRoutes  = require('./routes/phrases');
const ttsRoutes      = require('./routes/tts');
const attemptRoutes  = require('./routes/attempt');
const generateRoutes = require('./routes/generate');
const sessionRoutes  = require('./routes/session');
const statsRoutes    = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static frontend ───────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../client')));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/phrases',        phrasesRoutes);
app.use('/api/tts',            ttsRoutes);
app.use('/api/attempt',        attemptRoutes);
app.use('/api/generate-words', generateRoutes);
app.use('/api/session',        sessionRoutes);
app.use('/api/stats',          statsRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Catch-all: serve the SPA ──────────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`ESL Pronunciation Coach running on http://localhost:${PORT}`);
});
