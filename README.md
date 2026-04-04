# ESL Pronunciation Coach

Full-stack web app for ESL learners to practise pronunciation with AI-powered feedback.

**Stack:** Node.js + Express · PostgreSQL · Anthropic Claude (claude-sonnet-4-6) · Google Gemini 1.5 Flash (STT) · ElevenLabs (TTS) · JWT auth · Vanilla JS frontend

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally (or a remote `DATABASE_URL`)
- API keys: Anthropic, Google Gemini, ElevenLabs

---

## Environment Setup

```bash
cd esl-pronunciation-coach
cp .env.example .env
```

Edit `.env` and fill in:

```
DATABASE_URL=postgresql://localhost:5432/esl_coach
ANTHROPIC_API_KEY=sk-ant-…
GEMINI_API_KEY=AIza…
ELEVENLABS_API_KEY=sk_…
ELEVENLABS_VOICE_ID=          # optional — defaults to "Sarah" voice
JWT_SECRET=some-long-random-string
PORT=3001
```

---

## Database Setup

```bash
# Create the database
createdb esl_coach

# Apply the schema
psql esl_coach < server/db/schema.sql

# Seed the initial word bank (17 words across easy / medium / hard)
npm run seed
```

---

## Install Dependencies

```bash
npm install
```

---

## Run the App

**Development (auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Open **http://localhost:3001** in your browser.

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register; returns JWT |
| POST | `/api/auth/login` | — | Login; returns JWT |
| GET | `/api/phrases?level=&userId=` | JWT | Fetch 6 words targeted to user weaknesses |
| POST | `/api/tts` | JWT | `{ text, speed }` → base64 MP3 |
| POST | `/api/attempt` | JWT | FormData `audio + phraseId + userId + attemptNumber` → hint or full feedback |
| POST | `/api/generate-words` | JWT | `{ userId, level }` → AI-generated words inserted into DB |
| POST | `/api/session` | JWT | `{ userId, wordId, finalScore, attempts }` → XP / level / badges |
| GET | `/api/stats/:userId` | JWT | User progress stats |
| GET | `/api/health` | — | Server health check |

All protected routes require `Authorization: Bearer <token>` header.

---

## Project Structure

```
esl-pronunciation-coach/
├── client/
│   └── index.html            # Single-file testing UI (all HTML/CSS/JS inline)
├── server/
│   ├── routes/
│   │   ├── auth.js           # Register / login
│   │   ├── phrases.js        # Word bank with weak-phoneme targeting
│   │   ├── tts.js            # ElevenLabs text-to-speech
│   │   ├── attempt.js        # Gemini STT → Claude analysis → DB persist
│   │   ├── generate.js       # AI word generation via Claude
│   │   ├── session.js        # Gamification (XP, streaks, badges)
│   │   └── stats.js          # User progress stats
│   ├── services/
│   │   ├── gemini.js         # Audio transcription
│   │   ├── claude.js         # analyseAttempt / getFullFeedback / generateWords
│   │   ├── elevenlabs.js     # TTS synthesis
│   │   ├── phonemes.js       # Per-phoneme score tracking + mastery
│   │   └── gamification.js   # XP, levels, streaks, badges
│   ├── db/
│   │   ├── index.js          # pg Pool
│   │   ├── schema.sql        # All tables
│   │   └── seed.js           # 17 seed words (easy/medium/hard)
│   ├── middleware/
│   │   └── auth.js           # JWT verification
│   └── index.js              # Express app entry point
├── .env.example
├── package.json
└── README.md
```

---

## Gamification

| Rule | Detail |
|------|--------|
| XP per attempt | 10 (base) + score×20 + streak×2 + 50 per mastered phoneme |
| Level thresholds | 0 / 500 / 1200 / 2200 / 3500 / 5000 XP |
| Streak | +1 if session on consecutive day; resets if gap > 1 day |
| Mastery | avg(last 5 scores) ≥ 0.85 AND ≥ 5 attempts |

Badges: `first_word`, `streak_3`, `streak_7`, `score_80`, `score_95`, `mastery_first`, `mastery_5`, `level_3`
