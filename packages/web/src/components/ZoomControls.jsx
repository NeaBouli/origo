export default function ZoomControls({ zoom, setZoom }) {
  const levels = ['macro', 'meso', 'micro'];
  const labels = { macro: '🌌 UNIVERSE', meso: '🌍 PLANET', micro: '🔬 CELLS' };

  return (
    <div style={{
      position: 'absolute', top: 24, right: 24,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      {levels.map(level => (
        <button
          key={level}
          onClick={() => setZoom(level)}
          style={{
            background:    zoom === level ? '#C9A84C22' : '#0A0F1Ecc',
            border:        `1px solid ${zoom === level ? '#C9A84C' : '#1E2E48'}`,
            color:         zoom === level ? '#C9A84C' : '#3A5A6A',
            padding:       '6px 12px',
            fontFamily:    'monospace',
            fontSize:      10,
            letterSpacing: 1,
            cursor:        'pointer',
            backdropFilter:'blur(8px)',
            transition:    'all 0.2s',
          }}
        >
          {labels[level]}
        </button>
      ))}
    </div>
  );
}
