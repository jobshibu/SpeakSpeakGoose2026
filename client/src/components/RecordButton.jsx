import React from 'react';
import { Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function RecordButton({ isRecording, onStart, onStop }) {
  return (
    <div className="relative flex items-center justify-center">
      <AnimatePresence>
        {isRecording && (
          <>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0.2 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
              className="absolute w-24 h-24 bg-blue-500 rounded-full"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0.3 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.5 }}
              className="absolute w-24 h-24 bg-blue-400 rounded-full"
            />
          </>
        )}
      </AnimatePresence>

      <button
        onClick={isRecording ? onStop : onStart}
        className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg ${
          isRecording
            ? 'bg-red-500 text-white shadow-red-200'
            : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'
        }`}
      >
        <Mic size={40} className={isRecording ? 'animate-pulse' : ''} />
      </button>

      <p className="absolute -bottom-10 text-sm font-medium text-gray-500 whitespace-nowrap">
        {isRecording ? 'Tap to stop' : 'Tap to record'}
      </p>
    </div>
  );
}
