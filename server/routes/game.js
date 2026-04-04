const express  = require('express');
const router   = express.Router();
const { v4: uuidv4 } = require('uuid');
const db         = require('../db');
const auth       = require('../middleware/auth');
const { ai }     = require('../middleware/rateLimiter');
const engine     = require('../services/gameEngine');
const { getWeakPhonemes } = require('../services/phonemes');

// ── Helpers ───────────────────────────────────────────────────────────────────

async function ensureGameState(userId) {
  const { rows } = await db.query(
    `INSERT INTO game_state (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId],
  );
  const { rows: gs } = await db.query(
    `SELECT * FROM game_state WHERE user_id = $1`,
    [userId],
  );
  return gs[0];
}

function serializeState(gs) {
  const creatures = engine.computeCreatures(gs.creatures || [], gs.day);
  return {
    day:             parseInt(gs.day,    10) || 1,
    exp:             parseInt(gs.exp,    10) || 0,
    streak:          parseInt(gs.streak, 10) || 0,
    multiplier:      engine.getMultiplier(parseInt(gs.streak, 10) || 0),
    lastPracticeDay: parseInt(gs.last_practice_day, 10) || 0,
    creatures,
    animationState:  gs.animation_state,
  };
}

// ── GET /api/game/state/:userId ───────────────────────────────────────────────
router.get('/state/:userId', auth, async (req, res) => {
  const { userId } = req.params;
  try {
    const gs = await ensureGameState(userId);
    return res.json(serializeState(gs));
  } catch (err) {
    console.error('GET /api/game/state error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/game/phrase/:userId ──────────────────────────────────────────────
// Returns a phrase, occasionally one difficulty harder (stretch challenge).
router.get('/phrase/:userId', auth, async (req, res) => {
  const { userId } = req.params;
  try {
    // Get user stats to determine expected difficulty
    const { rows: statsRows } = await db.query(
      `SELECT level FROM user_stats WHERE user_id = $1`,
      [userId],
    );
    const userLevel = statsRows[0]?.level || 1;

    let expectedDifficulty;
    if (userLevel <= 2)      expectedDifficulty = 'easy';
    else if (userLevel <= 5) expectedDifficulty = 'medium';
    else                     expectedDifficulty = 'hard';

    const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];
    const expectedIdx      = DIFFICULTY_ORDER.indexOf(expectedDifficulty);

    // 20% chance of stretch challenge (one level harder)
    const isStretch = Math.random() < 0.2 && expectedIdx < 2;
    const difficulty = isStretch
      ? DIFFICULTY_ORDER[expectedIdx + 1]
      : expectedDifficulty;

    // Check if user has weak phonemes to focus on (70% chance to serve a focus word)
    const weakPhonemes = await getWeakPhonemes(userId);
    let wordRows = [];
    let isFocusWord = false;
    let focusPhonemes = [];

    if (weakPhonemes.length > 0 && Math.random() < 0.7) {
      // Try to find a word at this difficulty that targets one of the weak phonemes
      const { rows: focusRows } = await db.query(
        `SELECT * FROM words
         WHERE  level = $1
           AND  type  = 'word'
           AND  targets && $2
         ORDER  BY random()
         LIMIT  1`,
        [difficulty, weakPhonemes],
      );
      if (focusRows.length > 0) {
        wordRows = focusRows;
        isFocusWord = true;
        // Which of the word's targets overlap with the user's weak phonemes
        focusPhonemes = (focusRows[0].targets || []).filter(t => weakPhonemes.includes(t));
      }
    }

    // Fallback to random word if no focus word found
    if (wordRows.length === 0) {
      const { rows: randRows } = await db.query(
        `SELECT * FROM words
         WHERE  level = $1 AND type = 'word'
         ORDER  BY random()
         LIMIT  1`,
        [difficulty],
      );
      wordRows = randRows;
    }

    if (wordRows.length === 0) {
      return res.status(404).json({ error: 'No phrases found for this difficulty.' });
    }

    return res.json({
      phrase:             wordRows[0],
      difficulty,
      expectedDifficulty,
      isStretchChallenge: isStretch && !isFocusWord,
      isFocusWord,
      focusPhonemes,
    });
  } catch (err) {
    console.error('GET /api/game/phrase error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/game/practice ───────────────────────────────────────────────────
// body: { userId, phraseId, score, difficulty, isStretchChallenge }
router.post('/practice', auth, ai, async (req, res) => {
  const { userId, phraseId, score, difficulty, isStretchChallenge, isFocusWord } = req.body;

  if (!userId || score === undefined || !phraseId) {
    return res.status(400).json({ error: 'userId, phraseId, and score are required.' });
  }

  const numScore = parseFloat(score);
  if (isNaN(numScore) || numScore < 0 || numScore > 1) {
    return res.status(400).json({ error: 'score must be 0.0–1.0.' });
  }

  try {
    const gs = await ensureGameState(userId);

    const result = engine.processPractice(gs, {
      phraseId,
      score:              numScore,
      difficulty:         difficulty || 'easy',
      isStretchChallenge: !!isStretchChallenge,
      isFocusWord:        !!isFocusWord,
    });

    const { newState, expAwarded, eggAwarded, eggType, multiplier } = result;

    // Persist updated state
    await db.query(
      `UPDATE game_state SET
         exp               = $1,
         streak            = $2,
         last_practice_day = $3,
         creatures         = $4,
         phrase_struggles  = $5,
         animation_state   = $6,
         updated_at        = now()
       WHERE user_id = $7`,
      [
        newState.exp,
        newState.streak,
        newState.last_practice_day,
        JSON.stringify(newState.creatures),
        JSON.stringify(newState.phrase_struggles),
        newState.animation_state,
        userId,
      ],
    );

    return res.json({
      expAwarded,
      eggAwarded,
      eggType,
      multiplier,
      state: serializeState({ ...gs, ...newState }),
    });
  } catch (err) {
    console.error('POST /api/game/practice error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/game/advance-day ────────────────────────────────────────────────
// body: { userId }
router.post('/advance-day', auth, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required.' });

  try {
    const gs     = await ensureGameState(userId);
    const result = engine.advanceDay(gs);

    const { newState, wolfStruck, stolenId, multiplier, hatchedIds, flyingIds } = result;

    await db.query(
      `UPDATE game_state SET
         day             = $1,
         streak          = $2,
         creatures       = $3,
         animation_state = $4,
         updated_at      = now()
       WHERE user_id = $5`,
      [
        newState.day,
        newState.streak,
        JSON.stringify(newState.creatures),
        newState.animation_state,
        userId,
      ],
    );

    return res.json({
      wolfStruck,
      stolenId,
      multiplier,
      hatchedIds,
      flyingIds,
      state: serializeState({ ...gs, ...newState }),
    });
  } catch (err) {
    console.error('POST /api/game/advance-day error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
