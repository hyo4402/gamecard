import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Crown, X, Zap, Copy, Minus, Check, History, Undo2, Users, Settings, LogOut, Trash, AlertTriangle } from 'lucide-react';
import { Player, GameState } from '../types';
import { Layout } from './Layout';
import { Scoreboard } from './Scoreboard';
import { Button } from './ui/Button';
import { PlayerManager } from './PlayerManager';

interface XiDachGameProps {
  initialPlayers: Player[];
  dealerId: string;
  onBack: () => void;
}

export const XiDachGame: React.FC<XiDachGameProps> = ({ initialPlayers, dealerId, onBack }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('xidach_state');
    const parsed = saved ? JSON.parse(saved) : { players: initialPlayers, history: [], dealerId };
    if (!parsed.defaultBets) parsed.defaultBets = {};
    if (!parsed.dealerId) parsed.dealerId = dealerId; 
    return parsed;
  });

  const [bets, setBets] = useState<Record<string, string>>({}); 
  const [results, setResults] = useState<Record<string, 'WIN' | 'LOSE' | 'DRAW'>>({});
  const [multipliers, setMultipliers] = useState<Record<string, number>>({});
  const [dealerMultiplier, setDealerMultiplier] = useState(1);
  const [isRoundOpen, setIsRoundOpen] = useState(false);
  const [isChangeDealerOpen, setIsChangeDealerOpen] = useState(false);
  const [showPlayerManager, setShowPlayerManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // State quản lý xác nhận nút xóa
  const [confirmAction, setConfirmAction] = useState<'NONE' | 'RESET_SCORE' | 'RESET_ALL'>('NONE');

  useEffect(() => { localStorage.setItem('xidach_state', JSON.stringify(gameState)); }, [gameState]);

  useEffect(() => {
    if (isRoundOpen) {
        const initialBets: Record<string, string> = {};
        const initialResults: Record<string, 'WIN' | 'LOSE' | 'DRAW'> = {};
        const initialMultipliers: Record<string, number> = {};
        setDealerMultiplier(1); 

        gameState.players.forEach(p => {
          if (p.id !== gameState.dealerId) {
            initialBets[p.id] = (gameState.defaultBets?.[p.id] || 10).toString();
            initialResults[p.id] = 'LOSE';
            initialMultipliers[p.id] = 1;
          }
        });
        setBets(initialBets);
        setResults(initialResults);
        setMultipliers(initialMultipliers);
    }
  }, [isRoundOpen]);

  const updatePlayersList = (newPlayers: Player[]) => {
    setGameState(prev => ({
      ...prev,
      players: newPlayers
    }));
  };

  const updateScores = (changes: Record<string, number>, description: string) => {
    const newPlayers = gameState.players.map(p => ({ ...p, score: p.score + (changes[p.id] || 0) }));
    const newRound = { id: Date.now().toString(), timestamp: Date.now(), description, scoreChanges: changes };
    setGameState(prev => ({ ...prev, players: newPlayers, history: [newRound, ...prev.history] }));
  };

  const changeDealer = (newDealerId: string) => {
    setGameState(prev => ({ ...prev, dealerId: newDealerId }));
    setIsChangeDealerOpen(false);
  };

  const submitRound = () => {
    const changes: Record<string, number> = {};
    const newDefaultBets = { ...(gameState.defaultBets || {}) };
    let dealerDelta = 0;
    const currentDealerId = gameState.dealerId;

    if (!currentDealerId) return;

    gameState.players.forEach(p => {
      if (p.id === currentDealerId) return;

      const betAmount = parseInt(bets[p.id] || '0', 10);
      newDefaultBets[p.id] = betAmount;

      const playerMult = multipliers[p.id] || 1;
      const result = results[p.id];
      let finalChange = 0;

      if (dealerMultiplier > 1) {
          if (playerMult === dealerMultiplier) {
              finalChange = 0; 
          } else if (playerMult > dealerMultiplier) {
              finalChange = betAmount * playerMult;
          } else {
              finalChange = -(betAmount * dealerMultiplier);
          }
      } 
      else {
          if (playerMult > 1) {
              finalChange = betAmount * playerMult;
          } else {
              if (result === 'WIN') finalChange = betAmount;
              else if (result === 'LOSE') finalChange = -betAmount;
              else finalChange = 0;
          }
      }

      if (finalChange !== 0) {
          changes[p.id] = finalChange;
          dealerDelta -= finalChange;
      }
    });

    changes[currentDealerId] = dealerDelta;
    
    let desc = 'Kết quả ván';
    if (dealerMultiplier === 2) desc += ' (Cái Xì Dách)';
    if (dealerMultiplier === 3) desc += ' (Cái Xì Bàn)';

    setGameState(prev => ({ ...prev, defaultBets: newDefaultBets }));
    updateScores(changes, desc);
    setIsRoundOpen(false);
  };

  const undoLast = () => {
    if (gameState.history.length === 0) return;
    const lastRound = gameState.history[0];
    const newPlayers = gameState.players.map(p => ({ ...p, score: p.score - (lastRound.scoreChanges[p.id] || 0) }));
    setGameState({ ...gameState, players: newPlayers, history: gameState.history.slice(1) });
  };

  const resetScoresOnly = () => {
    setGameState({ ...gameState, players: gameState.players.map(p => ({ ...p, score: 0 })), history: [] });
    setShowSettings(false);
    setConfirmAction('NONE');
  };

  const handleEndSession = () => {
    localStorage.removeItem('xidach_state');
    onBack(); 
  };

  const toggleMultiplier = (pid: string, val: number) => { 
      setMultipliers(prev => {
          const currentVal = prev[pid];
          const newVal = currentVal === val ? 1 : val;
          if (dealerMultiplier === 1 && newVal > 1) {
              setResults(r => ({...r, [pid]: 'WIN'}));
          }
          return {...prev, [pid]: newVal};
      }); 
  }
  
  const setAllResults = (type: 'WIN' | 'LOSE' | 'DRAW') => {
      const newResults: Record<string, 'WIN' | 'LOSE' | 'DRAW'> = {};
      gameState.players.forEach(p => { if (p.id !== gameState.dealerId) newResults[p.id] = type; });
      setResults(newResults);
  }
  const applyBetToAll = (amount: string) => {
      const newBets: Record<string, string> = {};
      gameState.players.forEach(p => { if (p.id !== gameState.dealerId) newBets[p.id] = amount; });
      setBets(newBets);
  }

  const dealerName = gameState.players.find(p => p.id === gameState.dealerId)?.name || 'Nhà Cái';

  return (
    <Layout 
      title="Xì Dách" 
      onBack={onBack} 
      onReset={resetScoresOnly}
      rightAction={
        <div className="flex gap-1">
          <button onClick={() => setShowPlayerManager(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors active:bg-gray-200">
            <Users className="w-5 h-5" />
          </button>
          <button onClick={() => { setShowSettings(true); setConfirmAction('NONE'); }} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors active:bg-gray-200">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      }
    >
      <Scoreboard players={gameState.players} dealerId={gameState.dealerId} />

      {showPlayerManager && (
        <PlayerManager 
          players={gameState.players}
          onUpdatePlayers={updatePlayersList}
          onClose={() => setShowPlayerManager(false)}
          dealerId={gameState.dealerId}
          isRoundOpen={isRoundOpen}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-zoom-in">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600" /> Cài Đặt
                </h2>
                <button onClick={() => setShowSettings(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 active:bg-gray-300">
                  <X className="w-5 h-5" />
                </button>
             </div>
             <div className="space-y-3">
                {/* Reset Score Button - Double Tap Confirmation */}
                {confirmAction === 'RESET_SCORE' ? (
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); resetScoresOnly(); }} 
                    className="w-full p-3 rounded-xl bg-orange-100 text-orange-700 border border-orange-200 font-bold flex items-center justify-center gap-2 animate-bounce-subtle"
                  >
                    <AlertTriangle className="w-5 h-5" /> Bấm lần nữa để XÓA ĐIỂM
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => setConfirmAction('RESET_SCORE')} 
                    className="w-full p-3 rounded-xl border border-gray-200 text-gray-600 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <Trash className="w-4 h-4" /> Xóa điểm (Giữ người chơi)
                  </button>
                )}

                {/* Reset ALL Button - Double Tap Confirmation */}
                {confirmAction === 'RESET_ALL' ? (
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleEndSession(); }} 
                    className="w-full p-3 rounded-xl bg-red-600 text-white border border-red-700 font-bold flex items-center justify-center gap-2 shadow-lg animate-bounce-subtle"
                  >
                    <AlertTriangle className="w-5 h-5" /> XÁC NHẬN: XÓA TẤT CẢ?
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => setConfirmAction('RESET_ALL')} 
                    className="w-full p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 font-medium flex items-center justify-center gap-2 hover:bg-red-100 active:bg-red-200 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Chơi lại từ đầu (Reset All)
                  </button>
                )}
             </div>
          </div>
        </div>
      )}

      {!isRoundOpen ? (
        <div className="mb-6 space-y-3">
          <div className="flex gap-2">
              <Button fullWidth onClick={() => setIsRoundOpen(true)} className="h-14 text-lg shadow-xl flex-1">Bắt đầu ván mới</Button>
              <Button variant="secondary" onClick={() => setIsChangeDealerOpen(true)} className="w-14 h-14 !p-0 flex items-center justify-center rounded-xl"><ArrowRightLeft className="w-6 h-6" /></Button>
          </div>
          <p className="text-center text-xs text-gray-400">Điểm cược sẽ tự động lưu lại cho ván sau.</p>
        </div>
      ) : (
        <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col animate-slide-up">
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
              <h2 className="font-bold text-lg truncate pr-2">Cái: {dealerName}</h2>
              <button onClick={() => setIsRoundOpen(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            {/* Dealer Status */}
            <div className="bg-white px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-yellow-600" />
                <span className="text-xs font-bold uppercase text-gray-500">Trạng thái Nhà Cái</span>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => setDealerMultiplier(1)} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${dealerMultiplier === 1 ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}>Thường</button>
                  <button onClick={() => setDealerMultiplier(2)} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${dealerMultiplier === 2 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200'}`}>Xì Dách (x2)</button>
                  <button onClick={() => setDealerMultiplier(3)} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${dealerMultiplier === 3 ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-500 border-gray-200'}`}>Xì Bàn (x3)</button>
              </div>
            </div>

            <div className="bg-gray-100 px-4 py-2 flex gap-2 overflow-x-auto shrink-0 border-b no-scrollbar">
                <button onClick={() => setAllResults('LOSE')} className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold whitespace-nowrap"><Zap className="w-3 h-3" /> Cái ăn hết</button>
                <button onClick={() => setAllResults('DRAW')} className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold whitespace-nowrap">Hòa hết</button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button onClick={() => { const firstVal = Object.values(bets)[0]; if(typeof firstVal === 'string') applyBetToAll(firstVal); }} className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg text-xs font-bold whitespace-nowrap"><Copy className="w-3 h-3" /> Copy điểm cược</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {gameState.players.filter(p => p.id !== gameState.dealerId).map(p => {
                const isPlayerSpecial = (multipliers[p.id] || 1) > 1;
                const isDealerSpecial = dealerMultiplier > 1;
                let statusText = "";
                
                if (isDealerSpecial) {
                    const pMult = multipliers[p.id] || 1;
                    if (pMult === dealerMultiplier) statusText = "Hòa (Cùng hàng)";
                    else if (pMult > dealerMultiplier) statusText = "Thắng (Hàng lớn hơn)";
                    else statusText = `Thua x${dealerMultiplier} (Cái có hàng)`;
                } else if (isPlayerSpecial) {
                    statusText = `Thắng x${multipliers[p.id]} (Tự động)`;
                }

                return (
                <div key={p.id} className={`p-4 rounded-xl shadow-sm border transition-all ${isPlayerSpecial || isDealerSpecial ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-lg truncate max-w-[150px]">{p.name}</span>
                    <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-tet-red/20 focus-within:border-tet-red transition-all shadow-sm">
                      <input type="number" inputMode="numeric" value={bets[p.id] || ''} onChange={(e) => setBets({...bets, [p.id]: e.target.value})} className="w-16 text-right font-mono font-bold bg-transparent outline-none text-gray-900" />
                      <span className="text-gray-400 text-xs font-bold">điểm</span>
                    </div>
                  </div>
                  
                  {statusText && <div className="mb-2 text-xs font-bold text-center py-1 bg-gray-200 text-gray-700 rounded">{statusText}</div>}

                  <div className="flex flex-col gap-3">
                      {(!isDealerSpecial && !isPlayerSpecial) && (
                        <div className="grid grid-cols-3 gap-2 animate-fade-in">
                          <button onClick={() => setResults({...results, [p.id]: 'LOSE'})} className={`py-3 rounded-lg font-bold text-sm flex flex-col items-center gap-1 transition-all ${results[p.id] === 'LOSE' ? 'bg-red-500 text-white shadow-md shadow-red-200' : 'bg-white border border-gray-200 text-gray-400'}`}><X className="w-5 h-5" /> Thua</button>
                          <button onClick={() => setResults({...results, [p.id]: 'DRAW'})} className={`py-3 rounded-lg font-bold text-sm flex flex-col items-center gap-1 transition-all ${results[p.id] === 'DRAW' ? 'bg-yellow-400 text-yellow-900 shadow-md shadow-yellow-200' : 'bg-white border border-gray-200 text-gray-400'}`}><Minus className="w-5 h-5" /> Hòa</button>
                          <button onClick={() => setResults({...results, [p.id]: 'WIN'})} className={`py-3 rounded-lg font-bold text-sm flex flex-col items-center gap-1 transition-all ${results[p.id] === 'WIN' ? 'bg-green-500 text-white shadow-md shadow-green-200' : 'bg-white border border-gray-200 text-gray-400'}`}><Check className="w-5 h-5" /> Thắng</button>
                        </div>
                      )}

                    <div className="flex gap-2">
                        <button onClick={() => toggleMultiplier(p.id, 2)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${multipliers[p.id] === 2 ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-gray-400 border-gray-200'}`}>x2 (Xì Dách)</button>
                        <button onClick={() => toggleMultiplier(p.id, 3)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${multipliers[p.id] === 3 ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-gray-400 border-gray-200'}`}>x3 (Xì Bàn)</button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
            <div className="p-4 bg-white border-t shrink-0">
              <Button fullWidth onClick={submitRound}>Xác nhận</Button>
            </div>
        </div>
      )}
      
      {/* Change Dealer Modal */}
      {isChangeDealerOpen && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-zoom-in">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><ArrowRightLeft className="w-5 h-5" /> Chọn Nhà Cái Mới</h3>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto mb-4">
                  {gameState.players.map(p => (
                      <button key={p.id} onClick={() => changeDealer(p.id)} className={`w-full p-3 rounded-xl flex items-center justify-between border-2 transition-all ${gameState.dealerId === p.id ? 'border-tet-red bg-red-50 text-tet-red font-bold' : 'border-transparent bg-gray-50 text-gray-700'}`}>
                        <span>{p.name}</span>
                        {gameState.dealerId === p.id && <Check className="w-4 h-4" />}
                      </button>
                  ))}
                </div>
                <Button variant="ghost" fullWidth onClick={() => setIsChangeDealerOpen(false)}>Hủy</Button>
            </div>
          </div>
      )}

      <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-gray-500 text-sm uppercase flex items-center gap-2"><History className="w-4 h-4" /> Lịch sử</h3>
            <button onClick={undoLast} disabled={gameState.history.length === 0} className="text-sm text-blue-600 font-medium disabled:opacity-30 flex items-center gap-1"><Undo2 className="w-4 h-4" /> Hoàn tác</button>
          </div>
          <div className="space-y-2">
            {gameState.history.map(round => (
              <div key={round.id} className="bg-white p-3 rounded-xl border border-gray-100 text-sm animate-slide-up">
                <div className="flex justify-between text-gray-500 text-xs mb-1">
                  <span>{new Date(round.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span className="font-medium">{round.description}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {Object.entries(round.scoreChanges).map(([pid, value]) => {
                    const score = value;
                    const pName = gameState.players.find(p => p.id === pid)?.name || 'Người cũ';
                    return (
                      <div key={pid} className="flex justify-between">
                          <span>{pName}</span>
                          <span className={`${score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-gray-400'} font-mono`}>{score > 0 ? '+' : ''}{score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
      </div>
    </Layout>
  );
};