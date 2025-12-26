import React from 'react';
import { InputMode } from '../types';
import { X, BookOpen, Grid3X3 } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: InputMode;
}

const WUBI_ZONES = [
  {
    name: "一区 横 (1)",
    color: "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-900 dark:text-red-100",
    keyColor: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    keys: [
      { code: 'G', num: '11', roots: '王旁青头戋五一' },
      { code: 'F', num: '12', roots: '土士二干十寸雨' },
      { code: 'D', num: '13', roots: '大犬三（羊）古石厂' },
      { code: 'S', num: '14', roots: '木丁西' },
      { code: 'A', num: '15', roots: '工戈草头右框七' },
    ]
  },
  {
    name: "二区 竖 (2)",
    color: "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 text-green-900 dark:text-green-100",
    keyColor: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
    keys: [
      { code: 'H', num: '21', roots: '目具上止卜虎皮' },
      { code: 'J', num: '22', roots: '日早两竖与虫依' },
      { code: 'K', num: '23', roots: '口与川，字根稀' },
      { code: 'L', num: '24', roots: '田甲方框四车力' },
      { code: 'M', num: '25', roots: '山由贝，下框几' },
    ]
  },
  {
    name: "三区 撇 (3)",
    color: "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30 text-blue-900 dark:text-blue-100",
    keyColor: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    keys: [
      { code: 'T', num: '31', roots: '禾竹一撇双人立' },
      { code: 'R', num: '32', roots: '白手看头三二斤' },
      { code: 'E', num: '33', roots: '月彡（衫）乃用家衣底' },
      { code: 'W', num: '34', roots: '人八登祭头部几' },
      { code: 'Q', num: '35', roots: '金勺缺点无尾鱼' },
    ]
  },
  {
    name: "四区 捺 (4)",
    color: "bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-900/30 text-purple-900 dark:text-purple-100",
    keyColor: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
    keys: [
      { code: 'Y', num: '41', roots: '言文方广在四一' },
      { code: 'U', num: '42', roots: '立辛两点六门疒' },
      { code: 'I', num: '43', roots: '水旁兴头小倒氽' },
      { code: 'O', num: '44', roots: '火业头，四点米' },
      { code: 'P', num: '45', roots: '之字军盖道建底' },
    ]
  },
  {
    name: "五区 折 (5)",
    color: "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/30 text-yellow-900 dark:text-yellow-100",
    keyColor: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
    keys: [
      { code: 'N', num: '51', roots: '已半巳满不出己' },
      { code: 'B', num: '52', roots: '子耳了也框向上' },
      { code: 'V', num: '53', roots: '女刀九臼山朝西' },
      { code: 'C', num: '54', roots: '又巴马，丢矢矣' },
      { code: 'X', num: '55', roots: '慈母无心弓和匕' },
    ]
  }
];

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, mode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
              <BookOpen size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {mode === InputMode.PINYIN ? '拼音输入法教程' : '五笔字型教程'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Text Guide Section */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {mode === InputMode.PINYIN ? (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-100">基础规则</h3>
                  <p className="text-slate-600 dark:text-slate-400">拼音输入法是利用汉字的读音进行输入。主要由声母（Initial）和韵母（Final）组成。</p>
                  <ul className="list-disc list-inside mt-2 text-slate-600 dark:text-slate-400 space-y-1">
                    <li><strong>全拼：</strong>输入完整的拼音，如 "zhong" → "中"。</li>
                    <li><strong>简拼：</strong>只输入声母，如 "zh" 或 "z" 可能提示 "中"。</li>
                    <li><strong>双拼：</strong>将声母和韵母各映射到一个按键上（进阶）。</li>
                  </ul>
                </div>
                <div className="flex gap-4">
                   <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300">练习技巧</h4>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">看着屏幕上的拼音提示，尝试不仅记住字母，还要建立声音与按键的反射。</p>
                   </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                 <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-100">五笔字型 (86版) 基础</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-2">五笔通过汉字的笔画结构进行编码。键盘分为5个区，每个区有5个键。记忆口诀是掌握五笔的关键。</p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg flex items-center gap-2 dark:text-slate-100">
                    <Grid3X3 size={20} className="text-blue-600 dark:text-blue-400"/> 
                    五笔86版 字根助记词表
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {WUBI_ZONES.map((zone) => (
                      <div key={zone.name} className={`rounded-xl border p-4 ${zone.color} border-opacity-50`}>
                        <h4 className="font-bold mb-3 pb-2 border-b border-black/5 dark:border-white/5">{zone.name}</h4>
                        <div className="space-y-2">
                          {zone.keys.map((key) => (
                            <div key={key.code} className="flex items-start gap-3 text-sm">
                              <div className={`w-8 h-8 flex-shrink-0 flex flex-col items-center justify-center rounded font-mono font-bold ${zone.keyColor}`}>
                                <span className="text-lg leading-none">{key.code}</span>
                                <span className="text-[10px] leading-none opacity-70">{key.num}</span>
                              </div>
                              <div className="pt-0.5">
                                <span className="font-medium opacity-90">{key.roots}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                   <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
                      <h4 className="font-semibold text-emerald-800 dark:text-emerald-300">拆字原则</h4>
                      <ul className="list-disc list-inside mt-2 text-sm text-emerald-700 dark:text-emerald-400 space-y-1">
                        <li><strong>书写顺序：</strong>先左后右，先上后下，先横后竖，先撇后捺。</li>
                        <li><strong>取大优先：</strong>尽可能取笔画多的字根。</li>
                        <li><strong>兼顾直观：</strong>拆出的字根要有较好的直观性。</li>
                        <li><strong>能连不交：</strong>字根之间能连在一起就不相交。</li>
                      </ul>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-right transition-colors duration-300">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;