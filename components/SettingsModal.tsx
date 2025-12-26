import React, { useEffect, useState } from 'react';
import { X, Key, Save, AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { validateApiKey } from '../services/gemini';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('USER_API_KEY');
      if (savedKey) {
        setApiKey(savedKey);
      }
      setStatus('idle');
      setErrorMsg('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    const trimmedKey = apiKey.trim();
    
    // 如果是空值，则清除 Key (允许操作)
    if (!trimmedKey) {
      localStorage.removeItem('USER_API_KEY');
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 800);
      return;
    }

    // 开始验证
    setStatus('validating');
    setErrorMsg('');
    
    const isValid = await validateApiKey(trimmedKey);
    
    if (isValid) {
      localStorage.setItem('USER_API_KEY', trimmedKey);
      setStatus('success');
      setTimeout(() => {
          setStatus('idle');
          onClose();
      }, 800);
    } else {
      setStatus('error');
      setErrorMsg('Key 验证失败。请检查 Key 是否正确或是否有配额。');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors duration-300">
        
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Key size={20} className="text-blue-500"/>
            API 设置
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
           <div className="mb-4">
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
               Gemini API Key
             </label>
             <input 
               type="password" 
               value={apiKey}
               onChange={(e) => {
                 setApiKey(e.target.value);
                 if (status === 'error') setStatus('idle'); // 重置错误状态
               }}
               placeholder="AIzaSy..."
               disabled={status === 'validating'}
               className={`w-full px-4 py-2 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all font-mono text-sm ${
                 status === 'error' 
                   ? 'border-red-500 focus:ring-red-500' 
                   : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:border-transparent'
               }`}
             />
             
             {status === 'error' && (
               <div className="mt-2 text-xs text-red-500 flex items-center gap-1 animate-in slide-in-from-top-1">
                 <XCircle size={12} /> {errorMsg}
               </div>
             )}

             <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
               本应用需使用您自己的 Gemini API Key 来生成练习内容。请在上方输入框中粘贴您的 Key。
             </p>
           </div>

           <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3 flex gap-2 items-start">
              <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[10px] md:text-xs text-amber-700 dark:text-amber-400">
                Key 仅存储在本地，验证过程会消耗少量 Token。请确保网络能连接 Google 服务。
              </p>
           </div>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={status === 'validating'}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            disabled={status === 'validating'}
            className={`px-4 py-2 text-sm text-white rounded-lg font-medium transition-all flex items-center gap-2 min-w-[100px] justify-center ${
              status === 'success' ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
            }`}
          >
            {status === 'validating' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>验证中</span>
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle size={16} />
                <span>已保存</span>
              </>
            ) : (
              <>
                <span>保存设置</span>
                <Save size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;