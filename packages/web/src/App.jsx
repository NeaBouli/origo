import { useEffect, useState } from 'react';
import { createGameStore } from '@origo/core/src/gameStore.js';
import { OrigoWSClient }   from '@origo/core/src/wsClient.js';
import UniverseScreen  from './screens/Universe.jsx';
import OnboardingScreen from './screens/Onboarding.jsx';
import LoadingScreen   from './screens/Loading.jsx';

// Create global store instance
export const useGame = createGameStore();

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

export default function App() {
  const { connected, setConnected, applyDelta, applySnapshot,
          updateGHIFR, addEvent, setMyFaction } = useGame();

  const [screen, setScreen] = useState('loading'); // loading | onboarding | universe
  const [token,  setToken]  = useState(null);

  useEffect(() => {
    // Check for stored session
    const saved = localStorage.getItem('origo_token');
    if (saved) {
      setToken(saved);
      setScreen('universe');
    } else {
      setScreen('onboarding');
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const ws = new OrigoWSClient({
      url:        WS_URL,
      onConnect:  ()          => setConnected(true),
      onDisconnect: ()        => setConnected(false),
      onSnapshot: (grid, gen) => applySnapshot(grid, gen),
      onDelta:    (cells, gen)=> applyDelta(cells, gen),
      onGHIFR:    (bal, d)    => updateGHIFR(bal, d),
      onEvent:    (evt, data) => addEvent({ evt, data, ts: Date.now() }),
    });

    ws.connect(token);
    window._origoWS = ws; // expose for cell placement

    return () => ws.disconnect();
  }, [token]);

  const handleOnboardingComplete = (newToken, faction) => {
    localStorage.setItem('origo_token', newToken);
    setToken(newToken);
    setMyFaction(faction);
    setScreen('universe');
  };

  if (screen === 'loading')    return <LoadingScreen />;
  if (screen === 'onboarding') return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  return <UniverseScreen />;
}
