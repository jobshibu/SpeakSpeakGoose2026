import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { phraseApi } from '../api';
import useAppStore from '../store';
import { Loader2 } from 'lucide-react';
import Header from '../components/Header';

import homeBg from '../assets/Updatedhomebackground.jpg';

const GooseCharacter = () => (
  <motion.div 
    // animate={{ y: [0, -5, 0] }}
    transition={{ repeat: Infinity, duration: 4,}}
    className="relative w-56 h-56"
  >
    <img 
      src="src/assets/Screenshot_2026-04-04_at_3.09.20_AM-removebg-preview.png" 
      alt="Goose" 
      className="w-full h-full object-contain"
      referrerPolicy="no-referrer"
    />
  </motion.div>
);

const Tree = ({ className }) => (
  <div className={className}>
    <svg viewBox="0 0 100 150" className="w-full h-full">
      <rect x="45" y="100" width="10" height="50" fill="#78350f" />
      <path d="M10 100 Q50 0 90 100 Z" fill="#166534" />
    </svg>
  </div>
);

export default function PickPhraseScreen() {
  const [phrases, setPhrases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customPhrase, setCustomPhrase] = useState('');
  
  const userId = useAppStore(state => state.userId);
  const setCurrentPhrase = useAppStore(state => state.setCurrentPhrase);
  const logout = useAppStore(state => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPhrases = async () => {
      setLoading(true);
      try {
        const data = await phraseApi.getPhrases(userId);
        setPhrases(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPhrases();
  }, [userId]);

  const handlePrompt = () => {
    if (phrases.length > 0) {
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      setCurrentPhrase(randomPhrase);
      navigate('/hear');
    }
  };

  const handleCustomUse = () => {
    if (!customPhrase.trim()) return;
    setCurrentPhrase({
      id: `custom-${Date.now()}`,
      word: customPhrase.trim(),
      ipa: null,
      phonemic: null,
    });
    navigate('/hear');
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex flex-col items-center pt-2 px-6"
      style={{ 
        backgroundImage: `url(${homeBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <Header transparent={true} />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-2xl mt-auto pb-4">
        {/* Speech Bubble */}
        <div className="bg-white border-4 border-[#5d4037] rounded-[40px] px-12 py-6 mb-8 relative shadow-lg">
          <p className="text-2xl font-black text-[#333]">Hi! What would you like to work on today?</p>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border-r-4 border-b-4 border-[#5d4037] rotate-45" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-6 mb-12 w-full justify-center">
          <button
            onClick={handlePrompt}
            className="bg-[#ffb74d] border-4 border-[#5d4037] rounded-[20px] px-8 py-4 text-white font-black text-xl shadow-[0_6px_0_#5d4037] active:shadow-none active:translate-y-1 transition-all"
          >
            Give me a prompt
          </button>
          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="bg-[#ffb74d] border-4 border-[#5d4037] rounded-[20px] px-8 py-4 text-white font-black text-xl shadow-[0_6px_0_#5d4037] active:shadow-none active:translate-y-1 transition-all"
          >
            Type my own phrase
          </button>
        </div>

        {/* Custom Input (Conditional) */}
        {showCustomInput && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-4 border-[#5d4037] rounded-3xl p-6 mb-8 w-full shadow-xl"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={customPhrase}
                onChange={(e) => setCustomPhrase(e.target.value)}
                placeholder="Enter your phrase..."
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none font-bold"
              />
              <button
                onClick={handleCustomUse}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-black active:scale-95 transition-all"
              >
                Go!
              </button>
            </div>
          </motion.div>
        )}

        {/* Goose */}
        <div className="flex items-end gap-12 mt-4">
          <GooseCharacter />
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
          <Loader2 className="animate-spin text-green-600" size={48} />
        </div>
      )}
    </div>
  );
}

