import { useEffect, useRef } from 'react';
import { useGame } from '../App.jsx';
import { UniverseRenderer } from '../renderer/UniverseRenderer.js';
import FactionHUD from '../components/FactionHUD.jsx';
import EventLog   from '../components/EventLog.jsx';
import ZoomControls from '../components/ZoomControls.jsx';

export default function UniverseScreen() {
  const canvasRef  = useRef(null);
  const rendererRef = useRef(null);
  const { grid, generation, factions, myFactionId, zoom, setZoom, events } = useGame();

  // Init Three.js renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    rendererRef.current = new UniverseRenderer(canvasRef.current);
    rendererRef.current.init();

    return () => rendererRef.current?.dispose();
  }, []);

  // Push grid updates to renderer
  useEffect(() => {
    rendererRef.current?.updateGrid(grid, factions, myFactionId);
  }, [grid, factions, myFactionId]);

  // Sync zoom level
  useEffect(() => {
    rendererRef.current?.setZoom(zoom);
  }, [zoom]);

  const handleCanvasClick = (e) => {
    if (zoom !== 'micro') return;
    const cell = rendererRef.current?.screenToCell(e.clientX, e.clientY);
    if (cell) window._origoWS?.placeCells([cell]);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#04060E', position: 'relative', overflow: 'hidden' }}>
      {/* Three.js canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onClick={handleCanvasClick}
      />

      {/* HUD overlays */}
      <FactionHUD />
      <ZoomControls zoom={zoom} setZoom={setZoom} />
      <EventLog events={events} />

      {/* Generation counter */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        color: '#C9A84C44', fontFamily: 'monospace', fontSize: 11, letterSpacing: 3,
        pointerEvents: 'none',
      }}>
        GEN {String(generation).padStart(8, '0')}
      </div>
    </div>
  );
}
