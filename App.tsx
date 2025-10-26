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

  const currentUrl = new URL(window.location.href);
  if (currentUrl.searchParams.has('data')) {
    encoded = currentUrl.searchParams.get('data');
    currentUrl.searchParams.delete('data');
  }

  if (!encoded && window.location.hash.includes('data=')) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    if (hashParams.has('data')) {
      encoded = hashParams.get('data');
      hashParams.delete('data');
      const newHash = hashParams.toString();
      currentUrl.hash = newHash ? `#${newHash}` : '';
    }
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
  }

  return {
    items: importedItems,
    cleanupUrl: currentUrl.toString(),
    hadCode: true,
    decodeFailed,
  };
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
      return;
    }

    try {
      const code = encodeVocabularyForTransfer(vocabulary);
      setLastShareCode(code);

      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(code);
        setShareStatus('Sync code copied to clipboard. Paste it into the app on your other device.');
      } else {
        setShareStatus('Copy the sync code shown below and paste it into the app on your other device.');
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

  const handleImportSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setImportStatus(null);
    setImportError(null);

    const trimmedInput = importInput.trim();
    if (!trimmedInput) {
      setImportError('Paste a sync code to import your vocabulary.');
      return;
    }

    const importedItems = decodeVocabularyCode(trimmedInput);
    if (importedItems.length === 0) {
      setImportError('The sync code is invalid or empty.');
      return;
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

          {lastShareCode && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Your sync code
              </label>
              <textarea
                value={lastShareCode}
                readOnly
                className="w-full h-32 p-3 font-mono text-xs bg-white border border-indigo-200 rounded-md text-slate-700"
              />
              <p className="text-xs text-slate-500 mt-2">
                Keep this code private. It contains all of your vocabulary words.
              </p>
            </div>
          )}

          {isImportOpen && (
            <form onSubmit={handleImportSubmit} className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Paste sync code
              </label>
              <textarea
                value={importInput}
                onChange={(event) => setImportInput(event.target.value)}
                placeholder="Paste the sync code from another device here"
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
