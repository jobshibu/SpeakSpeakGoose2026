import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, RefreshCw, Star, Award, TrendingUp, Loader2 } from 'lucide-react';
import { practiceApi, phraseApi } from '../api';
import useAppStore from '../store';
import ScoreCircle from '../components/ScoreCircle';
import PhonemePill from '../components/PhonemePill';
import Header from '../components/Header';

export default function FeedbackScreen() {
  const [saving, setSaving] = useState(true);
  const [sessionResult, setSessionResult] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const currentPhrase = useAppStore(state => state.currentPhrase);
  const currentSession = useAppStore(state => state.currentSession);
  const userId = useAppStore(state => state.userId);
  const resetSession = useAppStore(state => state.resetSession);
  const setUserStats = useAppStore(state => state.setUserStats);
  const navigate = useNavigate();

  const finalAttempt = currentSession.attempts.find(a => a.attempt === 3);

  useEffect(() => {
    if (!currentPhrase || !finalAttempt) {
      navigate('/pick');
      return;
    }

    const saveSession = async () => {
      try {
        const result = await practiceApi.saveSession({
          userId,
          wordId: currentPhrase.id,
          finalScore: currentSession.finalScore,
          attempts: currentSession.attempts.map(a => ({
            number: a.attempt,
            score: a.score,
            transcript: a.transcript
          }))
        });
        
        setSessionResult(result);
        
        // Refresh stats
        const stats = await phraseApi.getStats(userId);
        setUserStats(stats);
        
        if (result.badgesEarned?.length > 0 || result.newLevel) {
          setShowCelebration(true);
        }
      } catch (err) {
        console.error('Failed to save session:', err);
      } finally {
        setSaving(false);
      }
    };

    saveSession();
  }, []);

  if (saving) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-xl font-bold text-gray-900">Generating Feedback...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32 pt-8 px-6">
      <div className="max-w-4xl mx-auto">
        <Header dark />
        <header className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-black uppercase tracking-widest mb-6">
            Practice Complete
          </span>
          <h1 className="text-3xl font-black text-gray-900 mb-8">Great Work!</h1>
          
          <div className="flex justify-center mb-8">
            <ScoreCircle score={currentSession.finalScore} />
          </div>
          
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm inline-block">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Final Transcript</p>
            <p className="text-xl font-medium text-gray-700 italic">"{finalAttempt.transcript}"</p>
          </div>
        </header>

        <section className="space-y-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="text-blue-600" />
              Phoneme Breakdown
            </h2>
            <div className="flex flex-wrap gap-4">
              {finalAttempt.phonemeBreakdown?.map((p, i) => (
                <PhonemePill key={i} {...p} />
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-6 italic">Tap a phoneme to see detailed feedback</p>
          </div>

          <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-100">
            <h2 className="text-xl font-black mb-4">AI Advice</h2>
            <p className="text-blue-50 leading-relaxed mb-8">
              {finalAttempt.advice}
            </p>
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
              <p className="text-xs font-black uppercase tracking-widest mb-2 text-blue-200">Practice Drill</p>
              <p className="text-lg font-bold">{finalAttempt.drill}</p>
            </div>
          </div>

          {sessionResult && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center mb-3">
                  <Star fill="currentColor" />
                </div>
                <p className="text-2xl font-black text-gray-900">+{sessionResult.xp} XP</p>
                <p className="text-xs font-bold text-gray-400 uppercase">Earned</p>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                  <TrendingUp />
                </div>
                <p className="text-2xl font-black text-gray-900">Lvl {sessionResult.level}</p>
                <p className="text-xs font-bold text-gray-400 uppercase">Current Level</p>
              </div>
            </div>
          )}
        </section>

        <div className="fixed bottom-8 left-6 right-6 max-w-2xl mx-auto flex gap-4">
          <button
            onClick={() => {
              resetSession();
              navigate('/record');
            }}
            className="flex-1 bg-white border-2 border-gray-200 text-gray-700 font-black py-5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <RefreshCw size={20} />
            Try Again
          </button>
          <button
            onClick={() => {
              resetSession();
              navigate('/pick');
            }}
            className="flex-1 bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            Next Word
            <ChevronRight size={20} />
          </button>
        </div>

        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-blue-600/95 flex items-center justify-center p-8 text-center text-white"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="max-w-md"
              >
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Award size={64} />
                </div>
                <h2 className="text-4xl font-black mb-4">
                  {sessionResult.newLevel ? "Level Up!" : "New Badge!"}
                </h2>
                <p className="text-xl text-blue-100 mb-12">
                  {sessionResult.newLevel 
                    ? `You've reached Level ${sessionResult.level}!` 
                    : `You earned: ${sessionResult.badgesEarned[0]}`}
                </p>
                <button
                  onClick={() => setShowCelebration(false)}
                  className="w-full bg-white text-blue-600 font-black py-5 rounded-2xl text-xl shadow-2xl active:scale-95 transition-all"
                >
                  Awesome!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
