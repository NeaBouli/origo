import { useUI } from '../store/uiStore.js';

const NAV_ITEMS = [
  { id: 'universe',    label: 'Universe',    icon: '\uD83C\uDF0C' },
  { id: 'faction',     label: 'Faction',     icon: '\uD83D\uDC7E' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '\uD83C\uDFC6' },
  { id: 'patterns',    label: 'Patterns',    icon: '\uD83D\uDD2C' },
];

export default function Navigation() {
  const { screen, setScreen } = useUI();

  return (
    <nav style={styles.nav}>
      {NAV_ITEMS.map(item => {
        const active = screen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setScreen(item.id)}
            style={{
              ...styles.item,
              color: active ? '#d4a017' : '#666',
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
            <span style={{
              fontSize: 8, letterSpacing: 1, marginTop: 2,
              color: active ? '#d4a017' : '#666',
            }}>
              {item.label.toUpperCase()}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

const styles = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    background: '#0A0F1E',
    borderTop: '1px solid #1E2E48',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 9000,
    backdropFilter: 'blur(8px)',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'monospace',
    minWidth: 44,
    minHeight: 44,
    padding: '4px 12px',
    WebkitTapHighlightColor: 'transparent',
  },
};
