export type DifficultyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface VocabularyItem {
  id: string;
  vietnamese: string;
  chinese: string;
  pinyin: string;
  phonetic: string;
  hanViet: string;
  difficulty?: DifficultyLevel;
  audioUrl?: string;
}
