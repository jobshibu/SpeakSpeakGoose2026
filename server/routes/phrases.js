const express = require('express');
const router = express.Router();
const db = require('../db');
const { getWeakPhonemes } = require('../services/phonemes');
const { generateWords } = require('../services/claude');
const authMiddleware = require('../middleware/auth');

/**
 * Determine how many phrases (vs words) to mix in based on user's rolling avg score.
 * Returns { wordCount, phraseCount } that sum to 6.
 *
 * < 5 total attempts OR avg < 0.70  → 6 words, 0 phrases  (words only)
 * avg 0.70 – 0.84                   → 5 words, 1 phrase
 * avg 0.85+                         → 4 words, 2 phrases
 */
async function getProgressionMix(userId) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int       AS total_attempts,
            AVG(score)::float   AS avg_score
     FROM   session_attempts
     WHERE  user_id = $1 AND score IS NOT NULL`,
    [userId],
  );

  const { total_attempts, avg_score } = rows[0];
  const avg = avg_score || 0;

  if (total_attempts < 5 || avg < 0.70) return { wordCount: 6, phraseCount: 0 };
  if (avg < 0.85)                        return { wordCount: 5, phraseCount: 1 };
  return                                        { wordCount: 4, phraseCount: 2 };
}

// GET /api/phrases?level=easy&userId=<uuid>
router.get('/', authMiddleware, async (req, res) => {
  const { level = 'easy', userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId query param required.' });
  }

  try {
    const weakPhonemes = await getWeakPhonemes(userId);
    const { wordCount, phraseCount } = await getProgressionMix(userId);

    // ── Fetch words ──────────────────────────────────────────────────────────
    let words = [];

    if (weakPhonemes.length > 0) {
      const { rows } = await db.query(
        `SELECT * FROM words
         WHERE  level = $1 AND type = 'word' AND targets && $2::text[]
         ORDER  BY random()
         LIMIT  $3`,
        [level, weakPhonemes, wordCount],
      );
      words = rows;
    }

    if (words.length < Math.min(wordCount, 3)) {
      const { rows } = await db.query(
        `SELECT * FROM words
         WHERE  level = $1 AND type = 'word'
         ORDER  BY random()
         LIMIT  $2`,
        [level, wordCount],
      );
      words = rows;
    }

    // If still not enough, generate more words via AI
    if (words.length < 3) {
      const seenWords = words.map((w) => w.word);
      const generated = await generateWords(level, weakPhonemes, seenWords);
      for (const w of generated) {
        try {
          await db.query(
            `INSERT INTO words
               (word, ipa, level, type, source, reviewed, targets,
                phonemic, syllabic, accentual, intonational)
             VALUES ($1,$2,$3,'word','ai',false,$4,$5,$6,$7,$8)
             ON CONFLICT (word) DO NOTHING`,
            [w.word, w.ipa, w.level, w.targets,
             JSON.stringify(w.phonemic), JSON.stringify(w.syllabic),
             JSON.stringify(w.accentual), JSON.stringify(w.intonational)],
          );
        } catch (_) {}
      }
      const { rows } = await db.query(
        `SELECT * FROM words WHERE level = $1 AND type = 'word' ORDER BY random() LIMIT $2`,
        [level, wordCount],
      );
      words = rows;
    }

    // ── Fetch phrases (only if user has progressed) ──────────────────────────
    let phrases = [];
    if (phraseCount > 0) {
      if (weakPhonemes.length > 0) {
        const { rows } = await db.query(
          `SELECT * FROM words
           WHERE  level = $1 AND type = 'phrase' AND targets && $2::text[]
           ORDER  BY random()
           LIMIT  $3`,
          [level, weakPhonemes, phraseCount],
        );
        phrases = rows;
      }

      if (phrases.length < phraseCount) {
        const { rows } = await db.query(
          `SELECT * FROM words
           WHERE  level = $1 AND type = 'phrase'
           ORDER  BY random()
           LIMIT  $2`,
          [level, phraseCount],
        );
        phrases = rows;
      }
    }

    // ── Shuffle words and phrases together ───────────────────────────────────
    const combined = [...words, ...phrases].sort(() => Math.random() - 0.5);

    return res.json({
      words: combined,
      progression: { wordCount, phraseCount, avgScore: null },
    });
  } catch (err) {
    console.error('GET /api/phrases error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
