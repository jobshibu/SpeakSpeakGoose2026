// ─── Pure game logic — no DB, no side effects ─────────────────────────────────

const DIFFICULTY_POINTS = { easy: 10, medium: 20, hard: 35 };
const DIFFICULTY_ORDER  = ['easy', 'medium', 'hard'];

// ── Multiplier ────────────────────────────────────────────────────────────────

function getMultiplier(streak) {
  const tier = Math.floor(streak / 3);
  return Math.min(parseFloat((1 + tier * 0.5).toFixed(1)), 5.0);
}

// ── EXP ───────────────────────────────────────────────────────────────────────

function calculateEXP(difficulty, accuracy, streak) {
  const base = DIFFICULTY_POINTS[difficulty] || 10;
  const mult = getMultiplier(streak);
  return Math.round(base * accuracy * mult);
}

// ── Creature lifecycle ────────────────────────────────────────────────────────
// age 0-4  → egg   🥚
// age 5-9  → chick 🐣
// age 10-11→ goose 🪿
// age 12+  → gone

function getCreatureState(earnedDay, currentDay) {
  const age = currentDay - earnedDay;
  if (age < 5)  return 'egg';
  if (age < 10) return 'chick';
  if (age < 12) return 'goose';
  return 'gone';
}

function computeCreatures(creatures, currentDay) {
  return creatures
    .map(c => ({ ...c, state: getCreatureState(c.earned_day, currentDay) }))
    .filter(c => c.state !== 'gone');
}

// ── Egg reward check ──────────────────────────────────────────────────────────

function checkEggReward({ score, isStretchChallenge, isFocusWord, phraseStruggleCount }) {
  if (isStretchChallenge && score >= 0.90)                   return 'stretch';
  if (isFocusWord        && score >= 0.90)                   return 'focus';
  if ((phraseStruggleCount || 0) >= 5 && score >= 0.90)      return 'struggle';
  return null;
}

// ── Process a practice attempt ────────────────────────────────────────────────

function processPractice(gameState, { phraseId, score, difficulty, isStretchChallenge, isFocusWord }) {
  const { day, last_practice_day, creatures, phrase_struggles } = gameState;
  const exp    = parseInt(gameState.exp,    10) || 0;
  const streak = parseInt(gameState.streak, 10) || 0;

  // Current struggle count for this phrase
  const struggleCount = (phrase_struggles || {})[phraseId] || 0;

  // Check egg reward FIRST — if egg is awarded, no EXP
  const eggType = checkEggReward({ score, isStretchChallenge, isFocusWord, phraseStruggleCount: struggleCount });

  // Update struggle tracking
  const newStruggles = { ...(phrase_struggles || {}) };
  if (score < 0.90) {
    newStruggles[phraseId] = (newStruggles[phraseId] || 0) + 1;
  } else if (eggType === 'struggle') {
    delete newStruggles[phraseId]; // reset on breakthrough
  }

  // Update streak (only if first practice of the day)
  const practicedToday = last_practice_day >= day;
  const newStreak      = practicedToday ? streak : streak + 1;

  // Award EXP only if no egg
  const expAwarded = eggType ? 0 : calculateEXP(difficulty, score, newStreak);
  const newExp     = exp + expAwarded;

  // Add new egg creature if earned
  const newCreatures = [...creatures];
  if (eggType) {
    newCreatures.push({ id: crypto.randomUUID(), earned_day: day });
  }

  return {
    newState: {
      ...gameState,
      exp:               newExp,
      streak:            newStreak,
      last_practice_day: day,
      creatures:         computeCreatures(newCreatures, day),
      phrase_struggles:  newStruggles,
      animation_state:   eggType ? 'egg-earned' : score >= 0.85 ? 'exp-gain' : 'idle',
    },
    expAwarded,
    eggAwarded:  !!eggType,
    eggType,
    multiplier:  getMultiplier(newStreak),
  };
}

// ── Advance day ───────────────────────────────────────────────────────────────

function advanceDay(gameState) {
  const { day, last_practice_day, creatures } = gameState;
  const streak = parseInt(gameState.streak, 10) || 0;
  const practicedToday = last_practice_day >= day;

  let newStreak    = streak;
  let wolfStruck   = false;
  let stolenId     = null;
  let newCreatures = [...creatures];

  if (!practicedToday) {
    newStreak  = 0;
    wolfStruck = true;

    // Steal the newest egg
    const eggs = creatures
      .filter(c => getCreatureState(c.earned_day, day) === 'egg')
      .sort((a, b) => b.earned_day - a.earned_day);

    if (eggs.length > 0) {
      stolenId     = eggs[0].id;
      newCreatures = newCreatures.filter(c => c.id !== stolenId);
    }
  }

  const newDay = day + 1;

  // Remove creatures that have flown away on the new day
  newCreatures = computeCreatures(newCreatures, newDay);

  // Detect lifecycle transitions for animations
  const hatching  = newCreatures.filter(c => c.state === 'chick' &&
    getCreatureState(c.earned_day, day) === 'egg');
  const flying    = creatures.filter(c =>
    getCreatureState(c.earned_day, newDay) === 'gone' &&
    getCreatureState(c.earned_day, day)    !== 'gone');

  let animationState = 'idle';
  if (wolfStruck)         animationState = 'wolf-attacks';
  else if (flying.length) animationState = 'goose-flies';
  else if (hatching.length) animationState = 'chick-hatch';

  return {
    newState: {
      ...gameState,
      day:            newDay,
      streak:         newStreak,
      creatures:      newCreatures,
      animation_state: animationState,
    },
    wolfStruck,
    stolenId,
    multiplier: getMultiplier(newStreak),
    hatchedIds:  hatching.map(c => c.id),
    flyingIds:   flying.map(c => c.id),
  };
}

module.exports = {
  getMultiplier,
  calculateEXP,
  getCreatureState,
  computeCreatures,
  checkEggReward,
  processPractice,
  advanceDay,
};
