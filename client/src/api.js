import { GoogleGenAI, Modality } from "@google/genai";
import useAppStore from './store';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const apiRequest = async (endpoint, options = {}) => {
  const { token } = useAppStore.getState();
  
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }

  return response.json();
};

export const authApi = {
  login: (credentials) => apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (credentials) => apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
};

export const phraseApi = {
  getPhrases: (level, userId) => apiRequest(`/api/phrases?level=${level}&userId=${userId}`),
  getStats: (userId) => apiRequest(`/api/stats/${userId}`),
};

export const practiceApi = {
  getTTS: async (text, speed = 1.0) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly at ${speed}x speed: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return { audio: response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data };
  },
  
  submitAttempt: async (audioBlob, phrase, attemptNumber) => {
    const reader = new FileReader();
    const base64Promise = new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(audioBlob);
    });
    const audioBase64 = await base64Promise;

    const prompt = `
      Analyze this audio of a user saying "${phrase.word}".
      This is attempt #${attemptNumber}.
      Return JSON with:
      - transcript: what you heard
      - score: 0.0 to 1.0
      ${attemptNumber < 3 ? '- hint: a short tip for the next attempt' : `
      - phonemeBreakdown: array of { phoneme, status: "correct"|"missed", note }
      - advice: a paragraph of feedback
      - drill: a short practice phrase
      `}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { parts: [{ text: prompt }] },
        { parts: [{ inlineData: { data: audioBase64, mimeType: 'audio/webm' } }] }
      ],
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text);
  },
  
  saveSession: (sessionData) => apiRequest('/api/session', {
    method: 'POST',
    body: JSON.stringify(sessionData),
  }),
};
