const s = {
  card: {
    background: '#FFFDF5',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    border: '1.5px solid rgba(139,115,85,0.15)',
    marginBottom: '12px',
  },
  header: { fontSize: '0.72rem', fontWeight: 700, color: '#8B7355', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' },
  scoreRow: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' },
  scoreCircle: (pct) => ({
    width: '64px', height: '64px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.1rem', fontWeight: 800,
    background: pct >= 85 ? 'linear-gradient(135deg,#4CAF50,#388E3C)'
               : pct >= 60 ? 'linear-gradient(135deg,#FF8C42,#e67e22)'
               :              'linear-gradient(135deg,#E85D5D,#c0392b)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    animation: 'scoreReveal 0.5s cubic-bezier(.22,.61,.36,1)',
    flexShrink: 0,
  }),
  expPill: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    background: 'linear-gradient(135deg, #9B7ADE, #7B5ABE)',
    color: '#fff', padding: '4px 12px', borderRadius: '20px',
    fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px',
    animation: 'popIn 0.4s ease',
  },
  eggBanner: {
    background: 'linear-gradient(135deg,#FFD700,#FFA500)',
    borderRadius: '14px', padding: '12px 16px', marginBottom: '12px',
    textAlign: 'center', animation: 'popIn 0.4s ease',
  },
  eggTitle: { fontSize: '1.5rem', fontWeight: 800, color: '#fff' },
  eggSub:   { fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', marginTop: '2px' },
  hintBox: {
    background: 'rgba(76,175,80,0.08)',
    border: '1.5px solid rgba(76,175,80,0.25)',
    borderRadius: '12px', padding: '10px 14px', marginBottom: '8px',
    fontSize: '0.88rem', color: '#2e7d32',
  },
  tipsRow: { display: 'flex', gap: '8px', marginTop: '8px' },
  tip: (color) => ({
    flex: 1, padding: '8px 12px', borderRadius: '10px', fontSize: '0.8rem',
    background: `${color}12`, border: `1.5px solid ${color}30`, color: '#3D2E1A',
  }),
  tipLabel: (color) => ({ fontWeight: 700, color, fontSize: '0.72rem', display: 'block', marginBottom: '2px' }),
  transcriptBox: {
    background: 'rgba(139,115,85,0.06)', borderRadius: '10px',
    padding: '8px 12px', fontSize: '0.82rem', color: '#6B5240',
    marginBottom: '10px',
  },
};

function scoreLabel(pct) {
  if (pct >= 86) return '🌟 Excellent!';
  if (pct >= 70) return '👍 Good!';
  if (pct >= 50) return '🙂 Getting there!';
  return '💪 Keep practising!';
}

export function FeedbackCard({ feedback, onNextPhrase, onContinue }) {
  if (!feedback) return null;

  const pct      = Math.round((feedback.score || 0) * 100);
  const isFinal  = feedback.isFinal;
  const full     = feedback.fullFeedback;

  return (
    <div style={s.card} className="animate-fadein">
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px',
      }}>
        <div style={s.header}>
          {isFinal ? '🎯 Final Result' : `🎯 Attempt ${feedback.attemptNum} of 3`}
        </div>
        {!isFinal && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: n <= feedback.attemptNum ? '#9B7ADE' : '#e0d8cc',
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Egg earned (final only) */}
      {isFinal && feedback.eggAwarded && (
        <div style={s.eggBanner}>
          <div style={s.eggTitle}>🥚 You earned an egg!</div>
          <div style={s.eggSub}>
            {feedback.eggType === 'stretch'
              ? 'Amazing stretch challenge performance!'
              : feedback.eggType === 'focus'
              ? 'You conquered a sound you were struggling with!'
              : 'Breakthrough! You conquered that tough phrase!'}
          </div>
        </div>
      )}

      {/* Score + EXP */}
      <div style={s.scoreRow}>
        <div style={s.scoreCircle(pct)}>{pct}%</div>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#3D2E1A', marginBottom: '6px' }}>
            {scoreLabel(pct)}
          </div>
          {isFinal && !feedback.eggAwarded && feedback.expAwarded > 0 && (
            <div style={s.expPill}>✨ +{feedback.expAwarded} EXP</div>
          )}
          {isFinal && feedback.eggAwarded && (
            <div style={{ ...s.expPill, background: 'linear-gradient(135deg,#FFD700,#FFA500)' }}>
              🥚 Egg instead of EXP
            </div>
          )}
        </div>
      </div>

      {/* Transcript */}
      {feedback.transcript && (
        <div style={s.transcriptBox}>You said: <em>"{feedback.transcript}"</em></div>
      )}

      {/* Hint (attempts 1 & 2) */}
      {feedback.hint && (
        <div style={s.hintBox}>💬 {feedback.hint}</div>
      )}

      {/* Tongue + Lips */}
      {(feedback.tongue || feedback.lips) && (
        <div style={s.tipsRow}>
          {feedback.tongue && (
            <div style={s.tip('#9B7ADE')}>
              <span style={s.tipLabel('#9B7ADE')}>👅 Tongue</span>
              {feedback.tongue}
            </div>
          )}
          {feedback.lips && (
            <div style={s.tip('#FF8C42')}>
              <span style={s.tipLabel('#FF8C42')}>👄 Lips</span>
              {feedback.lips}
            </div>
          )}
        </div>
      )}

      {/* Full feedback breakdown (attempt 3) */}
      {isFinal && full && (
        <>
          {full.advice && (
            <div style={{ ...s.hintBox, marginTop: '10px', color: '#1a5276' }}>
              📖 {full.advice}
            </div>
          )}
          {full.drill && (
            <div style={{ ...s.hintBox, background: 'rgba(255,140,66,0.08)', borderColor: 'rgba(255,140,66,0.25)', color: '#7d4e1a', marginTop: '8px' }}>
              🏋️ Drill: {full.drill}
            </div>
          )}
          {full.phonemeBreakdown?.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              {full.phonemeBreakdown.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 10px', borderRadius: '8px',
                  background: p.status === 'hit' ? 'rgba(76,175,80,0.08)' : 'rgba(232,93,93,0.08)',
                  marginBottom: '4px', fontSize: '0.82rem',
                }}>
                  <span style={{ fontWeight: 800 }}>{p.phoneme}</span>
                  <span style={{ color: p.status === 'hit' ? '#4CAF50' : '#E85D5D' }}>
                    {p.status === 'hit' ? '✓' : p.status === 'partial' ? '~' : '✗'}
                  </span>
                  <span style={{ color: '#6B5240' }}>{p.note}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Action button */}
      {isFinal ? (
        <button onClick={onNextPhrase} style={{
          marginTop: '14px', width: '100%', padding: '12px',
          borderRadius: '14px', border: 'none',
          background: 'linear-gradient(135deg,#4CAF50,#388E3C)',
          color: '#fff', fontWeight: 700, fontSize: '0.95rem',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Next Phrase →
        </button>
      ) : (
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {pct >= 90 && (
            <button onClick={onNextPhrase} style={{
              width: '100%', padding: '12px',
              borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg,#4CAF50,#388E3C)',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              🌟 Next Word →
            </button>
          )}
          <button onClick={onContinue} style={{
            width: '100%', padding: '12px',
            borderRadius: '14px', border: 'none',
            background: pct >= 90
              ? 'rgba(139,115,85,0.12)'
              : 'linear-gradient(135deg,#9B7ADE,#7B5ABE)',
            color: pct >= 90 ? '#8B7355' : '#fff',
            fontWeight: 700, fontSize: '0.95rem',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {pct >= 90 ? `Keep practicing (${3 - feedback.attemptNum} left)` : `Try Again (${3 - feedback.attemptNum} left) →`}
          </button>
        </div>
      )}
    </div>
  );
}
