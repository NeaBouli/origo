import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@origo/core/src/gameStore.js';
import { useUI } from '../store/uiStore.js';

const API = import.meta.env.VITE_API_URL || '';

export default function FactionScreen() {
  const { myFactionId, factions, ghifrBalance } = useGameStore();
  const { showToast } = useUI();

  const [voucherAmount, setVoucherAmount] = useState('');
  const [vouchers, setVouchers]           = useState([]);
  const [issuing, setIssuing]             = useState(false);

  const me = factions[myFactionId];

  const fetchVouchers = useCallback(async () => {
    try {
      const token = localStorage.getItem('origo_token');
      const res   = await fetch(`${API}/api/voucher/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVouchers(data.vouchers || []);
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const handleIssue = async () => {
    const amount = parseInt(voucherAmount, 10);
    if (!amount || amount < 100) {
      showToast('Minimum voucher amount is 100 GHIFR', 'error');
      return;
    }
    setIssuing(true);
    try {
      const token = localStorage.getItem('origo_token');
      const res = await fetch(`${API}/api/voucher/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        showToast(`Voucher issued: ${amount} GHIFR`, 'success');
        setVoucherAmount('');
        fetchVouchers();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to issue voucher', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setIssuing(false);
    }
  };

  if (!me) {
    return (
      <div style={styles.container}>
        <div style={{ color: '#3A5A6A', fontFamily: 'monospace', textAlign: 'center', marginTop: 80 }}>
          No faction data available
        </div>
      </div>
    );
  }

  const layerProgress = me.layer != null ? Math.min(100, ((me.cells || 0) / 1000) * 100) : 0;

  return (
    <div style={styles.container}>
      {/* Faction Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 14, height: 14, borderRadius: 3,
            background: me.color, boxShadow: `0 0 12px ${me.color}`,
          }} />
          <span style={{ fontSize: 18, color: '#D8E4F8', letterSpacing: 2, fontFamily: 'monospace' }}>
            {me.name}
          </span>
          <span style={{ fontSize: 10, color: '#d4a017', marginLeft: 'auto', letterSpacing: 1 }}>
            LAYER {me.layer || 0}
          </span>
        </div>
        <div style={{ fontSize: 9, color: '#3A5A6A', letterSpacing: 2, fontFamily: 'monospace' }}>
          {(me.cells || 0).toLocaleString()} CELLS
        </div>
      </div>

      {/* GHIFR Balance */}
      <div style={styles.balanceBox}>
        <div style={{ fontSize: 9, color: '#3A5A6A', letterSpacing: 2, marginBottom: 6 }}>GHIFR BALANCE</div>
        <div style={{
          fontSize: 32, color: '#d4a017', fontFamily: 'monospace', fontWeight: 'bold',
          textShadow: '0 0 20px rgba(212,160,23,0.3)',
        }}>
          {ghifrBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Layer Progress */}
      <div style={styles.section}>
        <div style={{ fontSize: 9, color: '#3A5A6A', letterSpacing: 2, marginBottom: 8 }}>LAYER PROGRESS</div>
        <div style={{ height: 4, background: '#0d1520', borderRadius: 2 }}>
          <div style={{
            width: `${layerProgress}%`, height: '100%',
            background: me.color, borderRadius: 2, transition: 'width 0.5s',
          }} />
        </div>
        <div style={{ fontSize: 9, color: '#3A5A6A', marginTop: 4, textAlign: 'right' }}>
          {layerProgress.toFixed(1)}%
        </div>
      </div>

      {/* Issue Voucher */}
      <div style={styles.section}>
        <div style={{ fontSize: 9, color: '#3A5A6A', letterSpacing: 2, marginBottom: 10 }}>ISSUE VOUCHER</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            min={100}
            placeholder="Min 100 GHIFR"
            value={voucherAmount}
            onChange={e => setVoucherAmount(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleIssue} disabled={issuing} style={styles.button}>
            {issuing ? '...' : 'ISSUE VOUCHER'}
          </button>
        </div>
      </div>

      {/* Voucher List */}
      <div style={styles.section}>
        <div style={{ fontSize: 9, color: '#3A5A6A', letterSpacing: 2, marginBottom: 10 }}>VOUCHERS</div>
        {vouchers.length === 0 ? (
          <div style={{ fontSize: 11, color: '#2A4A5A', fontFamily: 'monospace' }}>No vouchers issued</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {vouchers.map((v, i) => (
              <div key={v.id || i} style={styles.voucherRow}>
                <span style={{ color: '#d4a017', fontFamily: 'monospace', fontSize: 12 }}>
                  {v.amount} GHIFR
                </span>
                <span style={{ color: '#3A5A6A', fontSize: 9, letterSpacing: 1 }}>
                  {v.status || 'ACTIVE'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100vw', minHeight: '100vh', background: '#04060E',
    padding: '20px 16px 80px', boxSizing: 'border-box',
    overflowY: 'auto',
  },
  header: {
    background: '#0A0F1Ecc', border: '1px solid #C9A84C33',
    padding: '16px 18px', marginBottom: 16, backdropFilter: 'blur(8px)',
  },
  balanceBox: {
    background: '#0A0F1Ecc', border: '1px solid #C9A84C33',
    padding: '20px 18px', marginBottom: 16, textAlign: 'center',
    backdropFilter: 'blur(8px)',
  },
  section: {
    background: '#0A0F1Ecc', border: '1px solid #C9A84C33',
    padding: '14px 18px', marginBottom: 16, backdropFilter: 'blur(8px)',
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
    whiteSpace: 'nowrap',
  },
  voucherRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 10px', background: '#0d1520', borderLeft: '2px solid #d4a017',
  },
};
