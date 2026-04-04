const {
  getMultiplier,
  calculateEXP,
  getCreatureState,
  computeCreatures,
  checkEggReward,
  processPractice,
  advanceDay,
} = require('../services/gameEngine');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeState(overrides = {}) {
  return {
    day: 1,
    exp: 0,
    streak: 0,
    last_practice_day: 0,
    creatures: [],
    phrase_struggles: {},
    animation_state: 'idle',
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. getMultiplier
// ═══════════════════════════════════════════════════════════════════════════════

describe('getMultiplier', () => {
  test('streak 0-2 → 1.0x', () => {
    expect(getMultiplier(0)).toBe(1.0);
    expect(getMultiplier(1)).toBe(1.0);
    expect(getMultiplier(2)).toBe(1.0);
  });

  test('streak 3-5 → 1.5x', () => {
    expect(getMultiplier(3)).toBe(1.5);
    expect(getMultiplier(5)).toBe(1.5);
  });

  test('streak 6-8 → 2.0x', () => {
    expect(getMultiplier(6)).toBe(2.0);
  });

  test('caps at 5.0x', () => {
    expect(getMultiplier(100)).toBe(5.0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. calculateEXP
// ═══════════════════════════════════════════════════════════════════════════════

describe('calculateEXP', () => {
  test('easy + perfect score + no streak = 10', () => {
    expect(calculateEXP('easy', 1.0, 0)).toBe(10);
  });

  test('medium + perfect score + no streak = 20', () => {
    expect(calculateEXP('medium', 1.0, 0)).toBe(20);
  });

  test('hard + perfect score + no streak = 35', () => {
    expect(calculateEXP('hard', 1.0, 0)).toBe(35);
  });

  test('easy + 50% accuracy + no streak = 5', () => {
    expect(calculateEXP('easy', 0.5, 0)).toBe(5);
  });

  test('easy + perfect + streak 3 (1.5x) = 15', () => {
    expect(calculateEXP('easy', 1.0, 3)).toBe(15);
  });

  test('zero score yields zero EXP', () => {
    expect(calculateEXP('hard', 0, 10)).toBe(0);
  });

  test('unknown difficulty falls back to 10 base', () => {
    expect(calculateEXP('legendary', 1.0, 0)).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. getCreatureState
// ═══════════════════════════════════════════════════════════════════════════════

describe('getCreatureState', () => {
  test('age 0 → egg', ()  => expect(getCreatureState(1, 1)).toBe('egg'));
  test('age 4 → egg', ()  => expect(getCreatureState(1, 5)).toBe('egg'));
  test('age 5 → chick', () => expect(getCreatureState(1, 6)).toBe('chick'));
  test('age 9 → chick', () => expect(getCreatureState(1, 10)).toBe('chick'));
  test('age 10 → goose', () => expect(getCreatureState(1, 11)).toBe('goose'));
  test('age 11 → goose', () => expect(getCreatureState(1, 12)).toBe('goose'));
  test('age 12 → gone', ()  => expect(getCreatureState(1, 13)).toBe('gone'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. computeCreatures
// ═══════════════════════════════════════════════════════════════════════════════

describe('computeCreatures', () => {
  test('removes gone creatures', () => {
    const creatures = [
      { id: 'a', earned_day: 1 },  // age 12 on day 13 → gone
      { id: 'b', earned_day: 10 }, // age 3 on day 13 → egg
    ];
    const result = computeCreatures(creatures, 13);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b');
    expect(result[0].state).toBe('egg');
  });

  test('empty list stays empty', () => {
    expect(computeCreatures([], 5)).toEqual([]);
  });

  test('assigns correct states', () => {
    const creatures = [
      { id: 'egg',   earned_day: 10 }, // age 0
      { id: 'chick', earned_day: 5  }, // age 5
      { id: 'goose', earned_day: 0  }, // age 10
    ];
    const result = computeCreatures(creatures, 10);
    const byId = Object.fromEntries(result.map(c => [c.id, c.state]));
    expect(byId.egg).toBe('egg');
    expect(byId.chick).toBe('chick');
    expect(byId.goose).toBe('goose');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. checkEggReward
// ═══════════════════════════════════════════════════════════════════════════════

describe('checkEggReward', () => {
  test('stretch challenge + score ≥ 0.90 → stretch egg', () => {
    expect(checkEggReward({ score: 0.90, isStretchChallenge: true, phraseStruggleCount: 0 })).toBe('stretch');
    expect(checkEggReward({ score: 1.00, isStretchChallenge: true, phraseStruggleCount: 0 })).toBe('stretch');
  });

  test('stretch challenge + score < 0.90 → no egg', () => {
    expect(checkEggReward({ score: 0.89, isStretchChallenge: true, phraseStruggleCount: 0 })).toBeNull();
  });

  test('struggle breakthrough: 5+ failures + score ≥ 0.90 → struggle egg', () => {
    expect(checkEggReward({ score: 0.90, isStretchChallenge: false, phraseStruggleCount: 5 })).toBe('struggle');
    expect(checkEggReward({ score: 0.95, isStretchChallenge: false, phraseStruggleCount: 10 })).toBe('struggle');
  });

  test('struggle but < 5 failures → no egg', () => {
    expect(checkEggReward({ score: 0.95, isStretchChallenge: false, phraseStruggleCount: 4 })).toBeNull();
  });

  test('focus word + score ≥ 0.90 → focus egg', () => {
    expect(checkEggReward({ score: 0.90, isStretchChallenge: false, isFocusWord: true, phraseStruggleCount: 0 })).toBe('focus');
    expect(checkEggReward({ score: 1.00, isStretchChallenge: false, isFocusWord: true, phraseStruggleCount: 0 })).toBe('focus');
  });

  test('focus word + score < 0.90 → no egg', () => {
    expect(checkEggReward({ score: 0.89, isStretchChallenge: false, isFocusWord: true, phraseStruggleCount: 0 })).toBeNull();
  });

  test('no stretch, no focus, no struggles → no egg', () => {
    expect(checkEggReward({ score: 1.0, isStretchChallenge: false, isFocusWord: false, phraseStruggleCount: 0 })).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. processPractice
// ═══════════════════════════════════════════════════════════════════════════════

describe('processPractice', () => {
  test('awards EXP on normal practice', () => {
    const gs = makeState({ streak: 0 });
    const { expAwarded, eggAwarded } = processPractice(gs, {
      phraseId: 'p1', score: 0.8, difficulty: 'easy', isStretchChallenge: false,
    });
    expect(expAwarded).toBeGreaterThan(0);
    expect(eggAwarded).toBe(false);
  });

  test('no EXP when egg is awarded (stretch)', () => {
    const gs = makeState();
    const { expAwarded, eggAwarded } = processPractice(gs, {
      phraseId: 'p1', score: 0.95, difficulty: 'easy', isStretchChallenge: true, isFocusWord: false,
    });
    expect(eggAwarded).toBe(true);
    expect(expAwarded).toBe(0);
  });

  test('focus word + score ≥ 0.90 → focus egg, no EXP', () => {
    const gs = makeState();
    const { expAwarded, eggAwarded, eggType } = processPractice(gs, {
      phraseId: 'p1', score: 0.92, difficulty: 'easy', isStretchChallenge: false, isFocusWord: true,
    });
    expect(eggAwarded).toBe(true);
    expect(eggType).toBe('focus');
    expect(expAwarded).toBe(0);
  });

  test('focus word + score < 0.90 → no egg, EXP awarded', () => {
    const gs = makeState();
    const { expAwarded, eggAwarded } = processPractice(gs, {
      phraseId: 'p1', score: 0.75, difficulty: 'easy', isStretchChallenge: false, isFocusWord: true,
    });
    expect(eggAwarded).toBe(false);
    expect(expAwarded).toBeGreaterThan(0);
  });

  test('streak increments on first practice of the day', () => {
    const gs = makeState({ day: 2, streak: 3, last_practice_day: 1 });
    const { newState } = processPractice(gs, {
      phraseId: 'p1', score: 0.8, difficulty: 'easy', isStretchChallenge: false,
    });
    expect(newState.streak).toBe(4);
  });

  test('streak does not increment on second practice same day', () => {
    const gs = makeState({ day: 2, streak: 3, last_practice_day: 2 });
    const { newState } = processPractice(gs, {
      phraseId: 'p1', score: 0.8, difficulty: 'easy', isStretchChallenge: false,
    });
    expect(newState.streak).toBe(3);
  });

  test('low score increments struggle count', () => {
    const gs = makeState({ phrase_struggles: { p1: 2 } });
    const { newState } = processPractice(gs, {
      phraseId: 'p1', score: 0.5, difficulty: 'easy', isStretchChallenge: false,
    });
    expect(newState.phrase_struggles.p1).toBe(3);
  });

  test('struggle egg resets struggle count', () => {
    const gs = makeState({ phrase_struggles: { p1: 5 } });
    const { newState, eggAwarded } = processPractice(gs, {
      phraseId: 'p1', score: 0.95, difficulty: 'easy', isStretchChallenge: false,
    });
    expect(eggAwarded).toBe(true);
    expect(newState.phrase_struggles.p1).toBeUndefined();
  });

  test('egg creature added on egg award', () => {
    const gs = makeState();
    const { newState } = processPractice(gs, {
      phraseId: 'p1', score: 0.95, difficulty: 'easy', isStretchChallenge: true,
    });
    expect(newState.creatures).toHaveLength(1);
    expect(newState.creatures[0].earned_day).toBe(1);
  });

  test('animation_state = egg-earned when egg awarded', () => {
    const gs = makeState();
    const { newState } = processPractice(gs, {
      phraseId: 'p1', score: 0.95, difficulty: 'easy', isStretchChallenge: true,
    });
    expect(newState.animation_state).toBe('egg-earned');
  });

  test('animation_state = exp-gain when score ≥ 0.85 and no egg', () => {
    const gs = makeState();
    const { newState } = processPractice(gs, {
      phraseId: 'p1', score: 0.88, difficulty: 'easy', isStretchChallenge: false,
    });
    expect(newState.animation_state).toBe('exp-gain');
  });

  test('animation_state = idle when score < 0.85 and no egg', () => {
    const gs = makeState();
    const { newState } = processPractice(gs, {
      phraseId: 'p1', score: 0.5, difficulty: 'easy', isStretchChallenge: false,
    });
    expect(newState.animation_state).toBe('idle');
  });

  test('BIGINT string exp is coerced correctly', () => {
    const gs = makeState({ exp: '100' }); // PostgreSQL returns BIGINT as string
    const { newState } = processPractice(gs, {
      phraseId: 'p1', score: 1.0, difficulty: 'easy', isStretchChallenge: false,
    });
    expect(typeof newState.exp).toBe('number');
    expect(newState.exp).toBeGreaterThan(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. advanceDay
// ═══════════════════════════════════════════════════════════════════════════════

describe('advanceDay', () => {
  test('day increments by 1', () => {
    const gs = makeState({ day: 3, last_practice_day: 3 });
    const { newState } = advanceDay(gs);
    expect(newState.day).toBe(4);
  });

  test('practiced today: streak preserved, no wolf', () => {
    const gs = makeState({ day: 2, streak: 5, last_practice_day: 2 });
    const { wolfStruck, newState } = advanceDay(gs);
    expect(wolfStruck).toBe(false);
    expect(newState.streak).toBe(5);
  });

  test('missed practice: streak resets, wolf strikes', () => {
    const gs = makeState({ day: 2, streak: 5, last_practice_day: 1 });
    const { wolfStruck, newState } = advanceDay(gs);
    expect(wolfStruck).toBe(true);
    expect(newState.streak).toBe(0);
  });

  test('wolf steals newest egg', () => {
    const gs = makeState({
      day: 2,
      last_practice_day: 1,
      creatures: [
        { id: 'old', earned_day: 1 },
        { id: 'new', earned_day: 2 },
      ],
    });
    const { stolenId, newState } = advanceDay(gs);
    expect(stolenId).toBe('new');
    expect(newState.creatures.find(c => c.id === 'new')).toBeUndefined();
    expect(newState.creatures.find(c => c.id === 'old')).toBeDefined();
  });

  test('wolf strikes but no eggs: stolenId is null', () => {
    const gs = makeState({ day: 2, last_practice_day: 1, creatures: [] });
    const { stolenId, wolfStruck } = advanceDay(gs);
    expect(wolfStruck).toBe(true);
    expect(stolenId).toBeNull();
  });

  test('egg hatches to chick at age 5', () => {
    // Egg earned on day 1, advancing from day 5 to day 6 → hatches
    const gs = makeState({
      day: 5,
      last_practice_day: 5,
      creatures: [{ id: 'e1', earned_day: 1 }],
    });
    const { hatchedIds } = advanceDay(gs);
    expect(hatchedIds).toContain('e1');
  });

  test('goose flies away at age 12', () => {
    // Creature earned on day 1, currently day 12, advancing to day 13 → flies
    const gs = makeState({
      day: 12,
      last_practice_day: 12,
      creatures: [{ id: 'g1', earned_day: 1 }],
    });
    const { flyingIds, newState } = advanceDay(gs);
    expect(flyingIds).toContain('g1');
    expect(newState.creatures.find(c => c.id === 'g1')).toBeUndefined();
  });

  test('animation: wolf-attacks takes priority over others', () => {
    const gs = makeState({
      day: 5,
      last_practice_day: 1, // missed
      creatures: [{ id: 'e1', earned_day: 1 }], // would hatch
    });
    const { newState } = advanceDay(gs);
    expect(newState.animation_state).toBe('wolf-attacks');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. stripFences (claude.js utility — tested via re-import)
// ═══════════════════════════════════════════════════════════════════════════════

// We test stripFences behaviour indirectly by verifying the fix:
// A JSON object containing an array should return the OBJECT, not the array.
describe('stripFences (regression)', () => {
  // Inline the function since it's not exported — must mirror claude.js exactly
  function stripFences(raw) {
    let cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    if (cleaned.startsWith('[')) {
      const arrayMatch = cleaned.match(/(\[[\s\S]*\])/);
      if (arrayMatch) return arrayMatch[1];
    }
    const objectMatch = cleaned.match(/(\{[\s\S]*\})/);
    if (objectMatch) return objectMatch[1];
    const arrayMatch = cleaned.match(/(\[[\s\S]*\])/);
    if (arrayMatch) return arrayMatch[1];
    return cleaned;
  }

  test('plain JSON object returned as-is', () => {
    const input = '{"score": 0.65, "advice": "good"}';
    const result = JSON.parse(stripFences(input));
    expect(result.score).toBe(0.65);
  });

  test('JSON object with embedded array: returns object not array', () => {
    const input = `{
      "score": 0.65,
      "phonemeBreakdown": [{"phoneme": "/r/", "status": "hit"}],
      "advice": "good"
    }`;
    const result = JSON.parse(stripFences(input));
    expect(result.score).toBe(0.65);
    expect(Array.isArray(result.phonemeBreakdown)).toBe(true);
  });

  test('strips markdown code fences', () => {
    const input = '```json\n{"score": 0.5}\n```';
    const result = JSON.parse(stripFences(input));
    expect(result.score).toBe(0.5);
  });

  test('bare array is returned as full array (not inner object)', () => {
    const input = '[{"word": "run"}, {"word": "cat"}]';
    const result = JSON.parse(stripFences(input));
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  test('preamble text before JSON object is stripped', () => {
    const input = 'Here is your JSON:\n{"score": 0.7, "advice": "nice"}';
    const result = JSON.parse(stripFences(input));
    expect(result.score).toBe(0.7);
  });
});
