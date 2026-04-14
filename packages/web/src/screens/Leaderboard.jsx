import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@origo/core/src/gameStore.js';

const API = import.meta.env.VITE_API_URL || '';

const FILTERS = ['ALL', 'LAYER 0', 'LAYER 1+'];

export default function LeaderboardScreen() {
  const { myFactionId } = useGameStore();
  const [entries, setEntries]   = useState([]);
  const [filter, setFilter]     = useState('ALL');

  const fetchLeaderboard = useCallback(async () => {
    try {
      const token = localStorage.getItem('origo_token');
      const res   = await fetch(`${API}/api/faction/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.leaderboard || []);
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    const iv = setInterval(fetchLeaderboard, 10_000);
    return () => clearInterval(iv);
  }, [fetchLeaderboard]);

  const filtered = entries.filter(e => {
    if (filter === 'LAYER 0')  return (e.layer || 0) === 0;
    if (filter === 'LAYER 1+') return (e.layer || 0) >= 1;
    return true;
  });

  return (
    <div style={styles.container}>
      <div style={{ fontSize: 9, color: '#3A5A6A', letterSpacing: 3, marginBottom: 16, fontFamily: 'monospace' }}>
        LEADERBOARD
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flex: 1, padding: '6px 0', cursor: 'pointer',
              background: filter === f ? '#d4a01718' : '#0A1422',
              border: `1px solid ${filter === f ? '#d4a017' : '#1E2E48'}`,
              color: filter === f ? '#d4a017' : '#3A5A6A',
              fontFamily: 'monospace', fontSize: 9, letterSpacing: 1,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table Header */}
      <div style={styles.tableHeader}>
        <span style={{ width: 32 }}>#</span>
        <span style={{ flex: 1 }}>FACTION</span>
        <span style={{ width: 48, textAlign: 'right' }}>LAYER</span>
        <span style={{ width: 80, textAlign: 'right' }}>GHIFR</span>
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div style={{ color: '#2A4A5A', fontFamily: 'monospace', fontSize: 11, padding: 16, textAlign: 'center' }}>
          No factions found
        </div>
      ) : (
        filtered.map((entry, i) => {
          const isMe = entry.id === myFactionId;
          return (
            <div
              key={entry.id || i}
              style={{
                ...styles.row,
                border: isMe ? '1px solid #d4a017' : '1px solid transparent',
                background: isMe ? '#d4a01708' : 'transparent',
              }}
            >
              <span style={{ width: 32, color: '#3A5A6A', fontFamily: 'monospace', fontSize: 11 }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 2,
                  background: entry.color || '#666',
                  boxShadow: `0 0 6px ${entry.color || '#666'}`,
                }} />
                <span style={{ color: '#D8E4F8', fontFamily: 'monospace', fontSize: 12 }}>
                  {entry.name}
                </span>
              </div>
              <span style={{ width: 48, textAlign: 'right', color: '#C9A84C88', fontFamily: 'monospace', fontSize: 11 }}>
                {entry.layer || 0}
              </span>
              <span style={{ width: 80, textAlign: 'right', color: '#d4a017', fontFamily: 'monospace', fontSize: 12 }}>
                {(entry.ghifr || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100vw', minHeight: '100vh', background: '#04060E',
    padding: '20px 16px 80px', boxSizing: 'border-box',
    overflowY: 'auto',
  },
  tableHeader: {
    display: 'flex', alignItems: 'center', padding: '8px 10px',
    borderBottom: '1px solid #1E2E48', marginBottom: 4,
    fontSize: 8, color: '#3A5A6A', letterSpacing: 2, fontFamily: 'monospace',
  },
  row: {
    display: 'flex', alignItems: 'center', padding: '10px 10px',
    borderBottom: '1px solid #0d1520',
  },
};
