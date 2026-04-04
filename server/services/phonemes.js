const db = require('../db');

/**
 * Upsert phoneme scores for a user after one attempt.
 *
 * @param {string} userId        - UUID
 * @param {Object} phonemesHit   - { "ð": false, "ɛ": true, ... }
 * @param {string} dimension     - e.g. 'phonemic', 'syllabic', 'accentual', 'intonational'
 * @param {string} category      - optional category label (e.g. 'fricative')
 */
async function updatePhonemeScores(
  userId,
  phonemesHit,
  dimension = 'phonemic',
  category = 'general',
) {
  const phonemes = Object.entries(phonemesHit);
  if (phonemes.length === 0) return;

  for (const [phoneme, hit] of phonemes) {
    const score = hit ? 1.0 : 0.0;

    // Upsert: insert or increment
    await db.query(
      `INSERT INTO phoneme_scores
         (user_id, phoneme, category, dimension, attempts, successes, recent, mastered)
       VALUES ($1, $2, $3, $4, 1, $5, ARRAY[$6::float], false)
       ON CONFLICT (user_id, phoneme, dimension) DO UPDATE SET
         attempts  = phoneme_scores.attempts + 1,
         successes = phoneme_scores.successes + $5,
         recent    = ARRAY[$6::float] || phoneme_scores.recent[1:4],
         mastered  = (
           cardinality(ARRAY[$6::float] || phoneme_scores.recent[1:4]) >= 5
           AND (
             (SELECT AVG(v)
              FROM unnest(ARRAY[$6::float] || phoneme_scores.recent[1:4]) AS v)
             >= 0.85
           )
           AND (phoneme_scores.attempts + 1) >= 5
         ),
         updated_at = now()`,
      [userId, phoneme, category, dimension, hit ? 1 : 0, score],
    );
  }
}

/**
 * Return up to 8 phonemes the user struggles with most.
 *
 * @param {string} userId
 * @returns {Promise<string[]>} array of IPA phoneme symbols
 */
async function getWeakPhonemes(userId) {
  const { rows } = await db.query(
    `SELECT phoneme,
            (SELECT AVG(v) FROM unnest(recent) AS v) AS avg_score
     FROM   phoneme_scores
     WHERE  user_id  = $1
       AND  attempts >= 3
       AND  mastered = false
     ORDER  BY avg_score ASC NULLS LAST
     LIMIT  8`,
    [userId],
  );
  return rows.map((r) => r.phoneme);
}

/**
 * Return all mastered phonemes for a user.
 *
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
async function getMasteredPhonemes(userId) {
  const { rows } = await db.query(
    `SELECT phoneme
     FROM   phoneme_scores
     WHERE  user_id  = $1
       AND  mastered = true`,
    [userId],
  );
  return rows.map((r) => r.phoneme);
}

module.exports = { updatePhonemeScores, getWeakPhonemes, getMasteredPhonemes };
