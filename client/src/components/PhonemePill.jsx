import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function PhonemePill({ phoneme, status, note }) {
  const [showNote, setShowNote] = useState(false);

  const colors = {
    correct: "bg-green-100 text-green-700 border-green-200",
    hit: "bg-green-100 text-green-700 border-green-200",
    missed: "bg-red-100 text-red-700 border-red-200",
    partial: "bg-amber-100 text-amber-800 border-amber-200",
  };

  const tone = colors[status] || colors.correct;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowNote(!showNote)}
        className={`px-4 py-2 rounded-full border font-mono font-bold text-lg transition-transform active:scale-95 ${tone}`}
      >
        {phoneme}
      </button>
      
      <AnimatePresence>
        {showNote && note && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl z-10"
          >
            <div className="relative">
              {note}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
