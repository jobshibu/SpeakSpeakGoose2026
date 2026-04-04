import React from 'react';
import { motion } from 'motion/react';

export default function XPBar({ xp, xpToNext }) {
  const progress = Math.min((xp / xpToNext) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
        <span>XP Progress</span>
        <span>{xp} / {xpToNext} XP</span>
      </div>
      <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          // 1. Removed gradient classes
          // 2. Added inline style for your specific RGB color
          style={{ backgroundColor: 'rgb(87, 157, 66)' }}
          className="h-full"
        />
      </div>
    </div>
  );
}