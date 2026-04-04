import { useState } from 'react';
import { gameApi } from '../api/gameApi.js';

const s = {
  wrap: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #87CEEB 0%, #c8e6c9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    background: '#FFFDF5',
    borderRadius: '28px',
    padding: '40px 32px',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
    textAlign: 'center',
  },
  logo: { fontSize: '64px', marginBottom: '8px' },
  title: { fontSize: '1.6rem', fontWeight: 800, color: '#3D2E1A', marginBottom: '4px' },
  sub: { fontSize: '0.9rem', color: '#8B7355', marginBottom: '28px' },
  tabs: { display: 'flex', marginBottom: '24px', gap: '8px' },
  tab: (active) => ({
    flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: '0.9rem',
    background: active ? '#9B7ADE' : '#f0ebe0',
    color:      active ? '#fff'    : '#8B7355',
    transition: 'all 0.2s',
  }),
  field: {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    border: '1.5px solid #e0d8cc', background: '#FFFDF5',
    fontSize: '1rem', color: '#3D2E1A', marginBottom: '12px',
    outline: 'none', fontFamily: 'inherit',
  },
  btn: {
    width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
    background: 'linear-gradient(135deg, #9B7ADE, #7B5ABE)',
    color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
    marginTop: '4px', transition: 'transform 0.15s, opacity 0.15s',
  },
  err: {
    background: '#ffeaea', border: '1px solid #f5c6c6', borderRadius: '10px',
    padding: '10px 14px', color: '#c0392b', fontSize: '0.85rem', marginTop: '12px',
  },
};

export function LoginScreen({ onAuth }) {
  const [mode,     setMode]     = useState('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const fn = mode === 'login' ? gameApi.login : gameApi.register;
      const data = await fn(email, password);
      onAuth({ token: data.token, userId: data.userId, email: data.email });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.wrap}>
      <div style={s.card} className="animate-fadein">
        <div style={s.logo}>🪿</div>
        <div style={s.title}>Goose Nest</div>
        <div style={s.sub}>Pronunciation Adventure</div>

        <div style={s.tabs}>
          <button style={s.tab(mode === 'login')}    onClick={() => { setMode('login');    setError(''); }}>Login</button>
          <button style={s.tab(mode === 'register')} onClick={() => { setMode('register'); setError(''); }}>Register</button>
        </div>

        <form onSubmit={submit}>
          <input
            style={s.field}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            style={s.field}
            type="password"
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <button
            style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
            type="submit"
            disabled={loading}
          >
            {loading ? '…' : mode === 'login' ? 'Enter Nest 🪿' : 'Create Nest 🥚'}
          </button>
        </form>

        {error && <div style={s.err}>{error}</div>}
      </div>
    </div>
  );
}
