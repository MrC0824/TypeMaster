export enum InputMode {
  PINYIN = 'PINYIN',
  WUBI = 'WUBI',
}

export enum Difficulty {
  BEGINNER = 'BEGINNER', // Simple words
  INTERMEDIATE = 'INTERMEDIATE', // Short sentences
  ADVANCED = 'ADVANCED', // Long paragraphs
}

export interface CharacterInfo {
  char: string;
  pinyin: string;
  wubi: string;
  explanation?: string;
}

export interface PracticeContent {
  id: string;
  text: string;
  characters: CharacterInfo[];
  translation?: string;
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  totalChars: number;
  correctChars: number;
  errors: number;
  timeElapsed: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  keyboardVisible: boolean;
  continuousMode: boolean;
}

export interface GameState {
  status: 'IDLE' | 'LOADING' | 'PLAYING' | 'FINISHED';
  currentInput: string;
  startTime: number | null;
  endTime?: number | null;
  currentIndex: number;
  errors: number[];
  content: PracticeContent | null;
}