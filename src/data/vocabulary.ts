import { VocabularyItem } from '../types';

export type LevelKey = 'A1' | 'A2' | 'B1' | 'B2';

export interface LevelBucket {
  key: LevelKey;
  label: string;
  wordCount: number;
  description: string;
  words: VocabularyItem[];
}

export const VOCABULARY_BY_LEVEL: LevelBucket[] = [
  {
    key: 'A1',
    label: 'A1',
    wordCount: 500,
    description: 'Vocabulaire de base pour démarrer (500 mots).',
    words: [
      {
        id: 'A1-001',
        vietnamese: 'xin chào',
        chinese: '你好',
        pinyin: 'nǐ hǎo',
        phonetic: 'nỉ hảo',
        hanViet: 'nhĩ hảo',
      },
      {
        id: 'A1-002',
        vietnamese: 'cảm ơn',
        chinese: '谢谢',
        pinyin: 'xièxie',
        phonetic: 'xiê xiê',
        hanViet: 'tạ tạ',
      },
      {
        id: 'A1-003',
        vietnamese: 'tạm biệt',
        chinese: '再见',
        pinyin: 'zàijiàn',
        phonetic: 'chai chiẹn',
        hanViet: 'tái kiến',
      },
      {
        id: 'A1-004',
        vietnamese: 'ngân hàng',
        chinese: '银行',
        pinyin: 'yínháng',
        phonetic: 'dính háng',
        hanViet: 'ngân hàng',
      },
      {
        id: 'A1-005',
        vietnamese: 'bưu điện',
        chinese: '邮局',
        pinyin: 'yóujú',
        phonetic: 'dấu chú',
        hanViet: 'bưu cục',
      },
    ],
  },
  {
    key: 'A2',
    label: 'A2',
    wordCount: 1200,
    description: '700 mots supplémentaires pour étendre les bases.',
    words: [
      {
        id: 'A2-001',
        vietnamese: 'sân bay',
        chinese: '机场',
        pinyin: 'jīchǎng',
        phonetic: 'chi trảng',
        hanViet: 'cơ trường',
      },
      {
        id: 'A2-002',
        vietnamese: 'bệnh viện',
        chinese: '医院',
        pinyin: 'yīyuàn',
        phonetic: 'y chiện',
        hanViet: 'y viện',
      },
      {
        id: 'A2-003',
        vietnamese: 'món ăn',
        chinese: '菜',
        pinyin: 'cài',
        phonetic: 'xai',
        hanViet: 'thái',
      },
      {
        id: 'A2-004',
        vietnamese: 'đặt chỗ',
        chinese: '预订',
        pinyin: 'yùdìng',
        phonetic: 'yư tịnh',
        hanViet: 'dự đính',
      },
      {
        id: 'A2-005',
        vietnamese: 'vui vẻ',
        chinese: '开心',
        pinyin: 'kāixīn',
        phonetic: 'kai xin',
        hanViet: 'khai tâm',
      },
    ],
  },
  {
    key: 'B1',
    label: 'B1',
    wordCount: 2500,
    description: 'Encore 1 300 mots pour raconter et argumenter.',
    words: [
      {
        id: 'B1-001',
        vietnamese: 'trách nhiệm',
        chinese: '责任',
        pinyin: 'zérèn',
        phonetic: 'd-ờ rân',
        hanViet: 'trách nhiệm',
      },
      {
        id: 'B1-002',
        vietnamese: 'kinh nghiệm',
        chinese: '经验',
        pinyin: 'jīngyàn',
        phonetic: 'ching diẹn',
        hanViet: 'kinh nghiệm',
      },
      {
        id: 'B1-003',
        vietnamese: 'thuyết phục',
        chinese: '说服',
        pinyin: 'shuōfú',
        phonetic: 'xuô phú',
        hanViet: 'thuyết phục',
      },
      {
        id: 'B1-004',
        vietnamese: 'cải thiện',
        chinese: '改善',
        pinyin: 'gǎishàn',
        phonetic: 'cải san',
        hanViet: 'cải thiện',
      },
      {
        id: 'B1-005',
        vietnamese: 'thảo luận',
        chinese: '讨论',
        pinyin: 'tǎolùn',
        phonetic: 'thảo luân',
        hanViet: 'thảo luận',
      },
    ],
  },
  {
    key: 'B2',
    label: 'B2',
    wordCount: 5000,
    description: '2 500 mots complémentaires pour atteindre l’autonomie.',
    words: [
      {
        id: 'B2-001',
        vietnamese: 'bền vững',
        chinese: '可持续',
        pinyin: 'kě chíxù',
        phonetic: 'khở trứ hự',
        hanViet: 'khả trì tục',
      },
      {
        id: 'B2-002',
        vietnamese: 'đổi mới',
        chinese: '创新',
        pinyin: 'chuàngxīn',
        phonetic: 'truâng xin',
        hanViet: 'sáng tân',
      },
      {
        id: 'B2-003',
        vietnamese: 'hiệu quả',
        chinese: '效率',
        pinyin: 'xiàolǜ',
        phonetic: 'xiao ly',
        hanViet: 'hiệu suất',
      },
      {
        id: 'B2-004',
        vietnamese: 'tự chủ',
        chinese: '自主',
        pinyin: 'zìzhǔ',
        phonetic: 'dư chủ',
        hanViet: 'tự chủ',
      },
      {
        id: 'B2-005',
        vietnamese: 'phức tạp',
        chinese: '复杂',
        pinyin: 'fùzá',
        phonetic: 'phụ trá',
        hanViet: 'phức tạp',
      },
    ],
  },
];

export const levelOrder: LevelKey[] = ['A1', 'A2', 'B1', 'B2'];
