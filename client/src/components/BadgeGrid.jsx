import React from 'react';
import { Award } from 'lucide-react';

const BADGE_MAP = {
  first_word: { label: "First word", color: "bg-blue-100 text-blue-700 border-blue-200" },
  streak_3: { label: "3 day streak", color: "bg-orange-100 text-orange-700 border-orange-200" },
  streak_7: { label: "7 day streak", color: "bg-red-100 text-red-700 border-red-200" },
  score_80: { label: "Sharp ear", color: "bg-green-100 text-green-700 border-green-200" },
  score_95: { label: "Near perfect", color: "bg-purple-100 text-purple-700 border-purple-200" },
  mastery_first: { label: "First mastery", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  mastery_5: { label: "Phoneme pro", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  level_3: { label: "Rising star", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
};

export default function BadgeGrid({ earnedBadges }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Object.entries(BADGE_MAP).map(([key, info]) => {
        const isEarned = earnedBadges.includes(key);
        return (
          <div
            key={key}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
              isEarned
                ? `${info.color} shadow-sm scale-100`
                : "bg-gray-50 text-gray-400 border-gray-100 grayscale opacity-60"
            }`}
          >
            <div className={`p-2 rounded-full ${isEarned ? 'bg-white/50' : 'bg-gray-200'}`}>
              <Award size={24} />
            </div>
            <span className="text-xs font-bold text-center leading-tight">
              {info.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
