import React, { useState, useEffect, useLayoutEffect } from 'react';
import { TypingStats, InputMode } from '../types';
import { Activity, Target, Zap, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StatsBoardProps {
  stats?: TypingStats;
  history: { wpm: number; accuracy: number; date: string; mode?: InputMode }[];
}

const StatsBoard: React.FC<StatsBoardProps> = ({ stats, history }) => {
  const isHistoryOnly = !stats;
  // 渲染锁：确保布局计算完毕再显示图表
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  
  const dataLimit = isHistoryOnly ? 30 : 10;
  const startIndex = Math.max(0, history.length - dataLimit);

  const data = history.slice(-dataLimit).map((h, i) => ({
    name: `第 ${startIndex + i + 1} 次`,
    "字/分": Math.round(h.wpm),
    accuracy: Math.round(h.accuracy),
    mode: h.mode
  }));

  const isDarkMode = window.document.documentElement.classList.contains('dark');

  // 使用 useLayoutEffect 确保拦截器比 Recharts 跑得快
  useLayoutEffect(() => {
    const originalWarn = console.warn;
    const originalError = console.error;

    const shouldSuppress = (args: any[]) => {
      const msg = args[0];
      if (typeof msg !== 'string') return false;
      return (
        msg.includes('chart should be greater than 0') ||
        msg.includes('width(-1)') ||
        msg.includes('height(-1)') || 
        msg.includes('width(0)')
      );
    };

    console.warn = (...args) => {
      if (!shouldSuppress(args)) originalWarn(...args);
    };

    console.error = (...args) => {
      if (!shouldSuppress(args)) originalError(...args);
    };

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  // 使用 requestAnimationFrame 确保父容器已有尺寸
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsLayoutReady(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const getAccuracyColor = (acc: number) => {
    if (acc >= 90) return isDarkMode ? '#34d399' : '#16a34a';
    if (acc >= 60) return isDarkMode ? '#facc15' : '#ca8a04';
    return isDarkMode ? '#f87171' : '#dc2626';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const modeName = payload[0].payload.mode === InputMode.WUBI ? '五笔' : '拼音';
      const modeColor = payload[0].payload.mode === InputMode.WUBI ? '#10b981' : '#3b82f6';
      const accuracy = payload[0].payload.accuracy;
      
      return (
        <div style={{
          backgroundColor: isDarkMode ? '#0f172a' : '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          padding: '12px',
          borderRadius: '8px',
          color: isDarkMode ? '#f1f5f9' : '#0f172a',
          minWidth: '120px'
        }}>
          <p className="font-bold text-sm mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">{label || '本次练习'}</p>
          <div className="flex items-center justify-between gap-4 mb-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">模式</span>
            <span className="text-xs font-bold" style={{ color: modeColor }}>{modeName}</span>
          </div>
          <div className="flex items-center justify-between gap-4 mb-1.5">
             <span className="text-xs text-slate-500 dark:text-slate-400">速度</span>
             <span className="text-xs font-medium">{payload[0].value} 字/分</span>
          </div>
          <div className="flex items-center justify-between gap-4">
             <span className="text-xs text-slate-500 dark:text-slate-400">准确率</span>
             <span className="text-xs font-bold" style={{ color: getAccuracyColor(accuracy) }}>{accuracy}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`grid grid-cols-1 ${isHistoryOnly ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6 w-full max-w-5xl mx-auto animate-fade-in`}>
      {/* 统计面板代码保持不变... */}
      {!isHistoryOnly && stats && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 lg:col-span-1 flex flex-col justify-between transition-colors duration-300">
           {/* ...stats content... */}
           <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="text-blue-500" size={20} /> 本轮统计
          </h3>
          <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                  <div className="text-slate-500 dark:text-slate-400 text-sm mb-1 flex items-center gap-1"><Zap size={14}/> 速度</div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{Math.round(stats.wpm)}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                  <div className="text-slate-500 dark:text-slate-400 text-sm mb-1 flex items-center gap-1"><Target size={14}/> 准确率</div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{Math.round(stats.accuracy)}%</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                  <div className="text-slate-500 dark:text-slate-400 text-sm mb-1 flex items-center gap-1"><Clock size={14}/> 用时</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.timeElapsed}s</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                  <div className="text-slate-500 dark:text-slate-400 text-sm mb-1">错字数</div>
                  <div className="text-2xl font-bold text-red-500">{stats.errors}</div>
              </div>
          </div>
        </div>
      )}

      {/* History Chart */}
      <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 ${isHistoryOnly ? 'lg:col-span-1' : 'lg:col-span-2'} transition-colors duration-300 flex flex-col min-w-0`}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
             <TrendingUp size={20} className={isHistoryOnly ? "text-blue-500" : "text-slate-400"} />
             历史趋势
          </h3>
          <div className="flex gap-3 text-[10px] font-bold">
             <div className="flex items-center gap-1.5">
               <div className="w-2.5 h-2.5 rounded bg-blue-500 dark:bg-blue-600"></div>
               <span className="text-slate-500 dark:text-slate-400">拼音</span>
             </div>
             <div className="flex items-center gap-1.5">
               <div className="w-2.5 h-2.5 rounded bg-emerald-500 dark:bg-emerald-600"></div>
               <span className="text-slate-500 dark:text-slate-400">五笔</span>
             </div>
          </div>
        </div>
        
        {data.length > 0 ? (
          /* 采用绝对定位布局 配合 minWidth 属性 */
          <div className="w-full h-64 lg:h-72 relative" style={{ minHeight: '256px' }}>
              <div className="absolute inset-0">
                  {/* 等待 rAF 完成后再渲染 */}
                  {isLayoutReady && (
                    <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0} minHeight={0}>
                        <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" hide />
                            <YAxis tick={{fontSize: 10}} stroke={isDarkMode ? '#475569' : '#cbd5e1'} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: isDarkMode ? '#1e293b' : '#f1f5f9'}} />
                            <Bar dataKey="字/分" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                {data.map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={
                                        entry.mode === InputMode.WUBI 
                                          ? (isDarkMode ? '#059669' : '#10b981')
                                          : (isDarkMode ? '#3b82f6' : '#3b82f6')
                                      } 
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                  )}
              </div>
          </div>
        ) : (
          <div className="h-64 lg:h-72 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-2">
            <Activity size={40} strokeWidth={1} />
            <p className="text-sm">暂无历史数据，完成一次练习后查看</p>
          </div>
        )}
        
        <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-2">
          打字速度 - 字/分 (最近{dataLimit}次)
        </p>
      </div>
    </div>
  );
};

export default StatsBoard;