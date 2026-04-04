const express = require('express');
const router = express.Router();
const db = require('../db');
const { getWeakPhonemes, getMasteredPhonemes } = require('../services/phonemes');
const { xpToNextLevel } = require('../services/gamification');
const authMiddleware = require('../middleware/auth');

// GET /api/stats/:userId
router.get('/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params;

  try {
    const { rows: statsRows } = await db.query(
      `SELECT xp, level, streak, total_phrases, badges
       FROM   user_stats
       WHERE  user_id = $1`,
      [userId],
    );

    if (statsRows.length === 0) {
      return res.status(404).json({ error: 'Stats not found for this user.' });
    }

    const stats = statsRows[0];

    // Average score across all attempts
    const { rows: scoreRows } = await db.query(
      `SELECT AVG(score) AS avg_score
       FROM   session_attempts
       WHERE  user_id = $1 AND score IS NOT NULL`,
      [userId],
    );
    const avgScore = scoreRows[0]?.avg_score
      ? parseFloat(parseFloat(scoreRows[0].avg_score).toFixed(3))
      : null;

    const weakPhonemes = await getWeakPhonemes(userId);
    const masteredPhonemes = await getMasteredPhonemes(userId);

    return res.json({
      level: stats.level,
      xp: stats.xp,
      xpToNext: xpToNextLevel(stats.xp),
      streak: stats.streak,
      totalPhrases: stats.total_phrases,
      avgScore,
      badges: stats.badges || [],
      weakPhonemes,
      masteredPhonemes,
    });
  } catch (err) {
    console.error('GET /api/stats error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
