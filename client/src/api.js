import useAppStore from './store';

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
    throw new Error(errorData.error || errorData.message || 'API request failed');
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
  getPhrases: async (userId) => {
    const data = await apiRequest(
      `/api/phrases?userId=${encodeURIComponent(userId)}`,
    );
    return data.words ?? [];
  },
  getStats: (userId) => apiRequest(`/api/stats/${userId}`),
};

export const practiceApi = {
  getTTS: (text, speed = 1.0) =>
    apiRequest('/api/tts', {
      method: 'POST',
      body: JSON.stringify({ text, speed }),
    }),

  submitAttempt: async (audioBlob, phrase, attemptNumber) => {
    const { token, userId } = useAppStore.getState();
    const form = new FormData();
    form.append('audio', audioBlob, 'recording.webm');
    form.append('phraseId', phrase.id);
    form.append('userId', userId);
    form.append('attemptNumber', String(attemptNumber));
    if (String(phrase.id).startsWith('custom-')) {
      form.append('phraseWord', phrase.word);
    }

    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch('/api/attempt', {
      method: 'POST',
      body: form,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }
    return data;
  },

  saveSession: (sessionData) => apiRequest('/api/session', {
    method: 'POST',
    body: JSON.stringify(sessionData),
  }),
};
