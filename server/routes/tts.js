const express = require('express');
const router = express.Router();
const { textToSpeech } = require('../services/elevenlabs');
const authMiddleware = require('../middleware/auth');
const { validateTTSInput } = require('../middleware/validate');

// POST /api/tts
// body: { text: string, speed?: number }
router.post('/', authMiddleware, validateTTSInput, async (req, res) => {
  const { text, speed } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text is required.' });
  }

  try {
    const audioBase64 = await textToSpeech(text.trim(), speed);
    return res.json({ audio: audioBase64, mimeType: 'audio/mpeg' });
  } catch (err) {
    console.error('POST /api/tts error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
