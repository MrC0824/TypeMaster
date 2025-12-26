import React, { useEffect, useRef, useState } from 'react';
import { CharacterInfo, GameState, InputMode, GameSettings, Difficulty } from '../types.ts';
import { Check, Info, WifiOff, Target } from 'lucide-react';
import VirtualKeyboard from './VirtualKeyboard.tsx';

interface TypingAreaProps {
  gameState: GameState;
  onInputChange: (value: string, isComposing: boolean) => void;
  onComplete: () => void;
  mode: InputMode;
  difficulty: Difficulty;
  settings: GameSettings;
}

const TypingArea: React.FC<TypingAreaProps> = ({ gameState, onInputChange, onComplete, mode, difficulty, settings }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);
  const [isComposing, setIsComposing] = useState(false);
  const { content, currentInput, status, currentIndex, errors } = gameState;

  useEffect(() => {
    if (status === 'PLAYING') {
      inputRef.current?.focus();
    }
  }, [status, currentIndex]);

  const normalize = (s: string) => s.replace(/ü/g, 'v').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, '');

  const currentCharData = content?.characters[currentIndex];
  const targetCode = currentCharData ? normalize(mode === InputMode.PINYIN ? currentCharData.pinyin : currentCharData.wubi) : "";

  const handleCompositionStart = () => {
    isComposingRef.current = true;
    setIsComposing(true);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    setIsComposing(false);
    onInputChange(e.currentTarget.value, false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onInputChange(e.target.value, isComposingRef.current);
  };

  // Aggressive sizing and spacing to keep content compact
  const getSizing = () => {
    switch (difficulty) {
      case Difficulty.ADVANCED:
        return {
          charBox: "w-5 md:w-8 lg:w-9",
          charText: "text-base md:text-xl lg:text-2xl",
          pinyinText: "text-[6px] md:text-[8px] lg:text-[9px]",
          gapY: "gap-y-10 md:gap-y-14", 
          gapX: "gap-x-1 md:gap-x-2",
          indicatorOffset: "-bottom-5 md:-bottom-7"
        };
      case Difficulty.INTERMEDIATE:
        return {
          charBox: "w-7 md:w-10 lg:w-12",
          charText: "text-xl md:text-3xl lg:text-4xl",
          pinyinText: "text-[7px] md:text-[9px] lg:text-[10px]",
          gapY: "gap-y-12 md:gap-y-16",
          gapX: "gap-x-1.5 md:gap-x-3.5",
          indicatorOffset: "-bottom-6 md:-bottom-9"
        };
      default: // BEGINNER
        return {
          charBox: "w-7 md:w-10 lg:w-12",
          charText: "text-xl md:text-3xl lg:text-4xl",
          pinyinText: "text-[7px] md:text-[9px] lg:text-[10px]",
          // Grid gap handling for beginner
          gridGap: "gap-y-8 md:gap-y-12 gap-x-2 md:gap-x-6",
          gapY: "gap-y-12 md:gap-y-16", // fallback for flex (unused in grid)
          gapX: "gap-x-1.5 md:gap-x-3.5", // fallback for flex
          indicatorOffset: "-bottom-6 md:-bottom-9"
        };
    }
  };

  const styles = getSizing();

  const renderChar = (c: CharacterInfo, idx: number, isWordEndOverride: boolean = false) => {
      const isActive = idx === currentIndex;
      const isDone = idx < currentIndex;
      const isError = errors.includes(idx);
      const displayLabel = mode === InputMode.PINYIN ? c.pinyin : c.wubi;
      
      // Margin logic only applies to non-grid layouts (Intermediate/Advanced)
      // or if we passed specific override (though Grid handles spacing via gap)
      const isWordEnd = !isWordEndOverride && difficulty === Difficulty.BEGINNER && (idx + 1) % 2 === 0 && idx !== (content?.characters.length || 0) - 1;

      return (
        <div key={idx} className={`relative flex flex-col items-center ${styles.charBox} transition-all duration-300 ${isActive ? 'scale-110 z-10' : ''} ${isWordEnd ? 'mr-1 md:mr-6' : ''}`}>
          
          <div className={`h-2 md:h-4 ${styles.pinyinText} font-bold font-mono mb-0.5 tracking-tighter uppercase transition-colors whitespace-nowrap ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
            {displayLabel}
          </div>
          
          <div className={`relative ${styles.charText} font-bold pb-0.5 transition-all leading-none select-none ${
            isActive 
              ? 'text-blue-600 dark:text-blue-400' 
              : isDone 
                ? (isError ? 'text-red-400 dark:text-red-600 line-through opacity-70' : 'text-emerald-500 dark:text-emerald-400') 
                : 'text-slate-500 dark:text-slate-500'
          }`}>
            {c.char}
            {isActive && (
              <div className="absolute -bottom-0.5 left-0 w-full h-0.5 md:h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            )}
          </div>

          {isActive && (
            <div className={`absolute ${styles.indicatorOffset} flex flex-col items-center w-max z-20`}>
              <div className="flex gap-0.5 bg-white/95 dark:bg-slate-800/95 p-0.5 rounded shadow-sm border border-slate-100 dark:border-slate-700">
                {targetCode.split('').map((letter, lIdx) => {
                  const typed = normalize(currentInput)[lIdx];
                  const isCorrect = typed === letter;
                  return (
                    <div 
                      key={lIdx} 
                      className={`w-2 h-3 md:w-4 md:h-6 flex items-center justify-center rounded text-[6px] md:text-[10px] font-black font-mono border transition-all ${
                        !typed 
                          ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-200 dark:text-slate-700' 
                          : isCorrect 
                            ? 'bg-blue-500 dark:bg-blue-600 border-blue-500 text-white' 
                            : 'bg-red-500 dark:bg-red-600 border-red-500 text-white animate-shake'
                      }`}
                    >
                      {typed || letter}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
  };

  // Helper to chunk array for Grid layout
  const chunkArray = (arr: any[], size: number) => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );
  };

  return (
    <div className="h-full w-full flex flex-col items-center px-2 md:px-4 overflow-hidden" onClick={() => inputRef.current?.focus()}>
      
      {/* Small Header */}
      <div className="flex-none flex flex-col items-center pt-1 pb-0.5">
        <div className="mb-0.5 flex items-center gap-2 animate-fade-in scale-90 md:scale-100">
           <span className={`px-1.5 py-0.5 rounded text-[8px] md:text-[10px] font-bold uppercase tracking-wider ${mode === InputMode.PINYIN ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'}`}>
             {mode === InputMode.PINYIN ? '拼音' : '五笔'}
           </span>
           <span className="text-slate-300 dark:text-slate-700">/</span>
           <span className="text-slate-600 dark:text-slate-400 font-medium text-[9px] md:text-xs flex items-center gap-1">
             <Target size={11} className="text-slate-400 dark:text-slate-600"/>
             {difficulty === Difficulty.BEGINNER ? '初级' : 
              difficulty === Difficulty.INTERMEDIATE ? '中级' : '高级'}
           </span>
        </div>

        {content?.translation && (
          <div className="text-slate-400 dark:text-slate-500 italic text-[8px] md:text-[11px] text-center font-medium max-w-2xl leading-tight px-4 opacity-70 line-clamp-1">
            "{content.translation}"
          </div>
        )}
      </div>

      {/* Main Display - Container box adapts its height to content */}
      <div className="flex-1 w-full min-h-0 flex flex-col items-center py-1 md:py-2 px-1 justify-center overflow-hidden">
        <div className="bg-white dark:bg-slate-900 rounded-xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 w-full max-w-7xl h-auto max-h-full flex flex-col relative transition-colors duration-300">
          
          <div className={`p-4 md:p-8 lg:p-12 w-full h-full overflow-y-auto scrollbar-hide flex flex-col justify-center`}>
            {difficulty === Difficulty.BEGINNER && content ? (
              // GRID LAYOUT FOR BEGINNER (Words)
              // 3 cols on mobile (3 words/line), 6 cols on desktop (6 words/line)
              <div className={`grid grid-cols-3 md:grid-cols-6 ${styles.gridGap} justify-items-center items-center content-center mx-auto`}>
                 {chunkArray(content.characters, 2).map((word, wIdx) => (
                   <div key={wIdx} className="flex gap-0.5 md:gap-1">
                      {word.map((c: CharacterInfo, cOffset: number) => 
                        renderChar(c, wIdx * 2 + cOffset, true) // Pass true to disable extra margin in grid
                      )}
                   </div>
                 ))}
              </div>
            ) : (
              // FLEX LAYOUT FOR SENTENCES
              <div className={`flex flex-wrap ${styles.gapY} ${styles.gapX} justify-center items-center content-center`}>
                {content?.characters.map((c, idx) => renderChar(c, idx))}
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onChange={handleChange}
            className="absolute inset-0 opacity-0 cursor-default caret-transparent"
            autoComplete="off"
            autoFocus
          />
        </div>
      </div>

      <div className={`flex-none w-full transition-all duration-300 ease-in-out ${settings.keyboardVisible ? 'opacity-100 pb-1.5 md:pb-3' : 'h-0 opacity-0 overflow-hidden invisible'}`}>
        <VirtualKeyboard 
          activeKey={currentInput.length > 0 ? currentInput[currentInput.length - 1] : null} 
          nextKey={targetCode[normalize(currentInput).length] || null} 
          visible={true} 
        />
      </div>

      {status === 'FINISHED' && (
        <div className="absolute inset-0 bg-slate-50/60 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-40 animate-in fade-in duration-300">
          <button 
            onClick={onComplete} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold shadow-2xl shadow-blue-500/40 flex items-center gap-3 transform hover:scale-105 transition-all"
          >
            练习完毕 <Check size={22} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TypingArea;