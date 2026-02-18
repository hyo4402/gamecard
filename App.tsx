import React, { useState, useEffect } from 'react';
import { Trophy, Users, History, RotateCcw, Plus, Trash2, Save, X, Settings, Coins, AlertCircle } from 'lucide-react';
import { Player, GameMode, GameState } from './types';

// --- COMPONENTS TRONG FILE CHO GỌN ---

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
      <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-lg text-gray-800">{title}</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// --- MAIN APP ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GameMode>('TIENLEN');
  const [players, setPlayers] = useState<Player[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  // Game Logic States
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [tienLenRanks, setTienLenRanks] = useState<string[]>([]); // [Nhat, Nhi, Ba, Chot]
  const [bets, setBets] = useState<Record<string, number>>({});
  const [xiDachResults, setXiDachResults] = useState<Record<string, 'WIN' | 'LOSE' | 'DRAW'>>({});
  
  // UI States
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Load Data
  useEffect(() => {
    const saved = localStorage.getItem('socaibet_web_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setPlayers(data.players || []);
        setHistory(data.history || []);
        setActiveTab(data.mode || 'TIENLEN');
        setDealerId(data.dealerId || null);
      } catch (e) { console.error(e); }
    } else {
      // Demo Data for new users
      setPlayers([
        { id: '1', name: 'Ba', score: 0 },
        { id: '2', name: 'Mẹ', score: 0 },
        { id: '3', name: 'Anh Hai', score: 0 },
        { id: '4', name: 'Út', score: 0 },
      ]);
    }
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem('socaibet_web_data', JSON.stringify({ players, history, mode: activeTab, dealerId }));
  }, [players, history, activeTab, dealerId]);

  // --- ACTIONS ---

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    setPlayers([...players, { id: Date.now().toString(), name: newPlayerName, score: 0 }]);
    setNewPlayerName('');
    setShowAddPlayer(false);
  };

  const removePlayer = (id: string) => {
    if (window.confirm('Xóa người chơi này?')) {
      setPlayers(players.filter(p => p.id !== id));
      if (dealerId === id) setDealerId(null);
    }
  };

  const resetGame = () => {
    if (window.confirm('Reset toàn bộ điểm về 0? Lịch sử sẽ được giữ.')) {
      setPlayers(players.map(p => ({ ...p, score: 0 })));
    }
  };

  const updateScore = (deltas: Record<string, number>, reason: string) => {
    const newPlayers = players.map(p => ({
      ...p,
      score: p.score + (deltas[p.id] || 0)
    }));
    
    const log = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      reason,
      deltas
    };

    setPlayers(newPlayers);
    setHistory([log, ...history]);
  };

  // --- LOGIC TIẾN LÊN ---
  const handleTienLenSubmit = () => {
    if (tienLenRanks.length < 2) return;
    const deltas: Record<string, number> = {};
    const rules = [5, 3, -3, -5]; // Nhất, Nhì, Ba, Chót (4 người)
    
    // Logic điểm cơ bản
    if (tienLenRanks.length === 4) {
      deltas[tienLenRanks[0]] = 5;
      deltas[tienLenRanks[1]] = 3;
      deltas[tienLenRanks[2]] = -3;
      deltas[tienLenRanks[3]] = -5;
    } else if (tienLenRanks.length === 3) {
      deltas[tienLenRanks[0]] = 5;
      deltas[tienLenRanks[1]] = 0; // Ba người thì nhì hòa
      deltas[tienLenRanks[2]] = -5;
    } else {
       // 2 người
       deltas[tienLenRanks[0]] = 5;
       deltas[tienLenRanks[1]] = -5;
    }

    updateScore(deltas, `Tiến Lên: ${players.find(p=>p.id === tienLenRanks[0])?.name} về Nhất`);
    setTienLenRanks([]);
  };

  const toggleRank = (id: string) => {
    if (tienLenRanks.includes(id)) {
      setTienLenRanks(tienLenRanks.filter(pid => pid !== id));
    } else {
      if (tienLenRanks.length < 4) setTienLenRanks([...tienLenRanks, id]);
    }
  };

  // --- LOGIC XÌ DÁCH ---
  const handleXiDachSubmit = () => {
    if (!dealerId) return;
    const deltas: Record<string, number> = {};
    let dealerDelta = 0;

    players.forEach(p => {
      if (p.id === dealerId) return;
      const bet = bets[p.id] || 10; // Default bet 10
      const result = xiDachResults[p.id] || 'LOSE';
      
      let change = 0;
      if (result === 'WIN') change = bet;
      if (result === 'LOSE') change = -bet;
      
      if (change !== 0) {
        deltas[p.id] = change;
        dealerDelta -= change;
      }
    });
    deltas[dealerId] = dealerDelta;
    
    updateScore(deltas, 'Ván Xì Dách');
    // Reset results but keep bets
    setXiDachResults({});
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-tet-red text-white p-2 rounded-lg">
              <Trophy className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl text-gray-800 hidden sm:block">Sổ Cái Tết</h1>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('TIENLEN')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'TIENLEN' ? 'bg-white text-tet-red shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tiến Lên
            </button>
            <button 
              onClick={() => setActiveTab('XIDACH')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'XIDACH' ? 'bg-white text-tet-red shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Xì Dách
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={resetGame} className="p-2 text-gray-400 hover:text-tet-red hover:bg-red-50 rounded-full transition-colors" title="Reset điểm">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button onClick={() => setShowAddPlayer(true)} className="flex items-center gap-1 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Thêm người</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PLAYER GRID & GAME CONTROLS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* PLAYER GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {players.map(p => (
              <div key={p.id} className={`bg-white rounded-xl p-4 border-2 transition-all relative group card-shadow ${dealerId === p.id && activeTab === 'XIDACH' ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-transparent hover:border-gray-200'}`}>
                
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-700 truncate">{p.name}</span>
                  <button onClick={() => removePlayer(p.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className={`text-3xl font-bold mb-2 tracking-tight ${p.score > 0 ? 'text-green-600' : p.score < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {p.score > 0 ? '+' : ''}{p.score}
                </div>

                {/* GAME SPECIFIC CONTROLS PER CARD */}
                {activeTab === 'TIENLEN' && (
                  <button 
                    onClick={() => toggleRank(p.id)}
                    className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${tienLenRanks.includes(p.id) ? 'bg-tet-red text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {tienLenRanks.indexOf(p.id) !== -1 ? `Hạng ${tienLenRanks.indexOf(p.id) + 1}` : 'Chọn hạng'}
                  </button>
                )}

                {activeTab === 'XIDACH' && (
                  <>
                    {dealerId === p.id ? (
                      <div className="w-full py-2 bg-yellow-100 text-yellow-800 rounded-lg text-center text-xs font-bold uppercase flex items-center justify-center gap-1">
                        <Coins className="w-3 h-3" /> Nhà Cái
                      </div>
                    ) : (
                      <div className="space-y-2">
                         <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border">
                            <span className="text-xs text-gray-400">Cược</span>
                            <input 
                              type="number" 
                              className="w-full bg-transparent text-right font-bold text-sm outline-none"
                              value={bets[p.id] || 10}
                              onChange={(e) => setBets({...bets, [p.id]: Number(e.target.value)})}
                            />
                         </div>
                         <div className="flex gap-1">
                            <button 
                              onClick={() => setXiDachResults({...xiDachResults, [p.id]: 'WIN'})}
                              className={`flex-1 py-1 rounded text-xs font-bold ${xiDachResults[p.id] === 'WIN' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}
                            >Thắng</button>
                            <button 
                              onClick={() => setXiDachResults({...xiDachResults, [p.id]: 'LOSE'})}
                              className={`flex-1 py-1 rounded text-xs font-bold ${xiDachResults[p.id] === 'LOSE' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}
                            >Thua</button>
                         </div>
                      </div>
                    )}
                    <button onClick={() => setDealerId(p.id)} className="mt-2 text-[10px] text-gray-400 underline w-full text-center hover:text-gray-600">
                      Làm cái
                    </button>
                  </>
                )}
              </div>
            ))}
            
            {/* Add Player Card */}
            <button onClick={() => setShowAddPlayer(true)} className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:border-tet-red hover:text-tet-red hover:bg-red-50 transition-all min-h-[140px]">
              <Plus className="w-8 h-8 mb-2" />
              <span className="font-medium text-sm">Thêm người</span>
            </button>
          </div>

          {/* ACTION BAR */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky bottom-4 z-20">
             {activeTab === 'TIENLEN' ? (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Đã chọn: <span className="font-bold text-gray-900">{tienLenRanks.length}</span> người
                    {tienLenRanks.length > 0 && <span className="ml-2 text-xs">({tienLenRanks.map(id => players.find(p=>p.id===id)?.name).join(' → ')})</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setTienLenRanks([])} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium text-sm">Hủy</button>
                    <button 
                      onClick={handleTienLenSubmit}
                      disabled={tienLenRanks.length < 2}
                      className="bg-tet-red text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-red-200 disabled:opacity-50 disabled:shadow-none hover:bg-red-700 transition-all"
                    >
                      Xác nhận xếp hạng
                    </button>
                  </div>
                </div>
             ) : (
               <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Nhà cái: <span className="font-bold text-gray-900">{players.find(p=>p.id===dealerId)?.name || 'Chưa chọn'}</span>
                  </div>
                   <button 
                      onClick={handleXiDachSubmit}
                      disabled={!dealerId}
                      className="bg-tet-gold text-yellow-900 px-6 py-2 rounded-lg font-bold shadow-lg shadow-yellow-100 disabled:opacity-50 disabled:shadow-none hover:bg-yellow-400 transition-all"
                    >
                      Chốt sổ Xì Dách
                    </button>
               </div>
             )}
          </div>
        </div>

        {/* RIGHT COLUMN: HISTORY */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit max-h-[calc(100vh-100px)] flex flex-col">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between sticky top-0">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <History className="w-4 h-4" /> Lịch sử đấu
              </h3>
              <span className="text-xs text-gray-400">{history.length} ván</span>
            </div>
            <div className="overflow-y-auto p-4 space-y-3 flex-1">
              {history.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Chưa có dữ liệu</p>}
              {history.map((log: any) => (
                <div key={log.id} className="text-sm border-b border-gray-100 last:border-0 pb-3 last:pb-0 animate-fade-in">
                  <div className="flex justify-between text-gray-400 text-xs mb-1">
                    <span>{log.time}</span>
                    <span className="font-medium text-gray-500 truncate max-w-[150px]">{log.reason}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2">
                    {Object.entries(log.deltas).map(([pid, val]: [string, any]) => {
                       if (val === 0) return null;
                       const pName = players.find(p => p.id === pid)?.name || 'Unknown';
                       return (
                         <div key={pid} className="flex justify-between">
                           <span className="text-gray-600">{pName}</span>
                           <span className={`font-mono font-medium ${val > 0 ? 'text-green-600' : 'text-red-500'}`}>
                             {val > 0 ? '+' : ''}{val}
                           </span>
                         </div>
                       )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      {/* MODALS */}
      {showAddPlayer && (
        <Modal title="Thêm người chơi mới" onClose={() => setShowAddPlayer(false)}>
          <div className="space-y-4">
            <input 
              autoFocus
              type="text" 
              value={newPlayerName}
              onChange={e => setNewPlayerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPlayer()}
              placeholder="Nhập tên..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-tet-red focus:ring-1 focus:ring-tet-red"
            />
            <button onClick={addPlayer} className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800">Thêm ngay</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default App;