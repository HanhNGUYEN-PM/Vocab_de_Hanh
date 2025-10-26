import React, { useState, useCallback, useEffect, useRef } from 'react';
import { VocabularyItem } from './types';
import VocabularyInput from './components/VocabularyInput';
import Quiz from './components/Quiz';
import VocabularyManager from './components/VocabularyManager';
import PlusIcon from './components/icons/PlusIcon';
import LearnIcon from './components/icons/LearnIcon';
import ManageIcon from './components/icons/ManageIcon';
import ChevronDownIcon from './components/icons/ChevronDownIcon';

type View = 'add' | 'learn' | 'manage';
type QuizScope = 'recent' | 'all';

const VOCAB_STORAGE_KEY = 'vocabulary-builder-data';
const VOCAB_SYNC_CODES_KEY = 'vocabulary-sync-codes';

const ZERO_WIDTH_ZERO = '\u200B';
const ZERO_WIDTH_ONE = '\u200C';
const ZERO_WIDTH_PATTERN = new RegExp(`[${ZERO_WIDTH_ZERO}${ZERO_WIDTH_ONE}]`, 'g');

type SyncCodeMap = Record<string, string>;

const generateNumericCode = (length: number): string => {
  const max = 10 ** length;
  const code = Math.floor(Math.random() * max).toString();
  return code.padStart(length, '0');
};

const loadSyncCodeMap = (): SyncCodeMap => {
  if (typeof localStorage === 'undefined') {
    return {};
  }

  try {
    const raw = localStorage.getItem(VOCAB_SYNC_CODES_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as SyncCodeMap;
    }
  } catch (error) {
    console.error('Failed to load sync codes map from local storage:', error);
  }

  return {};
};

const saveSyncCodeMap = (map: SyncCodeMap) => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(VOCAB_SYNC_CODES_KEY, JSON.stringify(map));
  } catch (error) {
    console.error('Failed to save sync codes map to local storage:', error);
  }
};

const storeSyncCodePayload = (code: string, payload: string) => {
  const map = loadSyncCodeMap();
  map[code] = payload;
  saveSyncCodeMap(map);
};

const resolveSyncCodePayload = (code: string): string | null => {
  const map = loadSyncCodeMap();
  return map[code] || null;
};

const formatSyncPackage = (code: string, payload: string): string => `${code}:${payload}`;

const encodeHiddenPayload = (payload: string): string => {
  try {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(payload);
    let bits = '';

    bytes.forEach(byte => {
      bits += byte.toString(2).padStart(8, '0');
    });

    return bits
      .replace(/0/g, ZERO_WIDTH_ZERO)
      .replace(/1/g, ZERO_WIDTH_ONE);
  } catch (error) {
    console.error('Failed to encode hidden payload:', error);
    return '';
  }
};

const decodeHiddenPayload = (value: string): string | null => {
  const matches = value.match(new RegExp(`[${ZERO_WIDTH_ZERO}${ZERO_WIDTH_ONE}]`, 'g'));
  if (!matches || matches.length === 0) {
    return null;
  }

  const bits = matches
    .map(char => {
      if (char === ZERO_WIDTH_ZERO) {
        return '0';
      }
      if (char === ZERO_WIDTH_ONE) {
        return '1';
      }
      return '';
    })
    .join('');

  if (bits.length === 0 || bits.length % 8 !== 0) {
    return null;
  }

  const byteValues: number[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    const slice = bits.slice(index, index + 8);
    if (slice.length < 8) {
      return null;
    }
    byteValues.push(parseInt(slice, 2));
  }

  try {
    const decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(byteValues));
  } catch (error) {
    console.error('Failed to decode hidden payload:', error);
    return null;
  }
};

const buildShareToken = (code: string, payload: string): string => `${code}${encodeHiddenPayload(payload)}`;

const stripHiddenCharacters = (value: string): string => value.replace(ZERO_WIDTH_PATTERN, '');

const parseSyncPackage = (
  value: string,
): { code: string | null; payload: string | null } => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { code: null, payload: null };
  }

  const match = trimmed.match(/^(\d{6})[:|](.+)$/);
  if (match) {
    const [, code, payload] = match;
    return {
      code,
      payload: payload || null,
    };
  }

  return { code: null, payload: null };
};

const generateId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeVocabularyItems = (items: unknown[]): VocabularyItem[] => {
  const normalized: VocabularyItem[] = [];

  items.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const candidate = item as Partial<VocabularyItem> & Record<string, unknown>;
    const { vietnamese, chinese, pinyin, phonetic, hanViet } = candidate;

    if (
      typeof vietnamese !== 'string' ||
      typeof chinese !== 'string' ||
      typeof pinyin !== 'string' ||
      typeof phonetic !== 'string' ||
      typeof hanViet !== 'string'
    ) {
      return;
    }

    const trimmedItem: VocabularyItem = {
      id: typeof candidate.id === 'string' ? candidate.id : generateId(`import-${index}`),
      vietnamese: vietnamese.trim(),
      chinese: chinese.trim(),
      pinyin: pinyin.trim(),
      phonetic: phonetic.trim(),
      hanViet: hanViet.trim(),
      isFavorite: typeof candidate.isFavorite === 'boolean' ? candidate.isFavorite : false,
    };

    if (
      trimmedItem.vietnamese &&
      trimmedItem.chinese &&
      trimmedItem.pinyin &&
      trimmedItem.phonetic &&
      trimmedItem.hanViet
    ) {
      normalized.push(trimmedItem);
    }
  });

  return normalized;
};

const encodeVocabularyForTransfer = (items: VocabularyItem[]): string => {
  const sanitized = items.map((item) => ({
    ...item,
    isFavorite: Boolean(item.isFavorite),
  }));

  const json = JSON.stringify(sanitized);
  return btoa(encodeURIComponent(json));
};

const decodeVocabularyCode = (code: string): VocabularyItem[] => {
  try {
    const json = decodeURIComponent(atob(code.trim()));
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeVocabularyItems(parsed);
  } catch (error) {
    console.error('Failed to decode vocabulary sync code:', error);
    return [];
  }
};

const mergeVocabularyLists = (
  existing: VocabularyItem[],
  incoming: VocabularyItem[],
): VocabularyItem[] => {
  if (incoming.length === 0) {
    return existing;
  }

  const result: VocabularyItem[] = [...existing];
  const seen = new Set(existing.map((item) => item.vietnamese.trim().toLowerCase()));

  incoming.forEach((item, index) => {
    const key = item.vietnamese.trim().toLowerCase();
    if (!key) {
      return;
    }

    if (seen.has(key)) {
      return;
    }

    const safeItem: VocabularyItem = {
      ...item,
      id: item.id || generateId(`incoming-${index}`),
      isFavorite: Boolean(item.isFavorite),
    };

    seen.add(key);
    result.push(safeItem);
  });

  return result;
};

const extractVocabularyFromLocation = () => {
  if (typeof window === 'undefined') {
    return {
      items: [] as VocabularyItem[],
      cleanupUrl: null as string | null,
      hadCode: false,
      decodeFailed: false,
    };
  }

  let encoded: string | null = null;
  let decodeFailed = false;
  let codeParam: string | null = null;

  const currentUrl = new URL(window.location.href);
  if (currentUrl.searchParams.has('data')) {
    encoded = currentUrl.searchParams.get('data');
    currentUrl.searchParams.delete('data');
  }
  if (currentUrl.searchParams.has('code')) {
    codeParam = currentUrl.searchParams.get('code');
    currentUrl.searchParams.delete('code');
  }

  if (!encoded && window.location.hash.includes('data=')) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    if (hashParams.has('data')) {
      encoded = hashParams.get('data');
      hashParams.delete('data');
      const newHash = hashParams.toString();
      currentUrl.hash = newHash ? `#${newHash}` : '';
    }
    if (hashParams.has('code')) {
      codeParam = hashParams.get('code');
      hashParams.delete('code');
      const newHash = hashParams.toString();
      currentUrl.hash = newHash ? `#${newHash}` : '';
    }
  }

  if (!encoded && codeParam && /^\d{6}$/.test(codeParam)) {
    encoded = resolveSyncCodePayload(codeParam);
  }

  if (!encoded) {
    return {
      items: [] as VocabularyItem[],
      cleanupUrl: null as string | null,
      hadCode: false,
      decodeFailed: false,
    };
  }

  const importedItems = decodeVocabularyCode(encoded);
  if (importedItems.length === 0) {
    decodeFailed = true;
  } else if (codeParam) {
    storeSyncCodePayload(codeParam.padStart(6, '0'), encoded);
  }

  return {
    items: importedItems,
    cleanupUrl: currentUrl.toString(),
    hadCode: true,
    decodeFailed,
  };
};

const extractPayloadFromInput = (input: string): { payload: string | null; code: string | null } => {
  const trimmed = input.trim();
  if (!trimmed) {
    return { payload: null, code: null };
  }

  const hiddenPayload = decodeHiddenPayload(trimmed);
  if (hiddenPayload) {
    const sanitized = stripHiddenCharacters(trimmed);
    const codeMatch = sanitized.match(/\d{6}/);
    if (codeMatch) {
      return {
        payload: hiddenPayload,
        code: codeMatch[0],
      };
    }
  }

  const packageResult = parseSyncPackage(trimmed);
  if (packageResult.payload) {
    return {
      payload: packageResult.payload,
      code: packageResult.code,
    };
  }

  if (/^\d{6}$/.test(trimmed)) {
    const payload = resolveSyncCodePayload(trimmed);
    return { payload, code: payload ? trimmed : null };
  }

  try {
    const potentialUrl = new URL(trimmed);
    let payload: string | null = null;
    let code: string | null = null;

    if (potentialUrl.searchParams.has('data')) {
      payload = potentialUrl.searchParams.get('data');
    }
    if (potentialUrl.searchParams.has('code')) {
      code = potentialUrl.searchParams.get('code');
    }

    if (!payload && potentialUrl.hash.includes('data=')) {
      const hashParams = new URLSearchParams(potentialUrl.hash.slice(1));
      if (hashParams.has('data')) {
        payload = hashParams.get('data');
      }
      if (hashParams.has('code')) {
        code = hashParams.get('code');
      }
    }

    if (payload) {
      return {
        payload,
        code: code && /^\d{6}$/.test(code) ? code : null,
      };
    }
  } catch (error) {
    // Not a valid URL, fall back to raw payload.
  }

  return { payload: trimmed, code: null };
};

const App: React.FC = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [view, setView] = useState<View>('add');
  const [isLearnDropdownOpen, setIsLearnDropdownOpen] = useState(false);
  const [quizScope, setQuizScope] = useState<QuizScope | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [lastShareCode, setLastShareCode] = useState<string | null>(null);
  const [lastSharePayload, setLastSharePayload] = useState<string | null>(null);
  const [lastShareToken, setLastShareToken] = useState<string | null>(null);
  const [isPackageVisible, setIsPackageVisible] = useState(false);

  const learnButtonRef = useRef<HTMLDivElement>(null);

  const persistVocabulary = useCallback((vocab: VocabularyItem[]) => {
    try {
      localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(vocab));
    } catch (error) {
      console.error('Failed to save vocabulary to local storage:', error);
    }
  }, []);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(VOCAB_STORAGE_KEY);
      let storedVocabulary: VocabularyItem[] = [];
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (Array.isArray(parsedData)) {
          storedVocabulary = normalizeVocabularyItems(parsedData);
        }
      }

      const { items: urlItems, cleanupUrl, hadCode, decodeFailed } = extractVocabularyFromLocation();
      if (cleanupUrl) {
        window.history.replaceState(null, '', cleanupUrl);
      }

      let combinedVocabulary = storedVocabulary;

      if (urlItems.length > 0) {
        combinedVocabulary = mergeVocabularyLists(storedVocabulary, urlItems);
        persistVocabulary(combinedVocabulary);
        setImportStatus(`${urlItems.length} word(s) imported from your sync code. Duplicates were skipped.`);
        setImportError(null);
      } else if (hadCode && decodeFailed) {
        setImportError('The sync code in the link could not be read. Please try again.');
      }

      setVocabulary(combinedVocabulary);

      if (combinedVocabulary.length >= 3) {
        setView('learn');
        setQuizScope('all');
      } else if (combinedVocabulary.length > 0) {
        setView('add');
        setQuizScope(null);
      }
    } catch (error) {
      console.error('Failed to load vocabulary data:', error);
    }
  }, [persistVocabulary]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (learnButtonRef.current && !learnButtonRef.current.contains(event.target as Node)) {
        setIsLearnDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSaveVocabulary = useCallback((newItems: VocabularyItem[]) => {
    setShareStatus(null);
    setImportStatus(null);
    setImportError(null);
    setLastShareCode(null);
    setLastShareToken(null);
    setIsPackageVisible(false);

    setVocabulary(prevVocabulary => {
      const updatedVocabulary = [...prevVocabulary, ...newItems];
      persistVocabulary(updatedVocabulary);
      if (updatedVocabulary.length >= 3) {
        setView('learn');
        setQuizScope('recent');
      }
      return updatedVocabulary;
    });
  }, [persistVocabulary]);

  const handleDeleteVocabularyItem = useCallback((idToDelete: string) => {
    setVocabulary(prevVocabulary => {
      const updatedVocabulary = prevVocabulary.filter(item => item.id !== idToDelete);
      persistVocabulary(updatedVocabulary);
      if (updatedVocabulary.length < 3 && view === 'learn') {
        setView('add');
        setQuizScope(null);
      }
      if (updatedVocabulary.length === 0 && view === 'manage') {
        setView('add');
      }
      return updatedVocabulary;
    });
  }, [view, persistVocabulary]);

  const handleUpdateVocabularyItem = useCallback((updatedItem: VocabularyItem) => {
    setVocabulary(prevVocabulary => {
      const updatedVocabulary = prevVocabulary.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      );
      persistVocabulary(updatedVocabulary);
      return updatedVocabulary;
    });
  }, [persistVocabulary]);

  const handleCreateSyncCode = async () => {
    if (vocabulary.length === 0) {
      setShareStatus('Add a few words before creating a sync code.');
      setLastShareCode(null);
      setLastSharePayload(null);
      setLastShareToken(null);
      return;
    }

    try {
      const payload = encodeVocabularyForTransfer(vocabulary);
      const shortCode = generateNumericCode(6);
      storeSyncCodePayload(shortCode, payload);
      const shareToken = buildShareToken(shortCode, payload);
      setLastShareCode(shortCode);
      setLastSharePayload(payload);
      setLastShareToken(shareToken);
      setIsPackageVisible(false);

      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(shareToken);
        setShareStatus('Sync code copied. Paste the digits into the app on your other device to restore your words.');
      } else {
        setShareStatus('Copy the sync code shown below. The hidden data travels with the digits when you paste them.');
      }
    } catch (error) {
      console.error('Failed to create sync code:', error);
      setShareStatus('Unable to create a sync code. Please try again.');
    }
  };

  const toggleImportSection = () => {
    setIsImportOpen(prev => !prev);
    setImportInput('');
    setImportError(null);
    setImportStatus(null);
  };

  const handleCopySyncCode = async () => {
    if (!lastShareCode || !lastSharePayload) {
      return;
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        const token = lastShareToken ?? buildShareToken(lastShareCode, lastSharePayload);
        await navigator.clipboard.writeText(token);
        setShareStatus('Sync code copied. Paste it into the app on your other device.');
      } else {
        setShareStatus('Select and copy the sync code manually.');
      }
    } catch (error) {
      console.error('Failed to copy sync code:', error);
      setShareStatus('Unable to copy the sync code. Please try again.');
    }
  };

  const handleImportSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setImportStatus(null);
    setImportError(null);

    const trimmedInput = importInput.trim();
    if (!trimmedInput) {
      setImportError('Enter a sync code or paste the copied sync package to import your vocabulary.');
      return;
    }

    const { payload, code } = extractPayloadFromInput(trimmedInput);
    if (!payload) {
      setImportError('The sync code is invalid or incomplete. Use the copy button or reveal the sync package text.');
      return;
    }

    const importedItems = decodeVocabularyCode(payload);
    if (importedItems.length === 0) {
      setImportError('The sync code is invalid or empty.');
      return;
    }

    if (code) {
      storeSyncCodePayload(code.padStart(6, '0'), payload);
    }

    let addedCount = 0;
    setVocabulary(prevVocabulary => {
      const merged = mergeVocabularyLists(prevVocabulary, importedItems);
      addedCount = merged.length - prevVocabulary.length;
      persistVocabulary(merged);
      if (addedCount > 0 && merged.length >= 3) {
        setView('learn');
        setQuizScope('recent');
      }
      return merged;
    });

    setImportStatus(
      addedCount > 0
        ? `Imported ${importedItems.length} word(s). ${addedCount} new word(s) were added to your collection.`
        : 'All of the words from that sync code were already in your collection.',
    );
    setImportInput('');
    setIsImportOpen(false);
  };

  const handleStartQuiz = (scope: QuizScope) => {
    setQuizScope(scope);
    setView('learn');
    setIsLearnDropdownOpen(false);
  };

  const hasEnoughVocabularyForQuiz = vocabulary.length >= 3;
  const hasAnyVocabulary = vocabulary.length > 0;

  const renderContent = () => {
    switch(view) {
      case 'add':
        return <VocabularyInput onSave={handleSaveVocabulary} existingVocabulary={vocabulary} />;
      case 'learn':
        if (!quizScope || !hasEnoughVocabularyForQuiz) {
          return (
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-slate-700 mb-4">Welcome!</h2>
              <p className="text-slate-600">You need at least 3 vocabulary words to start a quiz.</p>
              <p className="text-slate-600">Please go to the "Add Words" tab to add some.</p>
            </div>
          );
        }
        const quizTitle = quizScope === 'recent' ? 'Quiz: Recent 30 Words' : 'Quiz: All Words';
        const quizVocab = quizScope === 'recent' ? vocabulary.slice(-30) : vocabulary;
        return <Quiz vocabulary={quizVocab} title={quizTitle} />;
      case 'manage':
        return hasAnyVocabulary ? (
          <VocabularyManager
            vocabulary={vocabulary}
            onUpdate={handleUpdateVocabularyItem}
            onDelete={handleDeleteVocabularyItem}
          />
        ) : (
          <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-slate-700 mb-4">No words to manage.</h2>
            <p className="text-slate-600">Your vocabulary collection is empty.</p>
            <p className="text-slate-600">Please go to the "Add Words" tab to add some.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-700 tracking-tight">
            Vocabulary Builder
          </h1>
          <nav className="flex space-x-2">
            <button
              onClick={() => setView('add')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'add'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Words</span>
            </button>
            <div className="relative" ref={learnButtonRef}>
              <button
                onClick={() => hasEnoughVocabularyForQuiz && setIsLearnDropdownOpen(prev => !prev)}
                disabled={!hasEnoughVocabularyForQuiz}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'learn'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={!hasEnoughVocabularyForQuiz ? 'Add at least 3 words to start learning' : 'Start learning'}
              >
                <LearnIcon className="w-5 h-5" />
                <span>Learn</span>
                <ChevronDownIcon
                  className="w-4 h-4 ml-1 transition-transform"
                  style={{ transform: isLearnDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
              {isLearnDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
                  <button
                    onClick={() => handleStartQuiz('recent')}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Recent 30 Words
                  </button>
                  <button
                    onClick={() => handleStartQuiz('all')}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    All Words
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => hasAnyVocabulary && setView('manage')}
              disabled={!hasAnyVocabulary}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'manage'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={!hasAnyVocabulary ? 'Add words to manage your collection' : 'Manage collection'}
            >
              <ManageIcon className="w-5 h-5" />
              <span>Manage</span>
            </button>
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8 space-y-6">
        <section className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-indigo-900">Stay in sync across devices</h2>
              <p className="text-sm text-indigo-800 mt-1">
                Create a sync code to back up your words and paste it into the app on another device.
              </p>
              {shareStatus && (
                <p className="text-sm text-indigo-700 mt-3 font-medium">{shareStatus}</p>
              )}
              {importStatus && (
                <p className="text-sm text-green-700 mt-3 font-medium">{importStatus}</p>
              )}
              {importError && (
                <p className="text-sm text-red-600 mt-3 font-medium">{importError}</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCreateSyncCode}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Copy sync code
              </button>
              <button
                onClick={toggleImportSection}
                className="px-4 py-2 bg-white text-indigo-700 font-semibold rounded-md shadow hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isImportOpen ? 'Close import' : 'Import sync code'}
              </button>
            </div>
          </div>

          {lastShareCode && lastSharePayload && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  6-digit sync code
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={lastShareCode}
                    readOnly
                    className="w-full sm:max-w-xs px-3 py-2 font-mono text-sm bg-white border border-indigo-200 rounded-md text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleCopySyncCode}
                    className="px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Copy code
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Use the copy button to share your words. The digits you paste include the hidden backup data.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsPackageVisible(prev => !prev)}
                  className="px-3 py-2 bg-white text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isPackageVisible ? 'Hide sync package text' : 'Show sync package text (manual fallback)'}
                </button>
                {isPackageVisible && (
                  <div>
                    <textarea
                      value={formatSyncPackage(lastShareCode, lastSharePayload)}
                      readOnly
                      className="w-full h-24 p-3 font-mono text-xs bg-white border border-indigo-200 rounded-md text-slate-700"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Use this only if your messaging app removes hidden characters. Paste the entire string on the other device.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isImportOpen && (
            <form onSubmit={handleImportSubmit} className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Paste copied sync code or reveal the package text
              </label>
              <textarea
                value={importInput}
                onChange={(event) => setImportInput(event.target.value)}
                placeholder="Paste the copied sync code (just the digits) or, if needed, paste the revealed sync package text"
                className="w-full h-32 p-3 font-mono text-xs bg-white border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={toggleImportSection}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Import words
                </button>
              </div>
            </form>
          )}
        </section>

        {renderContent()}
      </main>
      <footer className="text-center py-4 text-slate-500 text-sm">
        <p>Created by a world-class senior frontend React engineer.</p>
      </footer>
    </div>
  );
};

export default App;
