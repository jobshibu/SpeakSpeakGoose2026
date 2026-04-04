import { useCallback, useRef } from 'react';

export const useAudio = () => {
  const audioContext = useRef(null);

  const playBase64 = useCallback(async (base64String, mimeType = 'audio/mpeg') => {
    try {
      if (mimeType === 'audio/mpeg' || mimeType === 'audio/mp3') {
        const url = `data:${mimeType};base64,${base64String}`;
        const audio = new Audio(url);
        await new Promise((resolve, reject) => {
          audio.onended = resolve;
          audio.onerror = (e) => {
            console.error('Audio playback error:', e);
            reject(new Error('Audio playback failed'));
          };
          audio.play().catch((err) => {
            console.error('Audio play promise rejected:', err);
            reject(err);
          });
        });
        return;
      }

      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (audioContext.current.state === 'suspended') {
        await audioContext.current.resume();
      }

      const binaryString = window.atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const pcmData = new Int16Array(bytes.buffer);
      const audioBuffer = audioContext.current.createBuffer(1, pcmData.length, 24000);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768.0;
      }

      const source = audioContext.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.current.destination);
      source.start(0);
    } catch (err) {
      console.error('Error playing audio:', err);
    }
  }, []);

  return { playBase64 };
};
