import { useState, useRef, useCallback } from 'react';

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob,   setAudioBlob]   = useState(null);
  const [error,       setError]       = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const streamRef        = useRef(null);

  const start = useCallback(async () => {
    setAudioBlob(null);
    setError('');
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : MediaRecorder.isTypeSupported('audio/webm')
          ? { mimeType: 'audio/webm' }
          : {};

      const mr = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const mimeType = mr.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
      };

      mr.start();
      setIsRecording(true);
    } catch (err) {
      setError(`Microphone error: ${err.message}`);
      setIsRecording(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setAudioBlob(null);
    setError('');
    chunksRef.current = [];
  }, [stop]);

  return { isRecording, audioBlob, error, start, stop, reset };
}
