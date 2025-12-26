import React from 'react';
import { X, TrendingUp } from 'lucide-react';
import StatsBoard from './StatsBoard';
import { InputMode } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: { wpm: number; accuracy: number; date: string; mode?: InputMode }[];
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 flex-none">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                历史成绩记录
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                累计练习 {history.length} 次
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">
          <StatsBoard history={history} />
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-right flex-none">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;