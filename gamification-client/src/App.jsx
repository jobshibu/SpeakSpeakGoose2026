import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen.jsx';
import { StatsBar }    from './components/StatsBar.jsx';
import { NestView }    from './components/NestView.jsx';
import { PhraseCard }  from './components/PhraseCard.jsx';
import { FeedbackCard } from './components/FeedbackCard.jsx';
import { useGame }     from './hooks/useGame.js';

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  bg: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #87CEEB 0%, #b8e4c9 55%, #7CB87C 100%)',
    padding: '0 0 32px',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px 8px',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: '#fff',
    textShadow: '0 1px 4px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  logoutBtn: {
    fontSize: '0.78rem',
    color: 'rgba(255,255,255,0.85)',
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    padding: '5px 12px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 600,
  },
  scroll: {
    maxWidth: '430px',
    margin: '0 auto',
    padding: '0 14px',
  },
  nestCard: {
    background: 'rgba(255,253,245,0.88)',
    backdropFilter: 'blur(8px)',
    borderRadius: '24px',
    padding: '8px 16px 16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    marginBottom: '12px',
    border: '1.5px solid rgba(255,255,255,0.6)',
  },
  nestTitle: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#8B7355',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    paddingTop: '8px',
    marginBottom: '-4px',
  },
  nextDayBtn: (practiced) => ({
    width: '100%',
    padding: '15px',
    borderRadius: '18px',
    border: 'none',
    fontWeight: 800,
    fontSize: '1rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    background: practiced
      ? 'linear-gradient(135deg, #FF8C42, #e67e22)'
      : 'linear-gradient(135deg, #bdc3c7, #95a5a6)',
    color: '#fff',
    boxShadow: practiced ? '0 6px 20px rgba(255,140,66,0.35)' : 'none',
    transition: 'transform 0.15s',
    marginTop: '4px',
  }),
  floatingEXP: {
    position: 'fixed',
    top: '30%',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '2rem',
    fontWeight: 900,
    color: '#9B7ADE',
    textShadow: '0 2px 8px rgba(0,0,0,0.15)',
    animation: 'floatUp 1.4s ease forwards',
    pointerEvents: 'none',
    zIndex: 100,
  },
  wolfWarning: {
    background: 'rgba(232,93,93,0.12)',
    border: '1.5px solid rgba(232,93,93,0.3)',
    borderRadius: '14px',
    padding: '10px 14px',
    fontSize: '0.82rem',
    color: '#c0392b',
    marginBottom: '10px',
    textAlign: 'center',
    fontWeight: 600,
  },
  errorBox: {
    background: '#ffeaea',
    border: '1px solid #f5c6c6',
    borderRadius: '12px',
    padding: '10px 14px',
    color: '#c0392b',
    fontSize: '0.85rem',
    marginBottom: '10px',
  },
};

// ── Auth persistence ──────────────────────────────────────────────────────────
function loadStoredAuth() {
  try {
    const raw = sessionStorage.getItem('goose_auth');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveAuth(auth) {
  sessionStorage.setItem('goose_auth', JSON.stringify(auth));
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(() => loadStoredAuth());

  function handleAuth(data) {
    saveAuth(data);
    setAuth(data);
  }

  function handleLogout() {
    sessionStorage.removeItem('goose_auth');
    setAuth(null);
  }

  if (!auth?.token) {
    return <LoginScreen onAuth={handleAuth} />;
  }

  return <GameScreen auth={auth} onLogout={handleLogout} />;
}

// ── Game screen ───────────────────────────────────────────────────────────────
function GameScreen({ auth, onLogout }) {
  const game = useGame(auth);

  const {
    gameState, phrase, feedback, attemptNum, animationState,
    floatingEXP, loading, error,
    submitPractice, advanceDay, loadPhrase, clearFeedback, setError,
  } = game;

  const practicedToday = gameState
    ? gameState.lastPracticeDay >= gameState.day
    : false;

  const missedYesterday = gameState
    ? gameState.lastPracticeDay < gameState.day - 1 && gameState.day > 1
    : false;

  return (
    <div style={s.bg}>
      {/* Floating EXP popup */}
      {floatingEXP && (
        <div key={floatingEXP.key} style={s.floatingEXP}>
          ✨ +{floatingEXP.amount}
        </div>
      )}

      {/* Top bar */}
      <div style={s.topBar}>
        <div style={s.title}>🪿 Goose Nest</div>
        <button style={s.logoutBtn} onClick={onLogout}>Logout</button>
      </div>

      <div style={s.scroll}>
        {/* Stats */}
        <StatsBar gameState={gameState} />

        {/* Wolf warning */}
        {missedYesterday && animationState !== 'wolf-attacks' && (
          <div style={s.wolfWarning}>
            ⚠️ You missed yesterday! Click Next Day — the wolf is watching.
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={s.errorBox}>
            {error}
            <button
              onClick={() => setError('')}
              style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b' }}
            >✕</button>
          </div>
        )}

        {/* Nest */}
        <div style={s.nestCard}>
          <div style={s.nestTitle}>🌿 Your Nest</div>
          <NestView gameState={gameState} animationState={animationState} />
        </div>

        {/* Phrase / Feedback */}
        {!feedback ? (
          <PhraseCard
            phraseData={phrase}
            onSubmit={submitPractice}
            loading={loading}
            attemptNum={attemptNum}
          />
        ) : (
          <FeedbackCard
            feedback={feedback}
            onNextPhrase={loadPhrase}
            onContinue={clearFeedback}
          />
        )}

        {/* Next Day button */}
        <button
          style={s.nextDayBtn(practicedToday)}
          onClick={advanceDay}
          disabled={loading}
        >
          {loading ? '⏳ …' : practicedToday ? '🌙 End Day & Sleep →' : '☀️ Skip to Next Day'}
        </button>

        {/* Lifecycle legend */}
        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', marginTop: '16px', fontWeight: 600 }}>
          🥚 Egg (days 1–5) → 🐣 Chick (days 6–10) → 🪿 Goose (days 11–12) → flies away ✈️
        </div>
      </div>
    </div>
  );
}
