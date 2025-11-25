import { LevelBucket, LevelKey } from './vocabulary';
import { VocabularyItem } from '../types';

const DEFAULT_SOURCE = '/hsk-academy.json';

const keyByLevelNumber: Record<number, LevelKey> = {
  1: 'HSK1',
  2: 'HSK2',
  3: 'HSK3',
  4: 'HSK4',
  5: 'HSK5',
};

const labelByKey: Record<LevelKey, string> = {
  HSK1: 'HSK 1',
  HSK2: 'HSK 2',
  HSK3: 'HSK 3',
  HSK4: 'HSK 4',
  HSK5: 'HSK 5',
};

type HskAcademyEntry = {
  level: number;
  simplified: string;
  pinyin: string;
  translation_vi?: string;
  translation_en?: string;
};

interface HskAcademyPayload {
  levels: {
    level: number;
    label?: string;
    words: HskAcademyEntry[];
  }[];
}

const toVocabularyItem = (entry: HskAcademyEntry, index: number, levelKey: LevelKey): VocabularyItem => ({
  id: `${levelKey}-${String(index + 1).padStart(3, '0')}`,
  chinese: entry.simplified,
  pinyin: entry.pinyin,
  vietnamese: entry.translation_vi || entry.translation_en || entry.simplified,
  phonetic: entry.translation_vi || entry.translation_en || entry.pinyin,
  hanViet: entry.translation_vi || entry.translation_en || entry.simplified,
});

const mapFlatEntries = (entries: HskAcademyEntry[]): LevelBucket[] => {
  const grouped: Record<LevelKey, VocabularyItem[]> = {
    HSK1: [],
    HSK2: [],
    HSK3: [],
    HSK4: [],
    HSK5: [],
  };

  entries.forEach((entry) => {
    const levelKey = keyByLevelNumber[entry.level];
    if (!levelKey) return;
    grouped[levelKey].push(toVocabularyItem(entry, grouped[levelKey].length, levelKey));
  });

  return (Object.keys(grouped) as LevelKey[]).map((key) => ({
    key,
    label: labelByKey[key],
    wordCount: grouped[key].length,
    description: `${grouped[key].length} entrées importées depuis HSK Academy`,
    words: grouped[key],
  }));
};

const mapNestedPayload = (payload: HskAcademyPayload): LevelBucket[] =>
  payload.levels
    .map((level) => {
      const key = keyByLevelNumber[level.level];
      if (!key) return null;
      const words = level.words.map((entry, index) => toVocabularyItem(entry, index, key));
      return {
        key,
        label: level.label || labelByKey[key],
        wordCount: words.length,
        description: `${words.length} entrées importées depuis HSK Academy`,
        words,
      } satisfies LevelBucket;
    })
    .filter(Boolean) as LevelBucket[];

export const loadHskAcademyVocabulary = async (source?: string): Promise<LevelBucket[] | null> => {
  const endpoint =
    source || (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_HSK_ACADEMY_SOURCE || DEFAULT_SOURCE;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`Statut ${response.status}`);
    const data = await response.json();

    if (Array.isArray(data)) {
      return mapFlatEntries(data as HskAcademyEntry[]);
    }

    if (typeof data === 'object' && data && 'levels' in data) {
      return mapNestedPayload(data as HskAcademyPayload);
    }

    console.warn('Format inattendu depuis HSK Academy');
    return null;
  } catch (error) {
    console.warn('Impossible de charger le vocabulaire HSK Academy :', error);
    return null;
  }
};
