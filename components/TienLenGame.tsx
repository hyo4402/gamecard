import React, { useState, useEffect } from 'react';
import { Undo2, History, Settings, Save, X, Zap, Users, LogOut, Trash, AlertTriangle } from 'lucide-react';
import { Player, TienLenRules, DEFAULT_TIENLEN_RULES, GameState } from '../types';
import { Layout } from './Layout';
import { Scoreboard } from './Scoreboard';
import { Button } from './ui/Button';
import { PlayerManager } from './PlayerManager';

interface TienLenGameProps {
  initialPlayers: Player[];
  onBack: () => void;
}

export const TienLenGame: React.FC<TienLenGameProps> = ({ initialPlayers, onBack }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('tienlen_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.tienLenRules) parsed.tienLenRules = DEFAULT_TIENLEN_RULES;
        return parsed;
      } catch (e) {
        console.error("Error parsing tienlen state", e);
      }
    }
    return { players: initialPlayers, history: [], tienLenRules: DEFAULT_TIENLEN_RULES };
  });

  const [inputMode, setInputMode] = useState<'NONE' | 'RANKING' | 'PIG' | 'SETTINGS'>('NONE');
  const [selectedRanks, setSelectedRanks] = useState<string[]>([]);
  const [pigCutter, setPigCutter] = useState<string | null>(null);
  const [pigVictim, setPigVictim] = useState<string | null>(null);
  const [editingRules, setEditingRules] = useState<TienLenRules>(DEFAULT_TIENLEN_RULES);
  const [showPlayerManager, setShowPlayerManager] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'NONE' | 'RESET_SCORE' | 'RESET_ALL'>('NONE');

  useEffect(() => { localStorage.setItem('tienlen_state', JSON.stringify(gameState)); }, [gameState]);

  const rules = gameState.tienLenRules || DEFAULT_TIENLEN_RULES;

  const updateScores = (changes: Record<string, number>, description: string) => {
    const newPlayers = gameState.players.map(p => ({ ...p, score: p.score + (changes[p.id] || 0) }));
    const newRound = { id: Date.now().toString(), timestamp: Date.now(), description, scoreChanges: changes };
    setGameState({ ...gameState, players: newPlayers, history: [newRound, ...gameState.history] });
  };

  const updatePlayersList = (newPlayers: Player[]) => {
    setGameState(prev => ({ ...prev, players: newPlayers }));
  };

  const handleRankSelection = (playerId: string) => {
    if (selectedRanks.includes(playerId)) setSelectedRanks(selectedRanks.filter(id => id !== playerId));
    else setSelectedRanks([...selectedRanks, playerId]);
  };

  const submitRanking = () => {
    const changes: Record<string, number> = {};
    const count = selectedRanks.length;
    if (count < 2) return;
    changes[selectedRanks[0]] = rules.FIRST;
    changes[selectedRanks[count - 1]] = rules.LAST;
    if (count >= 4) {
      changes[selectedRanks[1]] = rules.SECOND;
      changes[selectedRanks[2]] = rules.THIRD;
    } else if (count === 3) {
      changes[selectedRanks[1]] = 0;
    }
    updateScores(changes, 'Xếp hạng');
    setInputMode('NONE');
    setSelectedRanks([]);
  };

  const submitPig = (type: 'BLACK' | 'RED') => {
    if (!pigCutter || !pigVictim) return;
    const points = type === 'BLACK' ? rules.PIG_BLACK : rules.PIG_RED;
    const typeName = type === 'BLACK' ? 'Heo Đen' : 'Heo Đỏ';
    const changes: Record<string, number> = {};
    changes[pigCutter] = points;
    changes[pigVictim] = -points;
    updateScores(changes, `Chặt ${typeName}`);
  };

  const saveSettings = () => {
    setGameState({ ...gameState, tienLenRules: editingRules });
    setInputMode('NONE');
    setConfirmAction('NONE');
  };

  const undoLast = () => {
    if (gameState.history.length === 0) return;
    const lastRound = gameState.history[0];
    const newPlayers = gameState.players.map(p => ({ ...p, score: p.score - (lastRound.scoreChanges[p.id] || 0) }));
    setGameState({ ...gameState, players: newPlayers, history: gameState.history.slice(1) });
  };

  const resetScoresOnly = () => {
    setGameState({ ...gameState, players: gameState.players.map(p => ({ ...p, score: 0 })), history: [] });
    setConfirmAction('NONE');
  };

  const handleEndSession = () => {
    localStorage.removeItem('tienlen_state');
    onBack();
  };

  return (
    <Layout 
      title="Tiến Lên" 
      onBack={onBack}
      onReset={resetScoresOnly}
      rightAction={
        <button onClick={() => setShowPlayerManager(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors active:bg-gray-200">
          <Users className="w-5 h-5" />
        </button>
      }
    >
      <Scoreboard players={gameState.players} />
      
      {showPlayerManager && (
        <PlayerManager 
          players={gameState.players}
          onUpdatePlayers={updatePlayersList}
          onClose={() => setShowPlayerManager(false)}
        />
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button onClick={() => setInputMode('RANKING')} className="h-24 flex flex-col items-center justify-center gap-2"><span className="text-2xl">🏆</span><span>Xếp Hạng</span></Button>
        <div className="flex flex-col gap-3">
          <Button variant="secondary" onClick={() => setInputMode('PIG')} className="flex-1 flex items-center justify-center gap-2"><span className="text-xl">🐷</span><span>Chặt Heo</span></Button>
          <Button variant="outline" onClick={() => { setEditingRules(rules); setInputMode('SETTINGS'); setConfirmAction('NONE'); }} className="h-12 flex items-center justify-center gap-2 text-sm"><Settings className="w-4 h-4" /> Cài Đặt</Button>
        </div>
      </div>
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
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {Object.entries(round.scoreChanges).map(([pid, value]) => {
                    const score = Number(value); // Explicit cast
                    if (score === 0) return null;
                    const pName = gameState.players.find(p => p.id === pid)?.name || 'Người cũ';
                    return <span key={pid} className={`${score > 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>{pName}: {score > 0 ? '+' : ''}{score}</span>;
                  })}
                </div>
              </div>
            ))}
            {gameState.history.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">Chưa có ván nào.</div>}
          </div>
      </div>

      {/* Ranking Modal */}
      {inputMode === 'RANKING' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Kết quả ván đấu</h2>
              <button onClick={() => { setInputMode('NONE'); setSelectedRanks([]); }} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-500 mb-2">Chọn người chơi theo thứ tự về Nhất, Nhì...</p>
              <div className="grid grid-cols-2 gap-3">
                {gameState.players.map(p => {
                  const rankIndex = selectedRanks.indexOf(p.id);
                  const isSelected = rankIndex !== -1;
                  return (
                    <button key={p.id} onClick={() => handleRankSelection(p.id)} className={`p-4 rounded-xl font-semibold text-left relative transition-all ${isSelected ? 'bg-tet-gold/20 border-2 border-tet-gold text-yellow-900' : 'bg-gray-50 border-2 border-transparent text-gray-700'}`}>
                      {p.name}
                      {isSelected && <div className="absolute top-2 right-2 bg-tet-gold text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">{rankIndex + 1}</div>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setSelectedRanks([])} className="flex-1">Xóa</Button>
                <Button onClick={submitRanking} className="flex-[2]" disabled={selectedRanks.length < 2}>Lưu kết quả</Button>
            </div>
          </div>
        </div>
      )}

      {/* Pig Modal */}
      {inputMode === 'PIG' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Tính Điểm Chặt Heo</h2>
              <button onClick={() => { setInputMode('NONE'); setPigCutter(null); setPigVictim(null); }} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-green-600 uppercase">Người Chặt (Ăn)</label>
                <div className="flex flex-col gap-2">
                  {gameState.players.map(p => (
                    <button key={`winner-${p.id}`} onClick={() => setPigCutter(p.id)} disabled={pigVictim === p.id} className={`p-2 rounded-lg text-sm font-medium transition-colors ${pigCutter === p.id ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : 'bg-gray-50 text-gray-600'}`}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-red-600 uppercase">Người Bị Chặt (Thua)</label>
                <div className="flex flex-col gap-2">
                  {gameState.players.map(p => (
                    <button key={`loser-${p.id}`} onClick={() => setPigVictim(p.id)} disabled={pigCutter === p.id} className={`p-2 rounded-lg text-sm font-medium transition-colors ${pigVictim === p.id ? 'bg-red-100 text-red-700 ring-2 ring-red-500' : 'bg-gray-50 text-gray-600'}`}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => submitPig('BLACK')} disabled={!pigCutter || !pigVictim} className="bg-gray-800 text-white shadow-gray-300">+{rules.PIG_BLACK} Heo Đen</Button>
              <Button onClick={() => submitPig('RED')} disabled={!pigCutter || !pigVictim} variant="primary">+{rules.PIG_RED} Heo Đỏ</Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {inputMode === 'SETTINGS' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-gray-600" /> Cài Đặt</h2>
              <button onClick={() => setInputMode('NONE')} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6 mb-8">
              <div>
                <h3 className="font-bold text-sm text-gray-400 uppercase mb-3">Luật Chơi</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Nhất (Cộng)</label>
                    <input type="number" value={editingRules.FIRST} onChange={e => setEditingRules({...editingRules, FIRST: Number(e.target.value)})} className="w-full mt-1 p-2 border rounded-lg font-mono text-green-600" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Nhì (Cộng)</label>
                    <input type="number" value={editingRules.SECOND} onChange={e => setEditingRules({...editingRules, SECOND: Number(e.target.value)})} className="w-full mt-1 p-2 border rounded-lg font-mono text-blue-600" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Ba (Trừ)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 font-bold">-</span>
                        <input 
                          type="number" 
                          value={Math.abs(editingRules.THIRD)} 
                          onChange={e => setEditingRules({...editingRules, THIRD: -Math.abs(Number(e.target.value))})} 
                          className="w-full mt-1 p-2 pl-6 border rounded-lg font-mono text-orange-600" 
                        />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Chót (Trừ)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-600 font-bold">-</span>
                        <input 
                            type="number" 
                            value={Math.abs(editingRules.LAST)} 
                            onChange={e => setEditingRules({...editingRules, LAST: -Math.abs(Number(e.target.value))})} 
                            className="w-full mt-1 p-2 pl-6 border rounded-lg font-mono text-red-600" 
                        />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button fullWidth onClick={saveSettings} className="mb-4">
                <Save className="w-5 h-5 mr-2 inline" /> Lưu Luật
            </Button>

            <div className="border-t pt-4 space-y-3">
              <h3 className="font-bold text-sm text-gray-400 uppercase mb-2">Quản lý</h3>
              
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
    </Layout>
  );
};