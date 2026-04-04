import { useEffect, useState } from 'react';

const CREATURE_EMOJI = { egg: '🥚', chick: '🐣', goose: '🪿' };

function creatureAnim(state) {
  if (state === 'egg')   return 'animate-egg-glow';
  if (state === 'chick') return 'animate-bounce';
  if (state === 'goose') return 'animate-waddle';
  return '';
}

const s = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 0 8px',
    position: 'relative',
    minHeight: '130px',
  },
  creaturesRow: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '6px',
    minHeight: '52px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  creature: {
    fontSize: '2.4rem',
    cursor: 'default',
    userSelect: 'none',
    transition: 'transform 0.3s',
    display: 'inline-block',
  },
  nestBase: {
    fontSize: '3rem',
    lineHeight: 1,
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
  },
  emptyMsg: {
    fontSize: '0.8rem',
    color: '#8B7355',
    marginBottom: '8px',
    fontStyle: 'italic',
  },
  wolfOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    background: 'rgba(232,93,93,0.18)',
    borderRadius: '16px',
    backdropFilter: 'blur(2px)',
    zIndex: 10,
  },
  wolfEmoji: {
    fontSize: '3.5rem',
    animation: 'wolfSlide 2.5s ease forwards',
  },
  wolfMsg: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#c0392b',
    marginTop: '6px',
    background: 'rgba(255,255,255,0.9)',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  eggBanner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    textAlign: 'center',
    animation: 'popIn 0.4s ease',
    zIndex: 10,
  },
  eggBannerInner: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    color: '#fff',
    fontWeight: 800,
    fontSize: '0.85rem',
    padding: '6px 16px',
    borderRadius: '20px',
    boxShadow: '0 4px 12px rgba(255,165,0,0.4)',
  },
};

export function NestView({ gameState, animationState }) {
  const [flyingIds, setFlyingIds] = useState(new Set());

  const creatures = gameState?.creatures || [];
  const eggCount  = creatures.filter(c => c.state === 'egg').length;

  useEffect(() => {
    if (animationState === 'goose-flies') {
      const geese = creatures.filter(c => c.state === 'goose').map(c => c.id);
      setFlyingIds(new Set(geese));
      setTimeout(() => setFlyingIds(new Set()), 2000);
    }
  }, [animationState]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={s.wrap}>
      {/* Egg earned banner */}
      {animationState === 'egg-earned' && (
        <div style={s.eggBanner}>
          <div style={s.eggBannerInner}>🥚 You earned an egg!</div>
        </div>
      )}

      {/* Creatures */}
      <div style={s.creaturesRow}>
        {creatures.length === 0 ? (
          <span style={s.emptyMsg}>Practice to earn eggs for your nest!</span>
        ) : (
          creatures.map(c => (
            <span
              key={c.id}
              style={{
                ...s.creature,
                animation: flyingIds.has(c.id) ? 'flyAway 1s ease forwards' : undefined,
              }}
              className={flyingIds.has(c.id) ? '' : creatureAnim(c.state)}
              title={c.state}
            >
              {CREATURE_EMOJI[c.state] || '🥚'}
            </span>
          ))
        )}
      </div>

      {/* Nest base */}
      <span style={s.nestBase}>🪺</span>

      {/* Wolf overlay */}
      {animationState === 'wolf-attacks' && (
        <div style={s.wolfOverlay}>
          <span style={s.wolfEmoji}>🐺</span>
          <span style={s.wolfMsg}>
            {eggCount > 0 ? '🐺 The wolf stole an egg!' : '🐺 The wolf came! No eggs to steal.'}
          </span>
        </div>
      )}
    </div>
  );
}
