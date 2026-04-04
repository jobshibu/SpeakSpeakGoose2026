import React from 'react';

export default function AttemptDots({ current, total = 3 }) {
  return (
    <div className="flex gap-3 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => {
        const attemptNum = i + 1;
        const isDone = attemptNum < current;
        const isActive = attemptNum === current;

        return (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              isDone
                ? 'bg-blue-600 scale-100'
                : isActive
                ? 'bg-blue-400 scale-125 ring-4 ring-blue-100'
                : 'bg-gray-200 scale-100'
            }`}
          />
        );
      })}
    </div>
  );
}
