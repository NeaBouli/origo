import { useState } from 'react';

const PATTERNS = [
  { id: 'glider',     name: 'Glider',      desc: 'Mobile — travels endlessly',       cells: [[0,1],[1,2],[2,0],[2,1],[2,2]] },
  { id: 'rpentomino', name: 'R-Pentomino', desc: 'Chaotic — unpredictable growth',   cells: [[0,1],[0,2],[1,0],[1,1],[2,1]] },
  { id: 'acorn',      name: 'Acorn',       desc: 'Explosive — massive expansion',    cells: [[0,1],[1,3],[2,0],[2,1],[2,4],[2,5],[2,6]] },
  { id: 'pulsar',     name: 'Pulsar',      desc: 'Oscillator — stable + rhythmic',   cells: [[0,2],[0,3],[0,4],[5,2],[5,3],[5,4]] },
  { id: 'spaceship',  name: 'Spaceship',   desc: 'Fast mover — territorial',         cells: [[0,1],[0,4],[1,0],[2,0],[2,4],[3,0],[3,1],[3,2],[3,3]] },
];

const COLORS = ['#00ff88','#ff3366','#00aaff','#ffaa00','#cc44ff','#ff6600','#00ffcc'];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function OnboardingScreen({ onComplete }) {
  const [step,       setStep]       = useState(1); // 1=name 2=color 3=pattern 4=confirm
  const [name,       setName]       = useState('');
  const [color,      setColor]      = useState(COLORS[0]);
  const [pattern,    setPattern]    = useState(PATTERNS[0]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/faction/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, patternId: pattern.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { token, faction } = await res.json();
      onComplete(token, faction);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#04060E',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace',
    }}>
      <div style={{
        background: '#0A0F1E', border: '1px solid #C9A84C33',
        padding: '36px 40px', width: 420,
        boxShadow: '0 0 60px #C9A84C11',
      }}>
        {/* Header */}
        <div style={{ fontSize: 28, color: '#C9A84C', letterSpacing: 4, marginBottom: 4 }}>ORIGO</div>
        <div style={{ fontSize: 9, color: '#3A5A6A', letterSpacing: 2, marginBottom: 28 }}>
          UNIVERSAL ORIGIN GAME — CREATE YOUR FACTION
        </div>

        {/* Step 1 — Name */}
        {step === 1 && (
          <>
            <label style={{ fontSize: 9, color: '#C9A84C88', letterSpacing: 2 }}>FACTION NAME</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={24}
              placeholder="Enter faction name..."
              style={{
                display: 'block', width: '100%', marginTop: 8, marginBottom: 20,
                background: '#060C18', border: '1px solid #1E2E48',
                color: '#D8E4F8', padding: '10px 12px', fontFamily: 'monospace',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
            <Btn disabled={name.length < 2} onClick={() => setStep(2)}>NEXT →</Btn>
          </>
        )}

        {/* Step 2 — Color */}
        {step === 2 && (
          <>
            <div style={{ fontSize: 9, color: '#C9A84C88', letterSpacing: 2, marginBottom: 14 }}>FACTION COLOR</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
              {COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 40, height: 40, borderRadius: 4, background: c, cursor: 'pointer',
                    border: `2px solid ${color === c ? '#fff' : 'transparent'}`,
                    boxShadow: color === c ? `0 0 12px ${c}` : 'none',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn ghost onClick={() => setStep(1)}>← BACK</Btn>
              <Btn onClick={() => setStep(3)}>NEXT →</Btn>
            </div>
          </>
        )}

        {/* Step 3 — Pattern */}
        {step === 3 && (
          <>
            <div style={{ fontSize: 9, color: '#C9A84C88', letterSpacing: 2, marginBottom: 14 }}>STARTING PATTERN</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              {PATTERNS.map(p => (
                <div
                  key={p.id}
                  onClick={() => setPattern(p)}
                  style={{
                    padding: '10px 14px', cursor: 'pointer',
                    background: pattern.id === p.id ? '#C9A84C11' : '#060C18',
                    border: `1px solid ${pattern.id === p.id ? '#C9A84C' : '#1E2E48'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 11, color: pattern.id === p.id ? '#C9A84C' : '#7A9AAA' }}>{p.name}</span>
                  <span style={{ fontSize: 9, color: '#3A5A6A', marginLeft: 10 }}>{p.desc}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn ghost onClick={() => setStep(2)}>← BACK</Btn>
              <Btn onClick={() => setStep(4)}>NEXT →</Btn>
            </div>
          </>
        )}

        {/* Step 4 — Confirm */}
        {step === 4 && (
          <>
            <div style={{ fontSize: 9, color: '#C9A84C88', letterSpacing: 2, marginBottom: 16 }}>CONFIRM — €1.00</div>
            {[
              ['NAME',    name],
              ['PATTERN', pattern.name],
              ['WORLD',   'Earth — Layer 0'],
              ['ENTRY',   '€1.00 (permanent)'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #0D1828', paddingBottom: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 9, color: '#3A5A6A' }}>{l}</span>
                <span style={{ fontSize: 11, color: '#D8E4F8' }}>{v}</span>
              </div>
            ))}
            {error && <div style={{ color: '#ff4444', fontSize: 10, marginTop: 8 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <Btn ghost onClick={() => setStep(3)}>← BACK</Btn>
              <Btn onClick={handleCreate} disabled={loading}>
                {loading ? 'CREATING...' : '⚡ ENTER UNIVERSE'}
              </Btn>
            </div>
            <div style={{ marginTop: 12, fontSize: 8, color: '#1E3A4A', lineHeight: 1.8 }}>
              Once confirmed, Conway takes over. No refunds — your faction lives forever.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Btn({ children, onClick, disabled, ghost }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, padding: '10px 0', cursor: disabled ? 'default' : 'pointer',
        background: ghost ? 'transparent' : (disabled ? '#1A2A1A' : '#C9A84C'),
        color: ghost ? '#3A5A6A' : (disabled ? '#3A5A3A' : '#04060E'),
        border: ghost ? '1px solid #1E2E48' : 'none',
        fontFamily: 'monospace', fontWeight: 700, fontSize: 11, letterSpacing: 2,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}
