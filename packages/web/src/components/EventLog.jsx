export default function EventLog({ events }) {
  if (!events?.length) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 24, right: 24,
      background: '#0A0F1Ecc', border: '1px solid #1E2E48',
      padding: '10px 14px', maxWidth: 260, maxHeight: 160,
      overflowY: 'auto', fontFamily: 'monospace',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ fontSize: 8, color: '#1E3A4A', letterSpacing: 2, marginBottom: 8 }}>EVENT LOG</div>
      {events.slice(0, 8).map((e, i) => (
        <div key={i} style={{ fontSize: 9, color: '#3A6A7A', marginBottom: 3, lineHeight: 1.4 }}>
          <span style={{ color: '#C9A84C66' }}>{new Date(e.ts).toLocaleTimeString()} </span>
          {e.evt}
        </div>
      ))}
    </div>
  );
}
