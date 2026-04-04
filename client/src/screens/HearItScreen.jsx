import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Volume2, Play, ChevronRight, Loader2 } from 'lucide-react';
import { practiceApi } from '../api';
import { useAudio } from '../hooks/useAudio';
import useAppStore from '../store';
import Header from '../components/Header';

export default function HearItScreen() {
  const [loading, setLoading] = useState(false);
  const currentPhrase = useAppStore(state => state.currentPhrase);
  const { playBase64 } = useAudio();
  const navigate = useNavigate();

  if (!currentPhrase) {
    navigate('/pick');
    return null;
  }

  const handleHear = async (speed = 1.0) => {
    setLoading(true);
    try {
      const { audio, mimeType } = await practiceApi.getTTS(currentPhrase.word, speed);
      await playBase64(audio, mimeType || 'audio/mpeg');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-8">
      <Header dark />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center"
      >
        <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-6">
          Phase 1: Listen
        </span>
        
        <h1 className="text-5xl font-black text-gray-900 mb-2 tracking-tight">
          {currentPhrase.word}
        </h1>
        <p className="text-2xl font-mono text-gray-400 mb-12">
          {(() => {
            const raw = (currentPhrase.ipa || '').replace(/^\/*|\/*$/g, '');
            return raw ? `/${raw}/` : '';
          })()}
        </p>

        {currentPhrase.phonemic && (
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl mb-12 text-left">
            <div className="flex items-center gap-2 mb-2 text-indigo-600">
              <Volume2 size={20} />
              <span className="font-bold uppercase text-xs tracking-wider">Pronunciation Tip</span>
            </div>
            <p className="text-indigo-900 font-medium">
              <span className="font-black">{currentPhrase.phonemic.tag}:</span> {currentPhrase.phonemic.detail}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 w-full mb-12">
          <button
            onClick={() => handleHear(1.0)}
            disabled={loading}
            className="flex items-center justify-center gap-3 bg-gray-900 text-white py-5 rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Play size={24} fill="currentColor" />}
            Hear Native Pronunciation
          </button>
          
          <button
            onClick={() => handleHear(0.75)}
            disabled={loading}
            className="flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 py-5 rounded-2xl font-bold hover:border-gray-300 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Volume2 size={24} />}
            Slow Version (0.75x)
          </button>
        </div>

        <button
          onClick={() => navigate('/record')}
          className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-blue-100 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95"
        >
          I'm Ready
          <ChevronRight size={24} />
        </button>
      </motion.div>
    </div>
  );
}
