import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Users, Pencil, Check } from 'lucide-react';
import { Player } from '../types';
import { Button } from './ui/Button';

interface PlayerManagerProps {
  players: Player[];
  onUpdatePlayers: (newPlayers: Player[]) => void;
  onClose: () => void;
  dealerId?: string;
  isRoundOpen?: boolean;
}

export const PlayerManager: React.FC<PlayerManagerProps> = ({ players, onUpdatePlayers, onClose, dealerId, isRoundOpen }) => {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  // State quản lý ID đang chờ xác nhận xóa
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Tự động hủy trạng thái xác nhận xóa sau 3 giây nếu không bấm tiếp
  useEffect(() => {
    if (deleteConfirmId) {
      const timer = setTimeout(() => setDeleteConfirmId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteConfirmId]);

  const addPlayer = () => {
    if (!newName.trim()) return;
    const newPlayer: Player = { 
      id: Date.now().toString(), 
      name: newName.trim(), 
      score: 0 
    };
    onUpdatePlayers([...players, newPlayer]);
    setNewName('');
  };

  const handleRemoveClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Quan trọng: Ngăn chặn click lan ra ngoài làm đóng modal
    
    if (players.length <= 2) {
      alert("Cần tối thiểu 2 người chơi để tiếp tục.");
      return;
    }
    if (dealerId && id === dealerId) {
      alert("Không thể xóa Nhà Cái. Vui lòng chuyển cái trước khi xóa.");
      return;
    }

    if (deleteConfirmId === id) {
      // Đã xác nhận -> Xóa thật
      const updatedList = players.filter(p => p.id !== id);
      onUpdatePlayers(updatedList);
      setDeleteConfirmId(null);
    } else {
      // Bấm lần 1 -> Chuyển sang chế độ chờ xác nhận
      setDeleteConfirmId(id);
    }
  };

  const startEditing = (p: Player) => {
    setEditingId(p.id);
    setEditName(p.name);
    setDeleteConfirmId(null); 
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    const updatedPlayers = players.map(p => p.id === id ? { ...p, name: editName.trim() } : p);
    onUpdatePlayers(updatedPlayers);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-zoom-in border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" /> Quản Lý Người Chơi
          </h2>
          <button type="button" onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 active:bg-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isRoundOpen && (
          <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm mb-4 border border-yellow-200">
            ⚠️ Đang trong ván. Hãy kết thúc ván trước khi thêm/bớt người.
          </div>
        )}

        {/* Add Player Section */}
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && !isRoundOpen && addPlayer()}
            placeholder="Tên người mới..." 
            disabled={!!isRoundOpen}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-tet-red focus:ring-1 focus:ring-tet-red transition-all disabled:opacity-50" 
          />
          <Button type="button" onClick={addPlayer} disabled={!newName.trim() || !!isRoundOpen}>
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Player List */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto mb-4 pr-1">
          {players.map((p) => (
            <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${deleteConfirmId === p.id ? 'bg-red-50 border-red-200 ring-1 ring-red-200' : 'bg-gray-50 border-gray-100'}`}>
              
              {editingId === p.id ? (
                <div className="flex-1 flex gap-2 mr-2">
                   <input 
                      autoFocus
                      className="flex-1 bg-white border border-blue-300 rounded px-2 py-1 text-sm outline-none"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit(p.id)}
                   />
                   <button type="button" onClick={() => saveEdit(p.id)} className="text-green-600 p-1"><Check className="w-4 h-4" /></button>
                </div>
              ) : (
                <span className={`font-medium flex items-center gap-2 ${deleteConfirmId === p.id ? 'text-red-700' : 'text-gray-900'}`}>
                  {p.name}
                  {dealerId === p.id && <span className="text-[10px] bg-gray-800 text-white px-1.5 py-0.5 rounded">CÁI</span>}
                </span>
              )}

              <div className="flex gap-1">
                 {editingId !== p.id && deleteConfirmId !== p.id && (
                    <button type="button" onClick={() => startEditing(p)} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg transition-colors active:bg-gray-200">
                      <Pencil className="w-4 h-4" />
                    </button>
                 )}
                
                <button 
                  type="button"
                  onClick={(e) => handleRemoveClick(e, p.id)} 
                  className={`rounded-lg transition-all duration-200 flex items-center justify-center ${
                    dealerId === p.id || isRoundOpen 
                      ? 'p-2 text-gray-300 cursor-not-allowed' 
                      : deleteConfirmId === p.id
                        ? 'px-3 py-2 bg-red-500 text-white shadow-md font-bold text-xs' // Biến thành nút chữ "Xóa"
                        : 'p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 active:bg-red-100'
                  }`}
                  disabled={dealerId === p.id || !!isRoundOpen}
                >
                  {deleteConfirmId === p.id ? "Xóa?" : <Trash2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <Button fullWidth variant="secondary" onClick={onClose}>Đóng</Button>
      </div>
    </div>
  );
};