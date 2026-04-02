import { useGame } from '../App.jsx';

export default function FactionHUD() {
  const { myFactionId, factions, ghifrBalance, generation, connected } = useGame();
  const me = factions[myFactionId];
  if (!me) return null;

  const cells = me.cells || 0;
  const total = Object.values(factions).reduce((a, f) => a + (f.cells || 0), 0) || 1;
  const pct   = ((cells / total) * 100).toFixed(2);

  return (
    <div style={{
      position: 'absolute', bottom: 24, left: 24,
      background: '#0A0F1Ecc', border: '1px solid #C9A84C33',
      padding: '14px 18px', minWidth: 200,
      fontFamily: 'monospace', backdropFilter: 'blur(8px)',
    }}>
      {/* Connection dot */}
      <div style={{ fontSize: 9, color: connected ? '#00ff88' : '#ff4444', letterSpacing: 2, marginBottom: 10 }}>
        {connected ? '● LIVE' : '○ CONNECTING...'}
      </div>

      {/* Faction name + color */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: me.color, boxShadow: `0 0 8px ${me.color}` }} />
        <span style={{ fontSize: 12, color: '#D8E4F8', letterSpacing: 1 }}>{me.name}</span>
        <span style={{ fontSize: 9, color: '#C9A84C88', marginLeft: 'auto' }}>L{me.layer || 0}</span>
      </div>

      {/* Stats */}
      {[
        ['CELLS',      cells.toLocaleString()],
        ['TERRITORY',  `${pct}%`],
        ['GHIFR',      ghifrBalance.toFixed(2)],
      ].map(([label, val]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 9, color: '#3A5A6A', letterSpacing: 1 }}>{label}</span>
          <span style={{ fontSize: 11, color: '#C9A84C' }}>{val}</span>
        </div>
      ))}

      {/* Territory bar */}
      <div style={{ marginTop: 8, height: 3, background: '#0d1520', borderRadius: 2 }}>
        <div style={{ width: `${Math.min(100, parseFloat(pct))}%`, height: '100%', background: me.color, borderRadius: 2, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}
