import { useState, useEffect } from 'react';
import { useGame } from '../App.jsx';

export default function FactionHUD({ renderer }) {
  const { myFactionId, factions, ghifrBalance, connected } = useGame();
  const [leniaOn, setLeniaOn] = useState(renderer?.getLeniaMode() ?? false);

  // Sync when renderer changes
  useEffect(() => {
    const sync = () => setLeniaOn(renderer?.getLeniaMode() ?? false);
    window.addEventListener('lenia-toggle', sync);
    return () => window.removeEventListener('lenia-toggle', sync);
  }, [renderer]);

  const me = factions[myFactionId];
  if (!me) return null;

  const cells = me.cells || 0;
  const total = Object.values(factions).reduce((a, f) => a + (f.cells || 0), 0) || 1;
  const pct   = ((cells / total) * 100).toFixed(2);

  const toggleLenia = () => {
    const next = !leniaOn;
    renderer?.setLeniaMode(next);
    setLeniaOn(next);
    window.dispatchEvent(new Event('lenia-toggle'));
  };

  return (
    <div style={{
      position:'absolute', bottom:24, left:24,
      background:'#0A0F1Ecc', border:'1px solid #C9A84C33',
      padding:'14px 18px', minWidth:210, fontFamily:'monospace',
      backdropFilter:'blur(8px)',
    }}>
      <div style={{fontSize:9, color:connected?'#00ff88':'#ff4444', letterSpacing:2, marginBottom:10}}>
        {connected ? '● LIVE' : '○ CONNECTING...'}
      </div>
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
        <div style={{width:10, height:10, borderRadius:2, background:me.color, boxShadow:`0 0 8px ${me.color}`}}/>
        <span style={{fontSize:12, color:'#D8E4F8', letterSpacing:1}}>{me.name}</span>
        <span style={{fontSize:9, color:'#C9A84C88', marginLeft:'auto'}}>L{me.layer||0}</span>
      </div>
      {[['CELLS',cells.toLocaleString()],['TERRITORY',`${pct}%`],['GHIFR',ghifrBalance.toFixed(2)]].map(([l,v])=>(
        <div key={l} style={{display:'flex', justifyContent:'space-between', marginBottom:5}}>
          <span style={{fontSize:9, color:'#3A5A6A', letterSpacing:1}}>{l}</span>
          <span style={{fontSize:11, color:'#C9A84C'}}>{v}</span>
        </div>
      ))}
      <div style={{height:3, background:'#0d1520', borderRadius:2, margin:'8px 0 12px'}}>
        <div style={{width:`${Math.min(100,parseFloat(pct))}%`, height:'100%', background:me.color, borderRadius:2, transition:'width 0.5s'}}/>
      </div>
      <div style={{borderTop:'1px solid #1E2E48', paddingTop:10}}>
        <div style={{fontSize:8, color:'#2A4A5A', letterSpacing:2, marginBottom:6}}>RENDER MODE</div>
        <button onClick={toggleLenia} style={{
          width:'100%', padding:'6px 0', cursor:'pointer',
          background:leniaOn?'#C9A84C18':'#0A1422',
          border:`1px solid ${leniaOn?'#C9A84C':'#1E2E48'}`,
          color:leniaOn?'#C9A84C':'#3A5A6A',
          fontFamily:'monospace', fontSize:10, letterSpacing:1, transition:'all 0.2s',
        }}>
          {leniaOn ? '✦ LENIA MODE ON' : '○ BINARY MODE'}
        </button>
        {leniaOn && <div style={{fontSize:8, color:'#C9A84C44', marginTop:4, textAlign:'center'}}>smooth organic rendering</div>}
      </div>
    </div>
  );
}
