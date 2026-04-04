import React from 'react';
import { motion } from 'motion/react';

export default function ScoreCircle({ score }) {
  const percentage = Math.round(score * 100);
  
  let color = "text-red-500";
  let strokeColor = "stroke-red-500";
  
  if (percentage >= 75) {
    color = "text-green-500";
    strokeColor = "stroke-green-500";
  } else if (percentage >= 50) {
    color = "text-amber-500";
    strokeColor = "stroke-amber-500";
  }

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          className="stroke-gray-100 fill-none"
          strokeWidth="8"
        />
        <motion.circle
          cx="50%"
          cy="50%"
          r={radius}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`${strokeColor} fill-none`}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeLinecap="round"
        />
      </svg>
      <div className={`absolute inset-0 flex flex-col items-center justify-center ${color}`}>
        <span className="text-4xl font-black">{percentage}</span>
        <span className="text-xs font-bold uppercase tracking-widest">Score</span>
      </div>
    </div>
  );
}
