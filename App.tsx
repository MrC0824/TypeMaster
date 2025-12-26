import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Difficulty, InputMode, GameState, TypingStats, GameSettings, PracticeContent } from './types.ts';
import { generatePracticeContent, getFallbackContent, AVAILABLE_MODELS, DEFAULT_MODEL } from './services/gemini.ts';
import { ContentCache } from './services/contentCache.ts';
import TypingArea from './components/TypingArea.tsx';
import StatsBoard from './components/StatsBoard.tsx';
import TutorialModal from './components/TutorialModal.tsx';
import SettingsModal from './components/SettingsModal.tsx';
import HistoryModal from './components/HistoryModal.tsx';
import { Keyboard, Layers, BookOpen, Loader2, RefreshCcw, Settings2, GraduationCap, Volume2, VolumeX, Keyboard as KbIcon, Zap, ArrowLeft, Home, Moon, Sun, Download, CheckCircle, Database, Key, WifiOff, AlertTriangle, ChevronDown, BarChart2 } from 'lucide-react';

const INITIAL_STATE: GameState = {
  status: 'IDLE',
  currentInput: '',
  startTime: null,
  endTime: null,
  currentIndex: 0,
  errors: [],
  content: null
};

// Error Modal Component (Internal)
interface ErrorModalProps {
  isOpen: boolean;
  onRetry: () => void;
  onFallback: () => void;
  onClose: () => void;
}
const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onRetry, onFallback, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 text-center animate-in zoom-in duration-200">
        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
           <WifiOff size={24} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">更新失败</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          连接 AI 接口生成新题库时出错。<br/>请检查 API Key 配额或网络连接。
        </p>
        <div className="flex flex-col gap-3">
           <button onClick={onRetry} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
             <RefreshCcw size={16} /> 重试更新
           </button>
           <button onClick={onFallback} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
             <Database size={16} /> 使用现有/离线模式
           </button>
           <button onClick={onClose} className="mt-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
             取消
           </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<InputMode>(InputMode.PINYIN);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  // Updated history type to include mode
  const [history, setHistory] = useState<{ wpm: number; accuracy: number; date: string; mode: InputMode }[]>([]);
  const [loading, setLoading] = useState(false);
  const [caching, setCaching] = useState(false); // State for batch download
  const [cacheStatus, setCacheStatus] = useState<string | null>(null); // Feedback for cache
  const [cacheCounts, setCacheCounts] = useState<Record<string, number>>({});
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Model selection state
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL);

  // New State for Error Handling
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const failureCountRef = useRef(0);

  const [settings, setSettings] = useState<GameSettings>({ soundEnabled: true, keyboardVisible: true, continuousMode: true });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });
  
  const requestIdRef = useRef(0);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Check cache status on mount or mode change
  useEffect(() => {
    updateCacheCounts();
  }, [mode]);

  // Console Logger Helper
  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info', detail?: string) => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    const logPrefix = `[${timestamp}] ${icon} ${message}`;
    const logDetail = detail ? `${type === 'success' ? '预览' : '详情'}: ${detail}` : '';

    if (type === 'error') {
      console.error(logPrefix + logDetail);
    } else {
      console.log(logPrefix + logDetail);
    }
  };

  const updateCacheCounts = () => {
    const bCount = ContentCache.getCount(mode, Difficulty.BEGINNER);
    const iCount = ContentCache.getCount(mode, Difficulty.INTERMEDIATE);
    const aCount = ContentCache.getCount(mode, Difficulty.ADVANCED);
    
    const newCounts = {
        [Difficulty.BEGINNER]: bCount,
        [Difficulty.INTERMEDIATE]: iCount,
        [Difficulty.ADVANCED]: aCount
    };
    setCacheCounts(newCounts);
    
    const totalCount = bCount + iCount + aCount;

    if (totalCount > 0) {
      setCacheStatus(`本地题库: 已存储 ${totalCount} 套`);
    } else {
      setCacheStatus(null);
    }
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleModeSwitch = (newMode: InputMode) => {
    if (mode === newMode) return;
    requestIdRef.current++;
    setMode(newMode);
    setGameState(INITIAL_STATE);
    setLoading(false);
    failureCountRef.current = 0; // Reset failure count on mode switch
  };

  const checkApiKey = (): boolean => {
    const key = localStorage.getItem('USER_API_KEY');
    if (!key) {
      setShowSettings(true);
      // Removed alert log to clean up console
      return false;
    }
    return true;
  };

  const handleBatchCache = async () => {
    // Strict API Key Check for manual update
    if (!checkApiKey()) return;

    if (caching) return;
    setCaching(true);
    setCacheStatus("正在更新题库...");
    addLog(`开始更新 ${mode === InputMode.PINYIN ? '拼音' : '五笔'} 模式题库 (模型: ${AVAILABLE_MODELS.find(m => m.id === modelId)?.name})...`, 'info');
    
    try {
      // Fetch all 3 difficulties concurrently using selected model
      const difficulties = [Difficulty.BEGINNER, Difficulty.INTERMEDIATE, Difficulty.ADVANCED];
      const promises = difficulties.map(diff => generatePracticeContent(mode, diff, modelId));
      
      const results = await Promise.all(promises);
      
      // Save to cache and Log
      results.forEach((content, index) => {
        const diff = difficulties[index];
        ContentCache.save(mode, diff, content);
        
        const diffName = diff === Difficulty.BEGINNER ? '初级' : diff === Difficulty.INTERMEDIATE ? '中级' : '高级';
        const isOffline = content.id.startsWith('fallback');
        const source = isOffline ? '离线兜底' : 'AI生成';
        const previewText = content.text.length > 50 ? content.text.substring(0, 50) + '...' : content.text;
        
        addLog(
          `${diffName}题库更新成功 [${source}]`, 
          'success', 
          previewText
        );
      });
      
      // Update status with new counts
      updateCacheCounts();
      addLog(`所有难度题库已同步`, 'success');
      failureCountRef.current = 0; // Reset on success
    } catch (error) {
      console.error("Batch cache failed", error);
      failureCountRef.current++;
      
      // If manual update fails multiple times, show error modal
      if (failureCountRef.current >= 1) {
        setErrorModalOpen(true);
      }
      
      setCacheStatus("更新失败，请重试");
      addLog('题库更新过程中发生错误', 'error', String(error));
    } finally {
      setCaching(false);
    }
  };

  // Dedicated function to start game with fallback data
  const startFallbackTask = () => {
    setErrorModalOpen(false);
    const content = getFallbackContent(mode, difficulty);
    requestIdRef.current++; // Invalidate previous requests
    
    setGameState({ 
        ...INITIAL_STATE, 
        status: 'PLAYING', 
        content, 
        startTime: Date.now(), 
        endTime: null,
        currentIndex: 0, 
        errors: [], 
        currentInput: '' 
    });
    setLoading(false);
    addLog(`启用离线兜底模式 [${difficulty}]`, 'info');
  };

  const startTask = async () => {
    // 1. Check for local cache. If missing, use fallback directly.
    // This logic ensures that users can play immediately without an API key using the offline dataset.
    // We NO LONGER check API key here automatically.
    if (!ContentCache.has(mode, difficulty)) {
      startFallbackTask();
      return;
    }

    const currentId = ++requestIdRef.current;
    
    setLoading(true);
    setGameState(prev => ({ ...prev, status: 'LOADING' }));
    
    try {
      // 1. Priority: Check Cache (Now returns a RANDOM set)
      const cachedContent = ContentCache.get(mode, difficulty);
      
      if (cachedContent) {
        // Normal path: Cache exists
        if (currentId === requestIdRef.current) {
          failureCountRef.current = 0; 
          setGameState({ 
              ...INITIAL_STATE, 
              status: 'PLAYING', 
              content: cachedContent, 
              startTime: Date.now(), 
              endTime: null,
              currentIndex: 0, 
              errors: [], 
              currentInput: '' 
          });
        }
      } else {
        // Safety fallback if cache read fails silently or returns null
        console.warn("Cache detected but failed to read, using fallback.");
        startFallbackTask();
      }
    } catch (e) {
      // Error reading cache
      console.error("Error loading cached content:", e);
      startFallbackTask();
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const restartTask = () => {
    // If we have cached content, restart should try to fetch a fresh random one if desired,
    // or just restart the current one. 
    // Usually "Retry" means "Try same content again", but "Play again" means "Next Level/Content".
    // For simplicity, let's just restart the CURRENT content for now to practice mastery.
    // User can click "Start Practice" again from menu for new content.
    if (!gameState.content) return;
    setGameState(prev => ({
        ...prev,
        status: 'PLAYING',
        startTime: Date.now(),
        endTime: null,
        currentIndex: 0,
        errors: [],
        currentInput: ''
    }));
  };

  const handleBack = () => {
    requestIdRef.current++; 
    setLoading(false);
    setGameState(INITIAL_STATE);
  };

  const handleInputChange = (val: string, composing: boolean) => {
    if (!gameState.content || gameState.status !== 'PLAYING') return;
    setGameState(s => ({ ...s, currentInput: val }));
    if (composing) return;

    const normalize = (s: string) => s.replace(/ü/g, 'v').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, '');
    let tempIdx = gameState.currentIndex;
    let input = val;
    let errors = [...gameState.errors];
    const characters = gameState.content.characters;
    let hasAdvanced = true;

    while (hasAdvanced && tempIdx < characters.length) {
      hasAdvanced = false;
      const targetCharData = characters[tempIdx];
      const targetChar = targetCharData.char;
      const targetCode = normalize(mode === InputMode.PINYIN ? targetCharData.pinyin : targetCharData.wubi);
      
      const firstChar = input.charAt(0);
      const isChineseChar = /[\u4e00-\u9fa5]/.test(firstChar);

      if (isChineseChar) {
        // Handle Chinese Character Input (IME)
        // If it matches target, Good. If not, Error but Advance (allow mistakes to pass).
        if (firstChar === targetChar) {
          tempIdx++;
        } else {
          if (!errors.includes(tempIdx)) errors.push(tempIdx);
          tempIdx++;
        }
        input = input.slice(1);
        hasAdvanced = true;
      } else {
        // Handle Pinyin/Wubi Code Input
        const currentAlpha = input.replace(/[^a-zA-Z]/g, '').toLowerCase(); // Loose check for matching
        const spaceIdx = input.indexOf(' ');

        if (currentAlpha.startsWith(targetCode) && targetCode.length > 0) {
          // Correct code prefix matched
          tempIdx++;
          // Consume the code letters from input. 
          // We iterate input to find the first N letters that match targetCode length.
          let lettersConsumed = 0;
          let cutIdx = 0;
          for (let i = 0; i < input.length; i++) {
             if (/[a-zA-Z]/.test(input[i])) lettersConsumed++;
             if (lettersConsumed === targetCode.length) {
               cutIdx = i + 1;
               break;
             }
          }
          input = input.slice(cutIdx);
          hasAdvanced = true;
        } else if (spaceIdx !== -1) {
          // User pressed Space, indicating "Skip" or "Confirm Wrong Code"
          // We consume everything up to the space
          if (!errors.includes(tempIdx)) errors.push(tempIdx);
          tempIdx++;
          input = input.slice(spaceIdx + 1);
          hasAdvanced = true;
        }
      }

      if (hasAdvanced && !settings.continuousMode) break;
    }

    const isFinished = tempIdx >= characters.length;
    setGameState(s => ({
      ...s,
      currentIndex: tempIdx,
      currentInput: input,
      errors,
      status: isFinished ? 'FINISHED' : 'PLAYING',
      endTime: isFinished ? Date.now() : null
    }));
  };

  const stats: TypingStats = (() => {
    if (!gameState.startTime || !gameState.content) return { wpm: 0, accuracy: 0, totalChars: 0, correctChars: 0, errors: 0, timeElapsed: 0 };
    const endTime = gameState.endTime || Date.now();
    const elapsed = (endTime - gameState.startTime) / 1000;
    const totalAttempted = gameState.currentIndex;
    const correct = totalAttempted - gameState.errors.length;
    return {
      wpm: elapsed > 0 ? (totalAttempted / 5) / (elapsed / 60) : 0,
      accuracy: totalAttempted > 0 ? (correct / totalAttempted) * 100 : 0,
      totalChars: totalAttempted,
      correctChars: correct,
      errors: gameState.errors.length,
      timeElapsed: Math.floor(elapsed)
    };
  })();

  useEffect(() => {
    if (gameState.status === 'FINISHED' && stats.wpm > 0) {
      // Pass the current mode to the history record
      setHistory(prev => [...prev, { wpm: stats.wpm, accuracy: stats.accuracy, date: new Date().toISOString(), mode: mode }]);
    }
  }, [gameState.status]);

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col font-sans overflow-auto md:overflow-hidden min-w-[400px] min-h-[600px]">
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} mode={mode} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} history={history} />
      
      {/* Error / Offline Prompt Modal */}
      <ErrorModal 
        isOpen={errorModalOpen} 
        onClose={() => setErrorModalOpen(false)}
        onRetry={() => {
          setErrorModalOpen(false);
          handleBatchCache(); // Retry update
        }}
        onFallback={startFallbackTask}
      />
      
      <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 h-14 flex-none flex items-center justify-between px-4 md:px-8 relative z-20">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Keyboard size={20} /></div>
          <div className="hidden md:block">
             <span className="font-bold text-lg block leading-none text-slate-800 dark:text-slate-100">打字大师</span>
          </div>
          <div className="md:hidden font-bold text-slate-800 dark:text-slate-100">打字大师</div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => handleModeSwitch(InputMode.PINYIN)} 
            className={`px-3 md:px-6 py-1 rounded-lg text-xs font-bold transition-all ${mode === InputMode.PINYIN ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            拼音
          </button>
          <button 
            onClick={() => handleModeSwitch(InputMode.WUBI)} 
            className={`px-3 md:px-6 py-1 rounded-lg text-xs font-bold transition-all ${mode === InputMode.WUBI ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            五笔
          </button>
        </div>

        <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowHistory(true)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="查看历史成绩"
            >
                <BarChart2 size={20} />
            </button>
            <button 
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="设置 API Key"
            >
                <Key size={20} />
            </button>
            <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
            >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-yellow-400" />}
            </button>
        </div>
      </header>

      <div className="bg-white/50 dark:bg-slate-900/50 border-b dark:border-slate-800 py-1.5 px-4 md:px-8 flex justify-between items-center text-[10px] md:text-[11px] flex-none">
         <div className="text-slate-400 dark:text-slate-500 font-bold truncate max-w-[50%]">
           模式: <span className="text-slate-600 dark:text-slate-300">{mode === InputMode.PINYIN ? '拼音 (中/英)' : '五笔 (86)'}</span>
         </div>
         <div className="flex items-center gap-4">
            <button 
              onClick={() => setSettings(s => ({...s, continuousMode: !s.continuousMode}))} 
              className={`flex items-center gap-2 px-2.5 py-1 rounded-full font-bold transition-all ${settings.continuousMode ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-slate-400 bg-slate-100 dark:bg-slate-800'}`}
            >
              <Zap size={12} className={settings.continuousMode ? 'fill-blue-600' : ''} /> 
              <span className="hidden md:inline">连打: </span>{settings.continuousMode ? '开' : '关'}
            </button>
            <button 
              onClick={() => setSettings(s => ({...s, keyboardVisible: !s.keyboardVisible}))} 
              className={`${settings.keyboardVisible ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}
            >
              <KbIcon size={16} />
            </button>
         </div>
      </div>

      <main className="flex-1 flex flex-col relative min-h-0">
        {gameState.status === 'IDLE' || gameState.status === 'FINISHED' ? (
          <div className="flex-1 overflow-y-auto w-full scrollbar-hide">
            <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-full p-4 md:p-6 animate-fade-in">
                {gameState.status === 'FINISHED' ? (
                  <div className="w-full py-4">
                    <StatsBoard stats={stats} history={history} />
                    <div className="flex justify-center mt-6 gap-4">
                       <button onClick={restartTask} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md transform hover:scale-105">
                         <RefreshCcw size={16} /> 再次练习
                       </button>
                       <button onClick={handleBack} className="px-6 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-sm font-bold flex items-center gap-2">
                         <Home size={16} /> 返回主页
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full text-center py-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">打字实操系统</h2>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mb-4">选择您的练习难度级别</p>
                    
                    {/* Offline Manager Bar */}
                    <div className="max-w-xl mx-auto mb-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-sm gap-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pl-2 flex-1 min-w-0">
                        <Database size={14} className={cacheStatus ? "text-emerald-500 shrink-0" : "text-slate-400 shrink-0"} />
                        <span className="truncate">{cacheStatus || "未检测到本地题库 (将使用内置数据)"}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative group">
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                             <ChevronDown size={12} />
                          </div>
                          <select 
                             value={modelId}
                             onChange={(e) => setModelId(e.target.value)}
                             disabled={caching}
                             className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] md:text-xs text-slate-600 dark:text-slate-300 rounded-lg pl-3 pr-7 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer disabled:opacity-50"
                             title="选择生成题库的 AI 模型"
                          >
                            {AVAILABLE_MODELS.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </div>
                        <button 
                          onClick={handleBatchCache} 
                          disabled={caching}
                          className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${caching ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-wait' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'}`}
                        >
                           {caching ? <Loader2 size={12} className="animate-spin"/> : <Download size={12}/>}
                           {caching ? '更新中...' : '更新'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 w-full">
                      {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map(d => {
                        const count = cacheCounts[Difficulty[d]] || 0;
                        return (
                          <button key={d} onClick={() => setDifficulty(Difficulty[d])} className={`group relative p-5 md:p-8 rounded-2xl border-2 transition-all ${difficulty === Difficulty[d] ? 'border-blue-500 bg-white dark:bg-slate-800 shadow-lg' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'}`}>
                            {count > 0 && (
                              <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded text-[10px] text-emerald-600 dark:text-emerald-400 font-bold" title={`本地已缓存 ${count} 套`}>
                                <CheckCircle size={10} />
                                <span>{count}</span>
                              </div>
                            )}
                            <div className={`text-lg md:text-xl font-bold mb-1 ${difficulty === Difficulty[d] ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{d === 'BEGINNER' ? '初级词语' : d === 'INTERMEDIATE' ? '中级句子' : '高级段落'}</div>
                            <div className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 leading-relaxed">{d === 'BEGINNER' ? '常用独立词汇' : d === 'INTERMEDIATE' ? '短句实操练习' : '深度文本段落'}</div>
                          </button>
                        )
                      })}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-6 w-full mb-8">
                       <button onClick={() => setShowTutorial(true)} className="w-full sm:w-auto px-8 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center gap-2">
                          <BookOpen size={16} /> 学习教程
                       </button>
                       <button onClick={startTask} disabled={loading || caching} className="w-full sm:w-auto px-12 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm">{loading || caching ? <Loader2 className="animate-spin" /> : '开始练习'}</button>
                       <button onClick={() => setShowHistory(true)} className="w-full sm:w-auto px-8 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400 text-sm flex items-center justify-center gap-2">
                          <BarChart2 size={16} /> 历史成绩
                       </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full min-h-0">
            {/* Context Header Area */}
            <div className="flex-none px-4 md:px-6 py-2 md:py-4 flex justify-between items-center z-10">
              <button onClick={handleBack} className="px-2 md:px-4 py-1.5 text-slate-400 hover:text-red-500 transition-all text-[10px] md:text-xs font-bold">
                <ArrowLeft size={12} className="inline mr-1"/> 返回
              </button>
              <div className="flex gap-4 md:gap-10 font-mono">
                <div className="flex flex-col items-center">
                   <span className="text-[8px] md:text-[9px] text-slate-300 dark:text-slate-700 uppercase font-black leading-none">速度</span>
                   <span className="text-sm md:text-xl font-bold text-slate-800 dark:text-slate-200 leading-none mt-1">{Math.round(stats.wpm)} <small className="text-[8px] md:text-[9px] text-slate-400 dark:text-slate-600">字/分</small></span>
                </div>
                <div className="flex flex-col items-center">
                   <span className="text-[8px] md:text-[9px] text-slate-300 dark:text-slate-700 uppercase font-black leading-none">准确率</span>
                   <span className="text-sm md:text-xl font-bold text-slate-800 dark:text-slate-200 leading-none mt-1">{Math.round(stats.accuracy)} <small className="text-[8px] md:text-[9px] text-slate-400 dark:text-slate-600">%</small></span>
                </div>
              </div>
            </div>
            
            {/* Practice Area */}
            <div className="flex-1 flex flex-col relative min-h-0 h-full">
              {gameState.status === 'LOADING' ? (
                <div className="absolute inset-0 grid place-items-center p-4">
                    <div className="flex flex-col items-center gap-6 p-8 md:p-10 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-sm w-full animate-in fade-in zoom-in duration-300">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full animate-ping opacity-30"></div>
                        <div className="bg-blue-50 dark:bg-blue-950 p-5 rounded-full relative">
                            <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={40} />
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">正在准备练习</h3>
                        {ContentCache.has(mode, difficulty) ? (
                            <p className="text-emerald-500 dark:text-emerald-400 text-sm font-bold">正在加载本地题库...</p>
                        ) : (
                            <p className="text-slate-400 dark:text-slate-500 text-sm leading-relaxed">正在加载<span className="text-blue-600 dark:text-blue-400 font-bold mx-1">{difficulty === Difficulty.BEGINNER ? '初级词语' : difficulty === Difficulty.INTERMEDIATE ? '中级句子' : '高级段落'}</span><br/>(离线模式)</p>
                        )}
                      </div>
                    </div>
                </div>
              ) : (
                <TypingArea 
                  gameState={gameState} 
                  onInputChange={handleInputChange} 
                  onComplete={() => setGameState(s => ({...s, status: 'FINISHED'}))} 
                  mode={mode} 
                  difficulty={difficulty} 
                  settings={settings} 
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;