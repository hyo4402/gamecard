import React, { useState } from 'react';
import { GameMode, Player } from './types';
import { GameSelector } from './components/GameSelector';
import { PlayerSetup } from './components/PlayerSetup';
import { TienLenGame } from './components/TienLenGame';
import { XiDachGame } from './components/XiDachGame';
import { Layout } from './components/Layout';

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>('HOME');
  const [players, setPlayers] = useState<Player[]>([]);
  const [dealerId, setDealerId] = useState<string>('');
  const [step, setStep] = useState<'SELECT_GAME' | 'SETUP_PLAYERS' | 'PLAYING'>('SELECT_GAME');

  const handleGameSelect = (selectedMode: GameMode) => {
    setMode(selectedMode);
    
    try {
      const savedKey = selectedMode === 'TIENLEN' ? 'tienlen_state' : 'xidach_state';
      const savedState = localStorage.getItem(savedKey);
      
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed && Array.isArray(parsed.players) && parsed.players.length > 0) {
          setPlayers(parsed.players);
          if (parsed.dealerId) setDealerId(parsed.dealerId);
          setStep('PLAYING');
          return;
        }
      }
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu cũ:", e);
    }
    
    // Nếu không có dữ liệu cũ hợp lệ, chuyển sang màn hình setup
    setStep('SETUP_PLAYERS');
  };

  const handleStartGame = (setupPlayers: Player[], dealer?: string) => {
    setPlayers(setupPlayers);
    if (dealer) setDealerId(dealer);
    setStep('PLAYING');
  };

  const handleBack = () => {
    setStep('SELECT_GAME');
    setMode('HOME');
    setPlayers([]);
    setDealerId('');
  };

  // --- RENDER LOGIC ---

  if (step === 'SETUP_PLAYERS') {
    return (
      <Layout title={`Thiết lập ${mode === 'TIENLEN' ? 'Tiến Lên' : 'Xì Dách'}`} onBack={handleBack}>
        <PlayerSetup onStart={handleStartGame} gameMode={mode as 'TIENLEN' | 'XIDACH'} />
      </Layout>
    );
  }

  if (step === 'PLAYING') {
    if (mode === 'TIENLEN') {
      return <TienLenGame initialPlayers={players} onBack={handleBack} />;
    }
    if (mode === 'XIDACH') {
      return <XiDachGame initialPlayers={players} dealerId={dealerId} onBack={handleBack} />;
    }
  }

  // Fallback mặc định: Màn hình chọn game
  return <GameSelector onSelect={handleGameSelect} />;
};

export default App;