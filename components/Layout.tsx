import React from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';

interface LayoutProps {
  title: string;
  onBack?: () => void;
  onReset?: () => void;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ title, onBack, onReset, children, rightAction }) => {
  const handleResetClick = () => {
    if (!onReset) return;
    setTimeout(() => {
      if(window.confirm('Bạn có chắc muốn xóa hết điểm và lịch sử chơi không?')) {
        onReset();
      }
    }, 50);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden relative">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm h-16 pt-safe box-content">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors active:bg-gray-200">
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-800 truncate max-w-[200px]">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          {rightAction}
          {onReset && (
            <button 
              onClick={handleResetClick}
              className="p-2 -mr-2 text-gray-400 hover:text-red-500 rounded-full transition-colors active:bg-gray-100"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar overscroll-none">
        {children}
      </main>
    </div>
  );
};