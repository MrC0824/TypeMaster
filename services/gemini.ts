import { GoogleGenAI } from "@google/genai";
import { Difficulty, InputMode, PracticeContent, CharacterInfo } from "../types";

// Define available models for UI selection
export const AVAILABLE_MODELS = [
  { id: 'gemini-flash-lite-latest', name: 'Flash Lite (极速)', desc: '速度极快，适合快速生成' },
  { id: 'gemini-3-flash-preview', name: 'Flash 3.0 (均衡)', desc: '新一代标准，平衡速度与质量' },
  { id: 'gemini-3-pro-preview', name: 'Pro 3.0 (高智商)', desc: '逻辑最强，适合生成复杂段落' },
];

export const DEFAULT_MODEL = 'gemini-flash-lite-latest';

// Common Wubi 86 overrides to fix AI hallucinations. 
// AI often confuses 86/98 versions or similar looking chars (e.g. 老 ftx vs 者 ftj).
const WUBI_86_PATCH: Record<string, string> = {
  "老": "ftx", "师": "jgm", "考": "ftn", "者": "ftj", "教": "ftb",
  "电": "jnv", "脑": "ebh", "机": "sm", "器": "kkk", "学": "ipb", "习": "nud",
  "进": "fjp", "步": "hgr", "成": "dnn", "功": "et", "快": "nwk", "乐": "qii",
  "汉": "icy", "字": "pb", "语": "yg", "言": "y", "文": "yy",
  "打": "rsh", "练": "xrg", "简": "tuj", "单": "ujf", // 练 standard is xrg/anw depending on simpl. xrg is common 86
  "的": "rqy", "一": "g", "是": "jgh", "不": "i", "了": "b",
  "人": "w", "有": "e", "我": "q", "他": "w", "这": "p", "个": "wh",
  "们": "w", "中": "k", "来": "go", "上": "h", "大": "d", "国": "l",
  "今天": "wyn", "天气": "gd", "非常": "kh", "好": "vb", 
  "实": "pb", "践": "kh", "真": "fh", "理": "gj", 
  "唯": "kw", "准": "uw", "只": "kw", "精": "om", "髓": "me",
  "提": "rsh", "高": "ym", "效": "uy", "率": "yx"
};

// Fallback data for offline mode
const FALLBACK_DATA: Record<Difficulty, PracticeContent> = {
  [Difficulty.BEGINNER]: {
    id: 'fallback-beginner',
    text: '朋友学校水果老师咖啡天气因为运动手机简单很多漂亮',
    translation: 'Common words: Friend, School, Fruit, Teacher, Coffee, Weather, Because, Sports, Mobile Phone, Simple, Many, Beautiful',
    characters: [
      { char: '朋', pinyin: 'péng', wubi: 'ee', explanation: 'Friend' },
      { char: '友', pinyin: 'yǒu', wubi: 'dc', explanation: 'Friend' },
      { char: '学', pinyin: 'xué', wubi: 'ipb', explanation: 'Study' },
      { char: '校', pinyin: 'xiào', wubi: 'uqt', explanation: 'School' },
      { char: '水', pinyin: 'shuǐ', wubi: 'ii', explanation: 'Water' },
      { char: '果', pinyin: 'guǒ', wubi: 'js', explanation: 'Fruit' },
      { char: '老', pinyin: 'lǎo', wubi: 'ftx', explanation: 'Old' },
      { char: '师', pinyin: 'shī', wubi: 'jgm', explanation: 'Teacher' },
      { char: '咖', pinyin: 'kā', wubi: 'klk', explanation: 'Coffee' },
      { char: '啡', pinyin: 'fēi', wubi: 'kdj', explanation: 'Coffee' },
      { char: '天', pinyin: 'tiān', wubi: 'gd', explanation: 'Sky' },
      { char: '气', pinyin: 'qì', wubi: 'rnb', explanation: 'Air' },
      { char: '因', pinyin: 'yīn', wubi: 'ld', explanation: 'Cause' },
      { char: '为', pinyin: 'wèi', wubi: 'yl', explanation: 'For' },
      { char: '运', pinyin: 'yùn', wubi: 'fcp', explanation: 'Move' },
      { char: '动', pinyin: 'dòng', wubi: 'fc', explanation: 'Move' },
      { char: '手', pinyin: 'shǒu', wubi: 'r', explanation: 'Hand' },
      { char: '机', pinyin: 'jī', wubi: 'sm', explanation: 'Machine' },
      { char: '简', pinyin: 'jiǎn', wubi: 'tuj', explanation: 'Simple' },
      { char: '单', pinyin: 'dān', wubi: 'ujf', explanation: 'Single' },
      { char: '很', pinyin: 'hěn', wubi: 'tve', explanation: 'Very' },
      { char: '多', pinyin: 'duō', wubi: 'qq', explanation: 'Many' },
      { char: '漂', pinyin: 'piào', wubi: 'isf', explanation: 'Float' },
      { char: '亮', pinyin: 'liàng', wubi: 'ypm', explanation: 'Bright' },
    ]
  },
  [Difficulty.INTERMEDIATE]: {
    id: 'fallback-intermediate',
    text: '我想吃宫保鸡丁这家餐厅味道很好这里的川菜特别辣',
    translation: 'I want to eat Kung Pao Chicken, this restaurant tastes good, the Sichuan food here is very spicy.',
    characters: [
      { char: '我', pinyin: 'wǒ', wubi: 'tr', explanation: 'I' },
      { char: '想', pinyin: 'xiǎng', wubi: 'sh', explanation: 'Want' },
      { char: '吃', pinyin: 'chī', wubi: 'kzn', explanation: 'Eat' },
      { char: '宫', pinyin: 'gōng', wubi: 'kk', explanation: 'Palace' },
      { char: '保', pinyin: 'bǎo', wubi: 'wks', explanation: 'Protect' },
      { char: '鸡', pinyin: 'jī', wubi: 'cq', explanation: 'Chicken' },
      { char: '丁', pinyin: 'dīng', wubi: 'sh', explanation: 'Cube' },
      { char: '这', pinyin: 'zhè', wubi: 'ypi', explanation: 'This' },
      { char: '家', pinyin: 'jiā', wubi: 'pe', explanation: 'Family' },
      { char: '餐', pinyin: 'cān', wubi: 'hqc', explanation: 'Meal' },
      { char: '厅', pinyin: 'tīng', wubi: 'djk', explanation: 'Hall' },
      { char: '味', pinyin: 'wèi', wubi: 'kfy', explanation: 'Taste' },
      { char: '道', pinyin: 'dào', wubi: 'uth', explanation: 'Way' },
      { char: '很', pinyin: 'hěn', wubi: 'tve', explanation: 'Very' },
      { char: '好', pinyin: 'hǎo', wubi: 'vb', explanation: 'Good' },
      { char: '这', pinyin: 'zhè', wubi: 'ypi', explanation: 'This' },
      { char: '里', pinyin: 'lǐ', wubi: 'jf', explanation: 'Inside' },
      { char: '的', pinyin: 'de', wubi: 'rqy', explanation: 'Of' },
      { char: '川', pinyin: 'chuān', wubi: 'kth', explanation: 'River' },
      { char: '菜', pinyin: 'cài', wubi: 'aes', explanation: 'Dish' },
      { char: '特', pinyin: 'tè', wubi: 'trf', explanation: 'Special' },
      { char: '别', pinyin: 'bié', wubi: 'kfj', explanation: 'Difference' },
      { char: '辣', pinyin: 'là', wubi: 'ugi', explanation: 'Spicy' },
    ]
  },
  [Difficulty.ADVANCED]: {
    id: 'fallback-advanced',
    text: '苍翠群山连绵起伏云雾缭绕其间潺潺溪流穿梭于幽邃林壑微风拂过繁花似锦沁人心脾',
    translation: 'Verdant mountains rolling endlessly, mist winding within, a babbling brook shuttling through deep forest ravines. A breeze brushes past, flowers blooming like brocade, refreshing the heart.',
    characters: [
      { char: '苍', pinyin: 'cāng', wubi: 'wbk', explanation: 'Deep Green' },
      { char: '翠', pinyin: 'cuì', wubi: 'nyf', explanation: 'Emerald' },
      { char: '群', pinyin: 'qún', wubi: 'vtk', explanation: 'Crowd/Group' },
      { char: '山', pinyin: 'shān', wubi: 'm', explanation: 'Mountain' },
      { char: '连', pinyin: 'lián', wubi: 'lpk', explanation: 'Link' },
      { char: '绵', pinyin: 'mián', wubi: 'xrm', explanation: 'Continuous' },
      { char: '起', pinyin: 'qǐ', wubi: 'fh', explanation: 'Rise' },
      { char: '伏', pinyin: 'fú', wubi: 'wdy', explanation: 'Subside' },
      { char: '云', pinyin: 'yún', wubi: 'fcu', explanation: 'Cloud' },
      { char: '雾', pinyin: 'wù', wubi: 'fl', explanation: 'Fog' },
      { char: '缭', pinyin: 'liáo', wubi: 'xdu', explanation: 'Wind Around' },
      { char: '绕', pinyin: 'rào', wubi: 'xat', explanation: 'Coil' },
      { char: '其', pinyin: 'qí', wubi: 'adw', explanation: 'Its' },
      { char: '间', pinyin: 'jiān', wubi: 'uj', explanation: 'Between' },
      { char: '潺', pinyin: 'chán', wubi: 'inb', explanation: 'Murmur' },
      { char: '潺', pinyin: 'chán', wubi: 'inb', explanation: 'Murmur' },
      { char: '溪', pinyin: 'xī', wubi: 'iex', explanation: 'Creek' },
      { char: '流', pinyin: 'liú', wubi: 'iyc', explanation: 'Flow' },
      { char: '穿', pinyin: 'chuān', wubi: 'pwa', explanation: 'Pierce' },
      { char: '梭', pinyin: 'suō', wubi: 'scw', explanation: 'Shuttle' },
      { char: '于', pinyin: 'yú', wubi: 'gf', explanation: 'At' },
      { char: '幽', pinyin: 'yōu', wubi: 'xx', explanation: 'Quiet' },
      { char: '邃', pinyin: 'suì', wubi: 'pue', explanation: 'Deep' },
      { char: '林', pinyin: 'lín', wubi: 'ss', explanation: 'Forest' },
      { char: '壑', pinyin: 'hè', wubi: 'hpf', explanation: 'Gully' },
      { char: '微', pinyin: 'wēi', wubi: 'tmg', explanation: 'Tiny' },
      { char: '风', pinyin: 'fēng', wubi: 'mq', explanation: 'Wind' },
      { char: '拂', pinyin: 'fú', wubi: 'rxj', explanation: 'Whisk' },
      { char: '过', pinyin: 'guò', wubi: 'fp', explanation: 'Pass' },
      { char: '繁', pinyin: 'fán', wubi: 'tx', explanation: 'Complicated' },
      { char: '花', pinyin: 'huā', wubi: 'awx', explanation: 'Flower' },
      { char: '似', pinyin: 'sì', wubi: 'wny', explanation: 'Like' },
      { char: '锦', pinyin: 'jǐn', wubi: 'qrm', explanation: 'Brocade' },
      { char: '沁', pinyin: 'qìn', wubi: 'iny', explanation: 'Seep' },
      { char: '人', pinyin: 'rén', wubi: 'w', explanation: 'Person' },
      { char: '心', pinyin: 'xīn', wubi: 'n', explanation: 'Heart' },
      { char: '脾', pinyin: 'pí', wubi: 'ert', explanation: 'Spleen' },
    ]
  }
};

const applyWubiPatch = (char: string, originalCode: string): string => {
  // If we have a hardcoded correction, use it.
  if (WUBI_86_PATCH[char]) return WUBI_86_PATCH[char];
  
  // If no patch, return original (lowercase/trimmed)
  return originalCode.toLowerCase().trim();
};

const getEffectiveApiKey = (): string | undefined => {
  // 1. Check for user-provided key in localStorage
  if (typeof window !== 'undefined') {
    const userKey = localStorage.getItem('USER_API_KEY');
    if (userKey && userKey.trim().length > 0) {
      return userKey.trim();
    }
  }
  // 2. Fallback to build-time env variable
  return process.env.API_KEY;
};

export const getFallbackContent = (mode: InputMode, difficulty: Difficulty): PracticeContent => {
  return FALLBACK_DATA[difficulty];
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Use a minimal token request to validate using default model
    await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: 'Test',
    });
    return true;
  } catch (error) {
    console.error("API Key Validation Error:", error);
    return false;
  }
};

export const generatePracticeContent = async (
  mode: InputMode,
  difficulty: Difficulty,
  modelName: string = DEFAULT_MODEL // Allow dynamic model selection
): Promise<PracticeContent> => {
  // Add randomization parameters to prompt to ensure variety
  const themes = [
    "nature", "technology", "daily life", "culture", "history", 
    "travel", "food", "emotion", "science", "space", 
    "ocean", "music", "art", "philosophy", "business"
  ];
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];
  const timestamp = Date.now();
  const salt = Math.random().toString(36).substring(7);

  // Refined instructions to clearly distinguish levels
  const instruction = difficulty === Difficulty.BEGINNER 
    ? "list of 12 distinct, common, unrelated 2-character words (total 24 chars). Example: 苹果, 电脑, 学习" 
    : (difficulty === Difficulty.INTERMEDIATE ? `3 short conversational sentences about ${randomTheme} (total ~25 chars).` : `a complex paragraph about ${randomTheme} with advanced vocabulary (approx 50 chars)`);

  const prompt = `
    Role: Chinese Typing Teacher.
    Goal: Create ${difficulty} level content for ${mode} practice.
    Format: ${instruction}.
    Topic: ${randomTheme} (Ensure variety)
    Random Seed: ${timestamp}-${salt}
    
    CRITICAL:
    1. No punctuation. No spaces. Just Hanzi.
    2. Respond strictly in JSON format.
    3. Ensure pinyin and wubi 86 are accurate for each character.
    4. IF BEGINNER: The output MUST be a list of random words, NOT a coherent sentence.
    
    STRICT WUBI 86 RULES:
    - Verify codes against standard Wubi 86 (Microsoft Wubi). 
    - Common traps: 老=ftx (NOT ftj), 师=jgm, 考=ftn.
    - Provide at least first 3 codes if full code is long.
    
    JSON Schema:
    {
      "text": "汉字串",
      "translation": "English meaning",
      "data": [ ["汉", "hàn", "icy", "水+又"], ["字", "zì", "pb", "宝盖+子"] ]
    }
  `;

  try {
    const apiKey = getEffectiveApiKey();
    if (!apiKey) {
      throw new Error("请先在设置中配置 Gemini API Key");
    }

    // Initialize AI inside try-catch with the resolved key
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: modelName, // Use selected model
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || '{}');
    const characters: CharacterInfo[] = data.data.map((item: any) => ({
      char: item[0],
      pinyin: item[1] || '',
      wubi: applyWubiPatch(item[0], item[2] || ''), // Apply correction patch here
      explanation: item[3] || ''
    }));

    return {
      id: `${timestamp}-${salt}`,
      text: characters.map(c => c.char).join(''),
      characters,
      translation: data.translation
    };
  } catch (error) {
    console.error("AI Generation Failed:", error);
    // REMOVED FALLBACK to enforce API usage
    throw error;
  }
};