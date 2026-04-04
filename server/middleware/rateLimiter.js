const rateLimit = require('express-rate-limit');

// ── General API limiter — all routes ─────────────────────────────────────────
const general = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in 15 minutes.' },
});

// ── Auth limiter — prevent brute-force login/register ─────────────────────────
const auth = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Please try again in 15 minutes.' },
});

// ── AI endpoints — prevent credit abuse ───────────────────────────────────────
// /api/attempt, /api/generate-words
const ai = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests. Please wait a moment before trying again.' },
});

// ── TTS limiter — ElevenLabs credits ─────────────────────────────────────────
const tts = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many TTS requests. Please wait a moment.' },
});

module.exports = { general, auth, ai, tts };
