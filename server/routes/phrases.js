const express = require('express');
const router = express.Router();
const db = require('../db');
const { getWeakPhonemes } = require('../services/phonemes');
const { generateWords } = require('../services/claude');
const authMiddleware = require('../middleware/auth');

// GET /api/phrases?level=easy&userId=<uuid>
router.get('/', authMiddleware, async (req, res) => {
  const { level = 'easy', userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId query param required.' });
  }

  try {
    // Determine user's weak phonemes to prioritise relevant words
    const weakPhonemes = await getWeakPhonemes(userId);

    let words = [];

    if (weakPhonemes.length > 0) {
      // Try to find words that target at least one weak phoneme
      const { rows } = await db.query(
        `SELECT * FROM words
         WHERE  level = $1
           AND  targets && $2::text[]
         ORDER  BY random()
         LIMIT  6`,
        [level, weakPhonemes],
      );
      words = rows;
    }

    // Fall back to any words at this level
    if (words.length < 5) {
      const { rows } = await db.query(
        `SELECT * FROM words
         WHERE  level = $1
         ORDER  BY random()
         LIMIT  6`,
        [level],
      );
      words = rows;
    }

    // If still not enough, generate and insert more words
    if (words.length < 5) {
      const seenWords = words.map((w) => w.word);
      const generated = await generateWords(level, weakPhonemes, seenWords);

      for (const w of generated) {
        try {
          await db.query(
            `INSERT INTO words
               (word, ipa, level, source, reviewed, targets,
                phonemic, syllabic, accentual, intonational)
             VALUES ($1,$2,$3,'ai',false,$4,$5,$6,$7,$8)
             ON CONFLICT (word) DO NOTHING`,
            [
              w.word,
              w.ipa,
              w.level,
              w.targets,
              JSON.stringify(w.phonemic),
              JSON.stringify(w.syllabic),
              JSON.stringify(w.accentual),
              JSON.stringify(w.intonational),
            ],
          );
        } catch (_) {
          // silently skip individual insert errors
        }
      }

      // Re-query after insertion
      const { rows } = await db.query(
        `SELECT * FROM words
         WHERE  level = $1
         ORDER  BY random()
         LIMIT  6`,
        [level],
      );
      words = rows;
    }

    return res.json({ words });
  } catch (err) {
    console.error('GET /api/phrases error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
