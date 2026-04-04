import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { phraseApi } from '../api';
import useAppStore from '../store';
import { Loader2, Award, Zap, Calendar, Target } from 'lucide-react';
import XPBar from '../components/XPBar';
import BadgeGrid from '../components/BadgeGrid';
import Header from '../components/Header';
import statsBg from '../assets/Statsbackrgoundpudated.jpg';

export default function StatsScreen() {
  const [loading, setLoading] = useState(true);
  const userId = useAppStore(state => state.userId);
  const userStats = useAppStore(state => state.userStats);
  const setUserStats = useAppStore(state => state.setUserStats);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await phraseApi.getStats(userId);
        setUserStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [userId, setUserStats]);

  if (loading || !userStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const statCards = [
    { label: 'Phrases Done', value: userStats.totalPhrases, icon: Target, color: 'text-blue-600 bg-blue-50' },
    { label: 'Avg Score', value: `${Math.round(userStats.avgScore * 100)}%`, icon: Zap, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Day Streak', value: userStats.streak, icon: Calendar, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div 
      className="min-h-screen pb-32 pt-2 px-6 relative"
      style={{ 
        backgroundImage: `url(${statsBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-4xl mx-auto relative z-10">
        <Header transparent={true} />
        <header className="mb-12 flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
            <span className="text-3xl font-black">{userStats.level}</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Level {userStats.level}</h1>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">
              {userStats.level < 5 ? 'Rising Star' : userStats.level < 10 ? 'Phoneme Pro' : 'Pronunciation Master'}
            </p>
          </div>
        </header>

        <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8">
          <XPBar xp={userStats.xp} xpToNext={userStats.xpToNext} />
        </section>

        <div className="grid grid-cols-3 gap-4 mb-12">
          {statCards.map((card, i) => (
            <div key={i} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className={`p-2 rounded-xl mb-2 ${card.color}`}>
                <card.icon size={20} />
              </div>
              <p className="text-xl font-black text-gray-900">{card.value}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{card.label}</p>
            </div>
          ))}
        </div>

        <section className="mb-12">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
            <Award className="text-blue-600" />
            Your Badges
          </h2>
          <BadgeGrid earnedBadges={userStats.badges || []} />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section>
            <h2 className="text-lg font-black text-gray-900 mb-4">Weak Phonemes</h2>
            <div className="flex flex-wrap gap-2">
              {userStats.weakPhonemes?.map((p, i) => (
                <div key={i} className="bg-red-50 text-red-700 border border-red-100 px-4 py-2 rounded-full flex items-center gap-2">
                  <span className="font-mono font-bold">{p.phoneme}</span>
                  <span className="text-xs font-bold opacity-60">{Math.round(p.recent_pct * 100)}%</span>
                </div>
              ))}
              {(!userStats.weakPhonemes || userStats.weakPhonemes.length === 0) && (
                <p className="text-sm text-gray-400 italic">No weak phonemes identified yet!</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-black text-gray-900 mb-4">Mastered</h2>
            <div className="flex flex-wrap gap-2">
              {userStats.masteredPhonemes?.map((p, i) => (
                <div key={i} className="bg-green-50 text-green-700 border border-green-100 px-4 py-2 rounded-full font-mono font-bold">
                  {p}
                </div>
              ))}
              {(!userStats.masteredPhonemes || userStats.masteredPhonemes.length === 0) && (
                <p className="text-sm text-gray-400 italic">Keep practicing to master phonemes!</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
