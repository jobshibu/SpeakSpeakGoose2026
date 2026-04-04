import { useState, useCallback, useEffect } from 'react';
import { gameApi } from '../api/gameApi.js';

const ANIM_DURATION = 2200; // ms to show animation state before clearing

export function useGame(auth) {
  const [gameState,      setGameState]      = useState(null);
  const [phrase,         setPhrase]         = useState(null);
  const [feedback,       setFeedback]       = useState(null);
  const [attemptNum,     setAttemptNum]     = useState(1);
  const [animationState, setAnimationState] = useState('idle');
  const [floatingEXP,    setFloatingEXP]    = useState(null);  // { amount, key }
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');

  const { token, userId } = auth;

  // ── Trigger an animation then clear it ─────────────────────────────────────
  const triggerAnim = useCallback((state, delay = ANIM_DURATION) => {
    setAnimationState(state);
    setTimeout(() => setAnimationState('idle'), delay);
  }, []);

  // ── Load game state ─────────────────────────────────────────────────────────
  const loadState = useCallback(async () => {
    if (!token || !userId) return;
    try {
      const gs = await gameApi.getState(userId, token);
      setGameState(gs);
      if (gs.animationState && gs.animationState !== 'idle') {
        triggerAnim(gs.animationState);
      }
    } catch (e) {
      setError(e.message);
    }
  }, [token, userId, triggerAnim]);

  // ── Load next phrase ────────────────────────────────────────────────────────
  const loadPhrase = useCallback(async () => {
    if (!token || !userId) return;
    try {
      const p = await gameApi.getPhrase(userId, token);
      setPhrase(p);
      setFeedback(null);
      setAttemptNum(1);
    } catch (e) {
      setError(e.message);
    }
  }, [token, userId]);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (token && userId) {
      loadState();
      loadPhrase();
    }
  }, [token, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit practice attempt ─────────────────────────────────────────────────
  const submitPractice = useCallback(async (audioBlob) => {
    if (!phrase || !audioBlob) return;
    setLoading(true);
    setError('');
    try {
      // Send audio to backend → Gemini transcribes → Claude analyses
      const attemptResult = await gameApi.submitAttempt({
        phraseId:  phrase.phrase.id,
        userId,
        audioBlob,
        attemptNum,
      }, token);

      const score    = attemptResult.score ?? 0;
      const isFinal  = attemptNum >= 3;

      if (!isFinal) {
        // Attempts 1 & 2: show hint only, increment attempt counter
        setFeedback({
          score,
          hint:        attemptResult.hint,
          tongue:      attemptResult.tongue,
          lips:        attemptResult.lips,
          transcript:  attemptResult.transcript,
          attemptNum,
          isFinal:     false,
        });
        setAttemptNum(prev => prev + 1);
      } else {
        // Attempt 3: full feedback + submit to game engine
        const practiceResult = await gameApi.practice({
          userId,
          phraseId:           phrase.phrase.id,
          score,
          difficulty:         phrase.difficulty,
          isStretchChallenge: phrase.isStretchChallenge,
          isFocusWord:        phrase.isFocusWord,
        }, token);

        setGameState(practiceResult.state);
        setFeedback({
          score,
          expAwarded:   practiceResult.expAwarded,
          eggAwarded:   practiceResult.eggAwarded,
          eggType:      practiceResult.eggType,
          multiplier:   practiceResult.multiplier,
          fullFeedback: attemptResult.fullFeedback,
          transcript:   attemptResult.transcript,
          attemptNum:   3,
          isFinal:      true,
        });

        // Trigger animations
        if (practiceResult.eggAwarded) {
          triggerAnim('egg-earned', 3000);
        } else if (practiceResult.expAwarded > 0) {
          setFloatingEXP({ amount: practiceResult.expAwarded, key: Date.now() });
          triggerAnim('exp-gain', 1500);
          setTimeout(() => setFloatingEXP(null), 1500);
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [phrase, userId, token, attemptNum, triggerAnim]);

  // ── Advance to next day ─────────────────────────────────────────────────────
  const advanceDay = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await gameApi.advanceDay(userId, token);
      setGameState(result.state);
      setFeedback(null);
      await loadPhrase();

      if (result.wolfStruck) {
        triggerAnim('wolf-attacks', 3000);
      } else if (result.flyingIds?.length) {
        triggerAnim('goose-flies', 2000);
      } else if (result.hatchedIds?.length) {
        triggerAnim('chick-hatch', 2000);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId, token, loadPhrase, triggerAnim]);

  const clearFeedback = useCallback(() => setFeedback(null), []);

  return {
    gameState,
    phrase,
    feedback,
    attemptNum,
    clearFeedback,
    animationState,
    floatingEXP,
    loading,
    error,
    submitPractice,
    advanceDay,
    loadPhrase,
    setError,
  };
}
