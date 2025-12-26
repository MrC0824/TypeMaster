import React from 'react';

interface VirtualKeyboardProps {
  activeKey: string | null; // The key the user just pressed
  nextKey: string | null;   // The key the user SHOULD press next
  visible: boolean;
}

const KEYS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ activeKey, nextKey, visible }) => {
  if (!visible) return null;

  const getKeyStyle = (keyChar: string) => {
    const isNext = nextKey && nextKey.toUpperCase() === keyChar;
    const isActive = activeKey && activeKey.toUpperCase() === keyChar;

    let base = "w-[8.5vw] h-9 sm:w-8 sm:h-11 md:w-10 md:h-12 lg:w-12 lg:h-12 flex items-center justify-center rounded md:rounded-lg font-bold text-[10px] sm:text-xs md:text-sm lg:text-base transition-all duration-75 shadow-sm border-b-2 ";
    
    if (isActive) {
      return base + "bg-slate-300 dark:bg-slate-700 border-slate-400 dark:border-slate-600 text-slate-700 dark:text-slate-200 transform translate-y-0.5 border-b-0";
    }
    if (isNext) {
      return base + "bg-blue-500 dark:bg-blue-600 border-blue-700 dark:border-blue-800 text-white shadow-blue-200 dark:shadow-blue-900/40 scale-105 z-10";
    }
    return base + "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500";
  };

  return (
    <div className="flex flex-col items-center gap-1 md:gap-2 select-none w-full px-1">
      {KEYS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 md:gap-1.5 lg:gap-2">
          {row.map((keyChar) => (
            <div
              key={keyChar}
              className={getKeyStyle(keyChar)}
            >
              {keyChar}
            </div>
          ))}
        </div>
      ))}
      {/* Space Bar */}
      <div className="mt-1 w-full flex justify-center">
         <div className={`h-9 md:h-12 w-32 sm:w-56 md:w-64 rounded-lg border-b-2 flex items-center justify-center transition-all duration-75 ${activeKey === ' ' ? 'bg-slate-300 dark:bg-slate-700 border-b-0 translate-y-0.5' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
            <span className="text-[9px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-widest">空格</span>
         </div>
      </div>
    </div>
  );
};

export default VirtualKeyboard;