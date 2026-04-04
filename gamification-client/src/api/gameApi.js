const BASE = '/api';

async function req(url, opts = {}, token) {
  const headers = {
    ...(opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, { ...opts, headers: { ...headers, ...(opts.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const gameApi = {
  login:       (email, password) =>
    req(`${BASE}/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) }),

  register:    (email, password) =>
    req(`${BASE}/auth/register`, { method: 'POST', body: JSON.stringify({ email, password }) }),

  getState:    (userId, token) =>
    req(`${BASE}/game/state/${userId}`, {}, token),

  getPhrase:   (userId, token) =>
    req(`${BASE}/game/phrase/${userId}`, {}, token),

  practice:    (body, token) =>
    req(`${BASE}/game/practice`, { method: 'POST', body: JSON.stringify(body) }, token),

  advanceDay:  (userId, token) =>
    req(`${BASE}/game/advance-day`, { method: 'POST', body: JSON.stringify({ userId }) }, token),

  submitAttempt: (data, token) => {
    const form = new FormData();
    form.append('phraseId',      data.phraseId);
    form.append('userId',        data.userId);
    form.append('attemptNumber', String(data.attemptNum || 1));
    // Send audio blob to Gemini for transcription (preserves mispronunciations)
    if (data.audioBlob) {
      form.append('audio', data.audioBlob, 'recording.webm');
    }
    return req(`${BASE}/attempt`, { method: 'POST', body: form }, token);
  },
};
