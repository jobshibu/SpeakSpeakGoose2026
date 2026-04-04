const s = {
  bar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    background: 'rgba(255,253,245,0.92)',
    backdropFilter: 'blur(8px)',
    borderRadius: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    margin: '0 0 12px',
    flexWrap: 'wrap',
    gap: '6px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '52px',
  },
  icon: { fontSize: '1.1rem', lineHeight: 1 },
  val: { fontSize: '1rem', fontWeight: 800, color: '#3D2E1A', lineHeight: 1.2 },
  lbl: { fontSize: '0.6rem', color: '#8B7355', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' },
  divider: { width: '1px', height: '32px', background: 'rgba(139,115,85,0.2)' },
};

function Stat({ icon, value, label, animClass }) {
  return (
    <div style={s.stat}>
      <span style={s.icon} className={animClass}>{icon}</span>
      <span style={s.val}>{value}</span>
      <span style={s.lbl}>{label}</span>
    </div>
  );
}

export function StatsBar({ gameState }) {
  if (!gameState) return null;
  const { day, exp, streak, multiplier } = gameState;

  const streakAnim = streak >= 3 ? 'animate-bounce' : '';

  return (
    <div style={s.bar}>
      <Stat icon="📅" value={`Day ${day}`}             label="day"        />
      <div style={s.divider} />
      <Stat icon="🔥" value={streak}                   label="streak"  animClass={streakAnim} />
      <div style={s.divider} />
      <Stat icon="⚡" value={`${multiplier}×`}         label="mult"       />
      <div style={s.divider} />
      <Stat icon="✨" value={exp.toLocaleString()}      label="exp"        />
    </div>
  );
}
