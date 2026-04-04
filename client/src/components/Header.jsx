import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store';

export default function Header({ dark = false, showLogo = true, showStats = true, transparent = false }) {
  const navigate = useNavigate();
  const logout = useAppStore(state => state.logout);

  const textColor = dark ? 'text-gray-900' : 'text-white';
  const dropShadow = dark ? '' : 'drop-shadow-md';

  if (transparent) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4">
        <h1 className="text-4xl font-black text-transparent select-none">
          SpeakSpeak Goose
        </h1>
        <div className="flex items-center gap-6">
          <span
            onClick={() => navigate('/pick')}
            className="text-transparent font-black text-xl cursor-pointer select-none"
          >
            Practice
          </span>
          <span
            onClick={() => navigate('/stats')}
            className="text-transparent font-black text-xl cursor-pointer select-none"
          >
            Stats and Flock
          </span>
          <span
            onClick={logout}
            className="text-transparent font-black text-xl cursor-pointer select-none"
          >
            Logout
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative z-10 w-full max-w-4xl flex ${showLogo ? 'justify-between' : 'justify-end'} items-center mb-12`}>
      <div className="flex items-center gap-6">
        {showLogo && (
          <h1 
            onClick={() => navigate('/pick')}
            className="text-4xl font-black text-green-600 flex items-center gap-2 cursor-pointer"
          >
            SpeakSpeak <span className={`${textColor} ${dropShadow}`}>Goose</span>
          </h1>
        )}
        <span 
          onClick={() => navigate('/pick')}
          className={`${textColor} ${dropShadow} font-black text-xl cursor-pointer hover:text-green-600 transition-colors`}
        >
          Practice
        </span>
        {showStats ? (
          <span 
            onClick={() => navigate('/stats')}
            className={`${textColor} ${dropShadow} font-black text-xl cursor-pointer hover:text-green-600 transition-colors`}
          >
            Stats and Flock
          </span>
        ) : (
          <div 
            onClick={() => navigate('/stats')}
            className="w-32 h-8 cursor-pointer"
            aria-label="Stats and Flock"
          />
        )}
        <span 
          onClick={logout}
          className={`${textColor} ${dropShadow} font-black text-xl cursor-pointer hover:text-red-500 transition-colors`}
        >
          Logout
        </span>
      </div>
    </div>
  );
}
