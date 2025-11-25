export type DifficultyLevel = 'HSK1' | 'HSK2' | 'HSK3' | 'HSK4' | 'HSK5';

export interface VocabularyItem {
  id: string;
  vietnamese: string;
  chinese: string;
  pinyin: string;
  phonetic: string;
  hanViet: string;
  difficulty: DifficultyLevel;
  audioUrl?: string;
}
