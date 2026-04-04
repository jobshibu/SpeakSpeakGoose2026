const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateWords } = require('../services/claude');
const { getWeakPhonemes } = require('../services/phonemes');
const authMiddleware = require('../middleware/auth');

// POST /api/generate-words
// body: { userId: string, level: string }
router.post('/', authMiddleware, async (req, res) => {
  const { userId, level = 'medium' } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }

  try {
    const weakPhonemes = await getWeakPhonemes(userId);

    // Collect words the user has already seen
    const { rows: seenRows } = await db.query(
      `SELECT DISTINCT w.word
       FROM session_attempts sa
       JOIN words w ON w.id = sa.word_id
       WHERE sa.user_id = $1`,
      [userId],
    );
    const seenWords = seenRows.map((r) => r.word);

    const generated = await generateWords(level, weakPhonemes, seenWords);

    const inserted = [];
    for (const w of generated) {
      if (
        !w.word || !w.ipa || !w.level || !Array.isArray(w.targets) ||
        !w.phonemic || !w.syllabic || !w.accentual || !w.intonational
      ) {
        continue; // skip malformed entries
      }

      try {
        const { rows } = await db.query(
          `INSERT INTO words
             (word, ipa, level, source, reviewed, targets,
              phonemic, syllabic, accentual, intonational)
           VALUES ($1,$2,$3,'ai',false,$4,$5,$6,$7,$8)
           ON CONFLICT (word) DO NOTHING
           RETURNING *`,
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
        if (rows.length > 0) inserted.push(rows[0]);
      } catch (_) {
        // skip individual insert errors
      }
    }

    return res.json({ inserted, count: inserted.length });
  } catch (err) {
    console.error('POST /api/generate-words error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
