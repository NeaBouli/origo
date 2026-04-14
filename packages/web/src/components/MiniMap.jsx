import { useRef, useEffect } from 'react';
import { useGame } from '../App.jsx';

const WIDTH  = 120;
const HEIGHT = 80;

export default function MiniMap() {
  const canvasRef = useRef(null);
  const { factions, myFactionId } = useGame();
  const frameRef  = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let pulse = 0;

    const draw = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Background
      ctx.fillStyle = '#04060E';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      const factionList = Object.values(factions);
      if (factionList.length === 0) {
        frameRef.current = requestAnimationFrame(draw);
        return;
      }

      pulse = (pulse + 0.03) % (Math.PI * 2);

      factionList.forEach(f => {
        if (!f.x && f.x !== 0) return; // skip factions without position

        const isMe   = f.id === myFactionId;
        const radius = isMe ? 4 + Math.sin(pulse) * 1.5 : 2;
        const x = (f.x / 1000) * WIDTH;
        const y = (f.y / 1000) * HEIGHT;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = f.color || '#666';
        ctx.fill();

        if (isMe) {
          ctx.beginPath();
          ctx.arc(x, y, radius + 3 + Math.sin(pulse) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = `${f.color || '#d4a017'}66`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [factions, myFactionId]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1000;
    const y = ((e.clientY - rect.top) / rect.height) * 1000;
    window.dispatchEvent(new CustomEvent('camera-move', { detail: { x, y } }));
  };

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        width: WIDTH,
        height: HEIGHT,
        border: '1px solid rgba(30, 46, 72, 0.5)',
        background: '#04060Ecc',
        cursor: 'pointer',
        zIndex: 8000,
        borderRadius: 4,
      }}
    />
  );
}
