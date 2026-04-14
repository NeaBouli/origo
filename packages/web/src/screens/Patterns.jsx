import { useState, useEffect, useCallback } from 'react';
import { useUI } from '../store/uiStore.js';

const API = import.meta.env.VITE_API_URL || '';

const TABS = ['LIBRARY', 'UNNAMED'];

export default function PatternsScreen() {
  const { showToast } = useUI();
  const [tab, setTab]               = useState('LIBRARY');
  const [library, setLibrary]       = useState([]);
  const [unnamed, setUnnamed]       = useState([]);
  const [expanded, setExpanded]     = useState(null);
  const [votes, setVotes]           = useState([]);
  const [proposedNames, setProposed] = useState({});

  const token = localStorage.getItem('origo_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchLibrary = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/patterns/library`, { headers });
      if (res.ok) {
        const data = await res.json();
        setLibrary(data.patterns || []);
      }
    } catch { /* silent */ }
  }, []);

  const fetchUnnamed = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/patterns/unnamed`, { headers });
      if (res.ok) {
        const data = await res.json();
        setUnnamed(data.patterns || []);
      }
    } catch { /* silent */ }
  }, []);

  const fetchVotes = useCallback(async (patternId) => {
    try {
      const res = await fetch(`${API}/api/patterns/votes/${patternId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setVotes(data.votes || []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (tab === 'LIBRARY') fetchLibrary();
    else fetchUnnamed();
  }, [tab, fetchLibrary, fetchUnnamed]);

  useEffect(() => {
    if (expanded) fetchVotes(expanded);
  }, [expanded, fetchVotes]);

  const handleVote = async (patternId) => {
    const name = proposedNames[patternId]?.trim();
    if (!name) {
      showToast('Enter a proposed name', 'error');
      return;
    }
    try {
      const res = await fetch(`${API}/api/patterns/vote`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patternId, name }),
      });
      if (res.ok) {
        showToast('Vote submitted!', 'success');
        setProposed(p => ({ ...p, [patternId]: '' }));
        fetchVotes(patternId);
        fetchUnnamed();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Vote failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  return (
    <div style={styles.container}>
      <div style={{ fontSize: 9, color: '#3A5A6A', letterSpacing: 3, marginBottom: 16, fontFamily: 'monospace' }}>
        PATTERN REGISTRY
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setExpanded(null); }}
            style={{
              flex: 1, padding: '6px 0', cursor: 'pointer',
              background: tab === t ? '#d4a01718' : '#0A1422',
              border: `1px solid ${tab === t ? '#d4a017' : '#1E2E48'}`,
              color: tab === t ? '#d4a017' : '#3A5A6A',
              fontFamily: 'monospace', fontSize: 9, letterSpacing: 1,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Library Tab */}
      {tab === 'LIBRARY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {library.length === 0 ? (
            <div style={styles.empty}>No named patterns yet</div>
          ) : (
            library.map(p => (
              <div key={p.id} style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#D8E4F8', fontFamily: 'monospace', fontSize: 13 }}>{p.name}</span>
                  <span style={{ color: '#3A5A6A', fontFamily: 'monospace', fontSize: 9 }}>{p.cells || '?'} cells</span>
                </div>
                {p.discoveredBy && (
                  <div style={{ fontSize: 9, color: '#3A5A6A', marginTop: 4, letterSpacing: 1 }}>
                    Discovered by {p.discoveredBy}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Unnamed Tab */}
      {tab === 'UNNAMED' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {unnamed.length === 0 ? (
            <div style={styles.empty}>No unnamed patterns awaiting votes</div>
          ) : (
            unnamed.map(p => (
              <div key={p.id} style={styles.card}>
                <div
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#D8E4F8', fontFamily: 'monospace', fontSize: 12 }}>
                      Pattern #{p.id}
                    </span>
                    <span style={{ color: '#3A5A6A', fontFamily: 'monospace', fontSize: 9 }}>
                      {p.cells || '?'} cells
                    </span>
                  </div>
                  <div style={{ fontSize: 9, color: '#d4a017', marginTop: 4, fontFamily: 'monospace' }}>
                    Cost: {p.voteCount ? (p.voteCount + 1) ** 2 : 1} GHIFR (votes&sup2;)
                  </div>
                </div>

                {/* Expanded: vote list + input */}
                {expanded === p.id && (
                  <div style={{ marginTop: 10, borderTop: '1px solid #1E2E48', paddingTop: 10 }}>
                    {votes.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 8, color: '#3A5A6A', letterSpacing: 2, marginBottom: 6 }}>
                          CURRENT VOTES
                        </div>
                        {votes.map((v, i) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between',
                            padding: '4px 0', fontSize: 10, fontFamily: 'monospace',
                          }}>
                            <span style={{ color: '#D8E4F8' }}>{v.name}</span>
                            <span style={{ color: '#d4a017' }}>{v.count || 1} vote{(v.count || 1) > 1 ? 's' : ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Proposed name..."
                        value={proposedNames[p.id] || ''}
                        onChange={e => setProposed(prev => ({ ...prev, [p.id]: e.target.value }))}
                        style={styles.input}
                      />
                      <button onClick={() => handleVote(p.id)} style={styles.button}>
                        VOTE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
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
  card: {
    background: '#0A0F1Ecc', border: '1px solid #C9A84C33',
    padding: '14px 18px', backdropFilter: 'blur(8px)',
  },
  empty: {
    color: '#2A4A5A', fontFamily: 'monospace', fontSize: 11, padding: 16, textAlign: 'center',
  },
  input: {
    flex: 1, background: '#0d1520', border: '1px solid #1E2E48',
    color: '#D8E4F8', fontFamily: 'monospace', fontSize: 12,
    padding: '8px 12px', outline: 'none',
  },
  button: {
    background: '#d4a017', color: '#04060E', border: 'none',
    fontFamily: 'monospace', fontSize: 10, letterSpacing: 2,
    padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold',
  },
};
