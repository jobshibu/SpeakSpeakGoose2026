import { useRecording } from '../hooks/useRecording.js';

const DIFF_COLOR = { easy: '#4CAF50', medium: '#FF8C42', hard: '#E85D5D' };

const s = {
  card: {
    background: '#FFFDF5',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    border: '1.5px solid rgba(139,115,85,0.15)',
    marginBottom: '12px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  label: { fontSize: '0.72rem', fontWeight: 700, color: '#8B7355', textTransform: 'uppercase', letterSpacing: '0.05em' },
  diffBadge: (diff) => ({
    fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px',
    borderRadius: '20px', color: '#fff',
    background: DIFF_COLOR[diff] || '#999',
  }),
  stretchBadge: {
    fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px',
    borderRadius: '20px', color: '#fff',
    background: 'linear-gradient(135deg, #9B7ADE, #FF8C42)',
    marginLeft: '6px',
  },
  word: {
    fontSize: '2rem', fontWeight: 800, color: '#3D2E1A',
    letterSpacing: '-0.02em', marginBottom: '4px', lineHeight: 1.2,
  },
  ipa: { fontSize: '1rem', color: '#9B7ADE', fontWeight: 500, marginBottom: '12px' },
  controls: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  recordBtn: (isRec) => ({
    flex: 1, minWidth: '120px', padding: '13px 20px',
    borderRadius: '14px', border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: '0.95rem', fontFamily: 'inherit',
    background: isRec
      ? 'linear-gradient(135deg, #E85D5D, #c0392b)'
      : 'linear-gradient(135deg, #4CAF50, #388E3C)',
    color: '#fff',
    transition: 'transform 0.15s',
    boxShadow: isRec ? '0 0 0 4px rgba(232,93,93,0.25)' : 'none',
    animation: isRec ? 'pulseStreak 0.8s ease infinite' : 'none',
  }),
  submitBtn: (disabled) => ({
    flex: 1, minWidth: '120px', padding: '13px 20px',
    borderRadius: '14px', border: 'none',
    fontWeight: 700, fontSize: '0.95rem', fontFamily: 'inherit',
    background: disabled ? '#e0d8cc' : 'linear-gradient(135deg, #9B7ADE, #7B5ABE)',
    color: disabled ? '#aaa' : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'transform 0.15s',
  }),
  readyBox: {
    marginTop: '12px', padding: '10px 14px',
    background: 'rgba(76,175,80,0.08)',
    border: '1.5px solid rgba(76,175,80,0.3)',
    borderRadius: '12px', fontSize: '0.88rem', color: '#2e7d32',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  status: { fontSize: '0.82rem', color: '#8B7355', marginTop: '8px', minHeight: '20px' },
  err: {
    fontSize: '0.82rem', color: '#E85D5D', marginTop: '6px',
    background: 'rgba(232,93,93,0.08)', borderRadius: '8px', padding: '6px 10px',
  },
};

export function PhraseCard({ phraseData, onSubmit, loading, attemptNum = 1 }) {
  const rec = useRecording();

  if (!phraseData) return (
    <div style={s.card}>
      <div style={{ color: '#8B7355', textAlign: 'center', padding: '20px' }}>Loading phrase…</div>
    </div>
  );

  const { phrase, difficulty, isStretchChallenge, isFocusWord, focusPhonemes } = phraseData;
  const canSubmit = !!rec.audioBlob && !loading && !rec.isRecording;

  function handleRecord() {
    if (rec.isRecording) {
      rec.stop();
    } else {
      rec.reset();
      setTimeout(() => rec.start(), 80);
    }
  }

  function handleSubmit() {
    if (!rec.audioBlob) return;
    onSubmit(rec.audioBlob);
    rec.reset();
  }

  return (
    <div style={s.card} className="animate-fadein">
      <div style={s.header}>
        <span style={s.label}>📝 Practice this</span>
        <div>
          <span style={s.diffBadge(difficulty)}>{difficulty}</span>
          {isStretchChallenge && <span style={s.stretchBadge}>⭐ Stretch!</span>}
          {isFocusWord && <span style={{ ...s.stretchBadge, background: 'linear-gradient(135deg,#E85D5D,#9B7ADE)' }}>🎯 Focus</span>}
        </div>
      </div>

      <div style={s.word}>{phrase.word}</div>
      <div style={s.ipa}>{phrase.ipa}</div>

      {isFocusWord && focusPhonemes?.length > 0 && (
        <div style={{
          display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px',
        }}>
          {focusPhonemes.map(p => (
            <span key={p} style={{
              fontSize: '0.75rem', fontWeight: 700,
              padding: '2px 10px', borderRadius: '20px',
              background: 'rgba(232,93,93,0.1)', color: '#E85D5D',
              border: '1px solid rgba(232,93,93,0.3)',
            }}>
              {p}
            </span>
          ))}
          <span style={{ fontSize: '0.75rem', color: '#8B7355', alignSelf: 'center' }}>
            — sounds to focus on
          </span>
        </div>
      )}

      {/* Attempt progress dots */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{
            flex: 1, height: '6px', borderRadius: '4px',
            background: n < attemptNum ? '#9B7ADE' : n === attemptNum ? '#FFD700' : '#e0d8cc',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <div style={s.controls}>
        <button
          style={s.recordBtn(rec.isRecording)}
          onClick={handleRecord}
          disabled={loading}
        >
          {rec.isRecording ? '⏹ Stop' : rec.audioBlob ? '🔄 Re-record' : '🎙️ Record'}
        </button>
        <button
          style={s.submitBtn(!canSubmit)}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? '⏳ Analysing…' : '📤 Submit'}
        </button>
      </div>

      {rec.isRecording && (
        <div style={s.status}>🔴 Recording — speak the phrase, then click Stop</div>
      )}

      {rec.audioBlob && !rec.isRecording && (
        <div style={s.readyBox}>
          ✅ Audio captured — click Submit or Re-record
        </div>
      )}

      {!rec.isRecording && !rec.audioBlob && !rec.error && (
        <div style={s.status}>Click Record, say the phrase, then click Stop</div>
      )}

      {rec.error && <div style={s.err}>{rec.error}</div>}
    </div>
  );
}
