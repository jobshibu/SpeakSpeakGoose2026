const db = require('../db');

// XP required to reach each level (index = level number, value = cumulative XP)
const LEVEL_THRESHOLDS = [0, 500, 1200, 2200, 3500, 5000];

const BADGE_DEFINITIONS = {
  first_word:     (stats) => stats.total_phrases >= 1,
  streak_3:       (stats) => stats.streak >= 3,
  streak_7:       (stats) => stats.streak >= 7,
  score_80:       (stats, extra) => (extra.latestScore || 0) >= 0.8,
  score_95:       (stats, extra) => (extra.latestScore || 0) >= 0.95,
  mastery_first:  (stats, extra) => (extra.newMastered || []).length >= 1,
  mastery_5:      (stats, extra) => (extra.totalMastered || 0) >= 5,
  level_3:        (stats) => stats.level >= 3,
};

/** Compute XP to award for one session. */
function computeXP(score, streak, masteryBonus = 0) {
  const base = 10;
  const scoreBonus = Math.floor(score * 20);
  const streakBonus = streak * 2;
  return base + scoreBonus + streakBonus + masteryBonus;
}

/** Determine the level for a given cumulative XP total. */
function xpToLevel(xp) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return Math.min(level, LEVEL_THRESHOLDS.length);
}

/** XP needed to reach the next level threshold from current XP. */
function xpToNextLevel(xp) {
  const current = xpToLevel(xp);
  if (current >= LEVEL_THRESHOLDS.length) return 0;
  return LEVEL_THRESHOLDS[current] - xp;
}

/**
 * Process the end of a session.
 *
 * @param {string} userId
 * @param {number} finalScore  0.0–1.0
 * @param {string[]} newMastered  phonemes newly mastered in this session
 * @param {number} totalMastered  total mastered phonemes so far
 * @returns {Promise<Object>} { xp, level, newLevel, badgesEarned, masteredPhonemes }
 */
async function processSession(userId, finalScore, newMastered = [], totalMastered = 0) {
  // Load current stats
  const { rows } = await db.query(
    `SELECT xp, level, streak, last_session_date, total_phrases, badges
     FROM   user_stats
     WHERE  user_id = $1`,
    [userId],
  );

  if (rows.length === 0) {
    throw new Error(`user_stats row not found for userId ${userId}`);
  }

  const stats = rows[0];
  const today = new Date();
  const todayDate = today.toISOString().slice(0, 10);

  // ── Streak ────────────────────────────────────────────────────────────────
  let newStreak = stats.streak;
  const last = stats.last_session_date
    ? new Date(stats.last_session_date)
    : null;

  if (last) {
    const diffDays = Math.floor(
      (today.setHours(0,0,0,0) - last.setHours(0,0,0,0)) / 86400000,
    );
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
    // diffDays === 0 means same day — streak unchanged
  } else {
    newStreak = 1;
  }

  // ── XP + Level ────────────────────────────────────────────────────────────
  const masteryBonus = newMastered.length * 50;
  const earnedXP = computeXP(finalScore, newStreak, masteryBonus);
  const newXP = stats.xp + earnedXP;
  const newLevel = xpToLevel(newXP);
  const didLevelUp = newLevel > stats.level;

  // ── Badges ────────────────────────────────────────────────────────────────
  const currentBadges = new Set(stats.badges || []);
  const updatedStats = {
    ...stats,
    xp: newXP,
    level: newLevel,
    streak: newStreak,
    total_phrases: stats.total_phrases + 1,
  };
  const extra = { latestScore: finalScore, newMastered, totalMastered };

  const badgesEarned = [];
  for (const [badge, check] of Object.entries(BADGE_DEFINITIONS)) {
    if (!currentBadges.has(badge) && check(updatedStats, extra)) {
      badgesEarned.push(badge);
      currentBadges.add(badge);
    }
  }

  // ── Persist ───────────────────────────────────────────────────────────────
  await db.query(
    `UPDATE user_stats SET
       xp               = $1,
       level            = $2,
       streak           = $3,
       last_session_date = $4,
       total_phrases    = $5,
       badges           = $6
     WHERE user_id = $7`,
    [
      newXP,
      newLevel,
      newStreak,
      todayDate,
      updatedStats.total_phrases,
      Array.from(currentBadges),
      userId,
    ],
  );

  return {
    xp: newXP,
    earnedXP,
    level: newLevel,
    newLevel: didLevelUp,
    streak: newStreak,
    badgesEarned,
    masteredPhonemes: newMastered,
    xpToNext: xpToNextLevel(newXP),
  };
}

module.exports = { processSession, computeXP, xpToLevel, xpToNextLevel };
