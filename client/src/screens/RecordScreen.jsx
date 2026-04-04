import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useRecorder } from '../hooks/useRecorder';
import { practiceApi } from '../api';
import useAppStore from '../store';
import RecordButton from '../components/RecordButton';
import AttemptDots from '../components/AttemptDots';
import HintBar from '../components/HintBar';
import Header from '../components/Header';

export default function RecordScreen() {
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  
  const { isRecording, start, stop, blob, reset } = useRecorder();
  const currentPhrase = useAppStore(state => state.currentPhrase);
  const userId = useAppStore(state => state.userId);
  const updateSession = useAppStore(state => state.updateSession);
  const setFinalScore = useAppStore(state => state.setFinalScore);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentPhrase) {
      navigate('/pick');
      return;
    }

    // Request mic permission on mount
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => stream.getTracks().forEach(t => t.stop()))
      .catch(err => {
        console.error('Mic permission denied:', err);
        setError('Microphone access is required for practice.');
      });
  }, [currentPhrase, navigate]);

  useEffect(() => {
    if (blob) {
      handleSubmit();
    }
  }, [blob]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('audio', blob, 'attempt.webm');
    formData.append('phraseId', currentPhrase.id);
    formData.append('userId', userId);
    formData.append('attemptNumber', attemptNumber);

    try {
      const result = await practiceApi.submitAttempt(blob, currentPhrase, attemptNumber);
      setTranscript(result.transcript);
      
      if (attemptNumber < 3) {
        setHint(result.hint);
        updateSession({ attempt: attemptNumber, score: result.score, transcript: result.transcript });
      } else {
        const fb = result.fullFeedback || {};
        setFinalScore(result.score);
        updateSession({ 
          attempt: 3, 
          score: result.score, 
          transcript: result.transcript,
          phonemeBreakdown: fb.phonemeBreakdown,
          advice: fb.advice,
          drill: fb.drill
        });
        navigate('/feedback');
      }
    } catch (err) {
      setError('Failed to process recording. Please try again.');
      reset();
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setTranscript('');
    setHint('');
    reset();
    if (attemptNumber < 3) {
      setAttemptNumber(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-8 items-center">
      <Header dark />
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        <header className="mb-12">
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-8">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(attemptNumber / 3) * 100}%` }}
              className="h-full bg-blue-600"
            />
          </div>
          <AttemptDots current={attemptNumber} />
        </header>

        <main className="flex-1 flex flex-col items-center text-center">
          <motion.div
            key={attemptNumber}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-5xl font-black text-gray-900 mb-2 tracking-tight">
              {currentPhrase?.word}
            </h1>
            <p className="text-2xl font-mono text-gray-400">
              {(() => {
                const raw = (currentPhrase?.ipa || '').replace(/^\/*|\/*$/g, '');
                return raw ? `/${raw}/` : '';
              })()}
            </p>
          </motion.div>

          <div className="w-full mb-12">
            <HintBar hint={hint} />
            
            {transcript && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-gray-50 rounded-2xl border border-gray-100"
              >
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">I heard</p>
                <p className="text-lg font-medium text-gray-700 italic">"{transcript}"</p>
              </motion.div>
            )}

            {error && (
              <p className="text-red-500 text-sm font-medium mt-4">{error}</p>
            )}
          </div>

          <div className="mt-auto pb-12">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center">
                  <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
                <p className="text-sm font-bold text-blue-600 animate-pulse">Analyzing your voice...</p>
              </div>
            ) : transcript && attemptNumber < 3 ? (
              <button
                onClick={handleTryAgain}
                className="bg-gray-900 text-white px-12 py-5 rounded-2xl font-black text-xl shadow-xl flex items-center gap-3 transition-all active:scale-95"
              >
                <RefreshCw size={24} />
                Next Attempt
              </button>
            ) : (
              <RecordButton
                isRecording={isRecording}
                onStart={start}
                onStop={stop}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
