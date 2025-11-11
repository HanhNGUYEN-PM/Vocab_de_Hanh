import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { VocabularyItem } from './types';
import VocabularyInput from './components/VocabularyInput';
import Quiz from './components/Quiz';
import VocabularyManager from './components/VocabularyManager';
import PlusIcon from './components/icons/PlusIcon';
import LearnIcon from './components/icons/LearnIcon';
import ManageIcon from './components/icons/ManageIcon';
import ChevronDownIcon from './components/icons/ChevronDownIcon';

const VOCAB_STORAGE_KEY = 'vocabulary-builder-data';

type View = 'add' | 'learn' | 'manage';
type QuizScope = 'recent' | 'all' | 'favorites';

const generateId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const sanitizeVocabulary = (items: VocabularyItem[]): VocabularyItem[] =>
  items
    .filter((item): item is VocabularyItem => Boolean(item && typeof item === 'object'))
    .map((item, index) => ({
      id: typeof item.id === 'string' && item.id.trim() ? item.id : generateId(`word-${index}`),
      vietnamese: typeof item.vietnamese === 'string' ? item.vietnamese.trim() : '',
      chinese: typeof item.chinese === 'string' ? item.chinese.trim() : '',
      pinyin: typeof item.pinyin === 'string' ? item.pinyin.trim() : '',
      phonetic: typeof item.phonetic === 'string' ? item.phonetic.trim() : '',
      hanViet: typeof item.hanViet === 'string' ? item.hanViet.trim() : '',
      isFavorite: Boolean(item.isFavorite),
    }))
    .filter((item) => item.vietnamese && item.chinese && item.pinyin && item.phonetic && item.hanViet);

const App: React.FC = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [view, setView] = useState<View>('add');
  const [isLearnDropdownOpen, setIsLearnDropdownOpen] = useState(false);
  const [quizScope, setQuizScope] = useState<QuizScope | null>(null);

  const learnButtonRef = useRef<HTMLDivElement>(null);

  const persistVocabulary = useCallback((items: VocabularyItem[]) => {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save vocabulary to local storage:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(VOCAB_STORAGE_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as unknown;
      if (!Array.isArray(parsed)) {
        return;
      }

      const sanitized = sanitizeVocabulary(parsed as VocabularyItem[]);
      if (sanitized.length === 0) {
        return;
      }

      setVocabulary(sanitized);
      if (sanitized.length >= 3) {
        setView('learn');
        setQuizScope('all');
      }
    } catch (error) {
      console.error('Failed to load vocabulary from local storage:', error);
    }
  }, []);

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

  const handleSaveVocabulary = useCallback(
    (newItems: VocabularyItem[]) => {
      if (newItems.length === 0) {
        return;
      }

      let updated: VocabularyItem[] = [];
      setVocabulary((previousVocabulary) => {
        const normalizedNewItems = newItems.map((item, index) => ({
          ...item,
          id: item.id || generateId(`word-${previousVocabulary.length + index}`),
          isFavorite: Boolean(item.isFavorite),
        }));
        updated = [...previousVocabulary, ...normalizedNewItems];
        persistVocabulary(updated);
        return updated;
      });

      setView('learn');
      setQuizScope((previous) => previous ?? 'recent');
    },
    [persistVocabulary],
  );

  const handleDeleteVocabularyItem = useCallback(
    (idToDelete: string) => {
      let updated: VocabularyItem[] | null = null;
      setVocabulary((previousVocabulary) => {
        const filtered = previousVocabulary.filter((item) => item.id !== idToDelete);
        if (filtered.length === previousVocabulary.length) {
          return previousVocabulary;
        }

        updated = filtered;
        persistVocabulary(filtered);
        return filtered;
      });

      if (!updated) {
        return;
      }

      if (updated.length === 0) {
        setView('add');
        setQuizScope(null);
      } else if (updated.length < 3 && view === 'learn') {
        setView('add');
        setQuizScope(null);
      }
    },
    [persistVocabulary, view],
  );

  const handleUpdateVocabularyItem = useCallback(
    (updatedItem: VocabularyItem) => {
      setVocabulary((previousVocabulary) => {
        let changed = false;
        const updated = previousVocabulary.map((item) => {
          if (item.id === updatedItem.id) {
            changed = true;
            return {
              ...item,
              ...updatedItem,
              isFavorite: Boolean(updatedItem.isFavorite),
            };
          }
          return item;
        });

        if (!changed) {
          return previousVocabulary;
        }

        persistVocabulary(updated);
        return updated;
      });
    },
    [persistVocabulary],
  );

  const handleToggleFavorite = useCallback(
    (id: string, next?: boolean) => {
      setVocabulary((previousVocabulary) => {
        let changed = false;
        const updated = previousVocabulary.map((item) => {
          if (item.id !== id) {
            return item;
          }

          const newValue = typeof next === 'boolean' ? next : !item.isFavorite;
          if (newValue === Boolean(item.isFavorite)) {
            return item;
          }

          changed = true;
          return {
            ...item,
            isFavorite: newValue,
          };
        });

        if (!changed) {
          return previousVocabulary;
        }

        persistVocabulary(updated);
        return updated;
      });
    },
    [persistVocabulary],
  );

  const handleWrongAnswer = useCallback(
    (id: string) => {
      setVocabulary((previousVocabulary) => {
        let changed = false;
        const updated = previousVocabulary.map((item) => {
          if (item.id === id && !item.isFavorite) {
            changed = true;
            return {
              ...item,
              isFavorite: true,
            };
          }

          return item;
        });

        if (!changed) {
          return previousVocabulary;
        }

        persistVocabulary(updated);
        return updated;
      });
    },
    [persistVocabulary],
  );

  const favorites = useMemo(() => vocabulary.filter((item) => item.isFavorite), [vocabulary]);

  const handleStartQuiz = (scope: QuizScope) => {
    setQuizScope(scope);
    setView('learn');
    setIsLearnDropdownOpen(false);
  };

  const hasAnyVocabulary = vocabulary.length > 0;
  const hasEnoughVocabularyForQuiz = vocabulary.length >= 3;
  const hasFavorites = favorites.length > 0;

  const quizVocabulary = useMemo(() => {
    if (quizScope === 'recent') {
      return vocabulary.slice(-30);
    }
    if (quizScope === 'favorites') {
      return favorites;
    }
    if (quizScope === 'all') {
      return vocabulary;
    }
    return [];
  }, [favorites, quizScope, vocabulary]);

  const canStartQuiz =
    hasEnoughVocabularyForQuiz &&
    quizScope !== null &&
    (quizScope !== 'favorites' || hasFavorites);

  const renderContent = () => {
    switch (view) {
      case 'add':
        return <VocabularyInput onSave={handleSaveVocabulary} existingVocabulary={vocabulary} />;
      case 'learn':
        if (!canStartQuiz || quizVocabulary.length === 0) {
          return (
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-slate-700 mb-4">Bienvenue !</h2>
              <p className="text-slate-600 mb-2">Ajoutez au moins 3 mots de vocabulaire pour démarrer un quiz.</p>
              <p className="text-slate-600">
                Vous pouvez aussi marquer des favoris pour vous concentrer sur les mots les plus difficiles.
              </p>
            </div>
          );
        }

        const quizTitle =
          quizScope === 'recent'
            ? 'Quiz : 30 derniers mots'
            : quizScope === 'favorites'
            ? 'Quiz : Mots favoris'
            : 'Quiz : Tous les mots';

        return (
          <Quiz
            key={`${quizScope}-${quizVocabulary.length}`}
            allVocabulary={vocabulary}
            questionPool={quizVocabulary}
            title={quizTitle}
            onToggleFavorite={handleToggleFavorite}
            onWrongAnswer={handleWrongAnswer}
          />
        );
      case 'manage':
        return hasAnyVocabulary ? (
          <VocabularyManager
            vocabulary={vocabulary}
            onUpdate={handleUpdateVocabularyItem}
            onDelete={handleDeleteVocabularyItem}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-slate-700 mb-4">Aucun mot à gérer</h2>
            <p className="text-slate-600">Votre collection de vocabulaire est vide.</p>
            <p className="text-slate-600">Ajoutez quelques mots dans l'onglet « Ajouter des mots ».</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-700 tracking-tight">Vocabulary Builder</h1>
            <p className="text-xs mt-1 text-slate-500">
              Vos mots sont enregistrés dans ce navigateur. Marquez des favoris pour les revoir rapidement.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <button
              onClick={() => setView('add')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'add' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <PlusIcon className="w-5 h-5" />
              <span>Ajouter des mots</span>
            </button>
            <div className="relative" ref={learnButtonRef}>
              <button
                onClick={() => hasEnoughVocabularyForQuiz && setIsLearnDropdownOpen((previous) => !previous)}
                disabled={!hasEnoughVocabularyForQuiz}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'learn' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={!hasEnoughVocabularyForQuiz ? 'Ajoutez au moins 3 mots pour démarrer un quiz' : 'Commencer un quiz'}
              >
                <LearnIcon className="w-5 h-5" />
                <span>Réviser</span>
                <ChevronDownIcon
                  className="w-4 h-4 ml-1 transition-transform"
                  style={{ transform: isLearnDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
              {isLearnDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
                  <button
                    onClick={() => handleStartQuiz('recent')}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    30 derniers mots
                  </button>
                  <button
                    onClick={() => handleStartQuiz('all')}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Tous les mots
                  </button>
                  <button
                    onClick={() => handleStartQuiz('favorites')}
                    disabled={!hasFavorites}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Mots favoris
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => hasAnyVocabulary && setView('manage')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'manage' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={!hasAnyVocabulary}
              title={!hasAnyVocabulary ? 'Ajoutez des mots avant de pouvoir les gérer' : 'Gérer votre collection'}
            >
              <ManageIcon className="w-5 h-5" />
              <span>Gérer</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{renderContent()}</main>
    </div>
  );
};

export default App;
