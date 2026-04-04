import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(express.json());

// Mock Database
const users = {
  'preview-user': {
    level: 1,
    xp: 120,
    xpToNext: 500,
    streak: 3,
    totalPhrases: 12,
    avgScore: 0.82,
    badges: ['first_word', 'streak_3'],
    weakPhonemes: [{ phoneme: 'θ', recent_pct: 0.45 }],
    masteredPhonemes: ['s', 't', 'p']
  }
};

const phrases = [
  {
    id: '1',
    word: 'Think',
    ipa: 'θɪŋk',
    level: 'easy',
    targets: ['θ'],
    phonemic: { tag: 'Voiceless TH', detail: 'Place your tongue between your teeth and blow air.' }
  },
  {
    id: '2',
    word: 'Weather',
    ipa: 'ˈwɛðər',
    level: 'easy',
    targets: ['ð'],
    phonemic: { tag: 'Voiced TH', detail: 'Vibrate your vocal cords while blowing air through teeth.' }
  },
  {
    id: '3',
    word: 'Specific',
    ipa: 'spəˈsɪfɪk',
    level: 'medium',
    targets: ['s', 'p'],
    phonemic: { tag: 'Sibilant S', detail: 'Keep the air flow steady and sharp.' }
  }
];

// Auth Endpoints
app.post('/api/auth/register', (req, res) => {
  res.json({ token: 'mock-jwt-token', userId: 'new-user' });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ token: 'mock-jwt-token', userId: 'preview-user' });
});

// Phrase Endpoints
app.get('/api/phrases', (req, res) => {
  const { level } = req.query;
  const filtered = phrases.filter(p => p.level === level);
  res.json(filtered.length > 0 ? filtered : phrases);
});

// Session & Stats
app.post('/api/session', (req, res) => {
  res.json({
    xp: 25,
    level: 2,
    newLevel: false,
    badgesEarned: [],
    masteredPhonemes: ['th']
  });
});

app.get('/api/stats/:userId', (req, res) => {
  const stats = users[req.params.userId] || users['preview-user'];
  res.json(stats);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
