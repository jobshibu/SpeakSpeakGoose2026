import React from 'react';
import { Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function HintBar({ hint, tongue, lips }) {
  const hasContent = hint || tongue || lips;

  return (
    <AnimatePresence>
      {hasContent && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          className="w-full bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg shadow-sm mb-6"
        >
          <div className="flex items-start gap-3">
            <div className="text-amber-500 mt-0.5">
              <Lightbulb size={20} />
            </div>
            <div className="space-y-2">
              {hint && (
                <div>
                  <p className="text-sm font-bold text-amber-800 mb-1">Quick Hint</p>
                  <p className="text-sm text-amber-700 leading-relaxed">{hint}</p>
                </div>
              )}
              {tongue && (
                <div>
                  <p className="text-sm font-bold text-amber-800 mb-1">Tongue</p>
                  <p className="text-sm text-amber-700 leading-relaxed">{tongue}</p>
                </div>
              )}
              {lips && (
                <div>
                  <p className="text-sm font-bold text-amber-800 mb-1">Lips</p>
                  <p className="text-sm text-amber-700 leading-relaxed">{lips}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
