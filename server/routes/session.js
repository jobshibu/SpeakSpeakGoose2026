const express = require('express');
const router = express.Router();
const { processSession } = require('../services/gamification');
const { getMasteredPhonemes } = require('../services/phonemes');
const authMiddleware = require('../middleware/auth');

// POST /api/session
// body: { userId, wordId, finalScore, attempts }
router.post('/', authMiddleware, async (req, res) => {
  const { userId, wordId, finalScore, attempts } = req.body;

  if (!userId || finalScore === undefined) {
    return res.status(400).json({ error: 'userId and finalScore are required.' });
  }

  const score = parseFloat(finalScore);
  if (isNaN(score) || score < 0 || score > 1) {
    return res.status(400).json({ error: 'finalScore must be a number between 0 and 1.' });
  }

  try {
    // Determine newly mastered phonemes by comparing before/after
    // (processSession internally handles streak, XP, badges)
    const masteredPhonemes = await getMasteredPhonemes(userId);

    const result = await processSession(
      userId,
      score,
      [], // newMastered phonemes (already tracked by updatePhonemeScores in /attempt)
      masteredPhonemes.length,
    );

    return res.json(result);
  } catch (err) {
    console.error('POST /api/session error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
