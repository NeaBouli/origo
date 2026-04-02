export default function LoadingScreen() {
  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#04060E',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace',
    }}>
      <div style={{ fontSize: 42, color: '#C9A84C', letterSpacing: 8, marginBottom: 16 }}>ORIGO</div>
      <div style={{ fontSize: 10, color: '#1E3A4A', letterSpacing: 4, animation: 'pulse 1.5s infinite' }}>
        INITIALIZING UNIVERSE...
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
