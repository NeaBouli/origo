import { useUI } from '../store/uiStore.js';

const TYPE_COLORS = {
  success: '#00ff88',
  error:   '#ff4444',
  info:    '#d4a017',
};

export default function Toast() {
  const { toasts, dismissToast } = useUI();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => dismissToast(toast.id)}
          style={{
            pointerEvents: 'auto',
            background: '#1a1a2e',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: 12,
            letterSpacing: 1,
            padding: '10px 20px',
            borderRadius: 6,
            boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 1px ${TYPE_COLORS[toast.type] || TYPE_COLORS.info}`,
            borderLeft: `3px solid ${TYPE_COLORS[toast.type] || TYPE_COLORS.info}`,
            cursor: 'pointer',
            animation: 'toastFadeIn 0.3s ease-out',
            maxWidth: 360,
          }}
        >
          {toast.message}
        </div>
      ))}

      <style>{`
        @keyframes toastFadeIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
