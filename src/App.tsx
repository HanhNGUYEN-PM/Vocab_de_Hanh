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

const App: React.FC = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [view, setView] = useState<View>('add');
  const [isLearnDropdownOpen, setIsLearnDropdownOpen] = useState(false);
  const [quizScope, setQuizScope] = useState<QuizScope | null>(null);

  const learnButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(VOCAB_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (Array.isArray(parsedData)) {
          setVocabulary(parsedData);
          if (parsedData.length > 0) {
            setView(parsedData.length >= 3 ? 'learn' : 'add');
            if (parsedData.length >= 3) {
              setQuizScope('all'); // Default to all if starting on learn view
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load vocabulary from local storage:", error);
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

  const persistVocabulary = (vocab: VocabularyItem[]) => {
    try {
      localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(vocab));
    } catch (error) {
      console.error("Failed to save vocabulary to local storage:", error);
    }
  };

  const handleSaveVocabulary = useCallback((newItems: VocabularyItem[]) => {
    setVocabulary(prevVocabulary => {
      const updatedVocabulary = [...prevVocabulary, ...newItems];
      persistVocabulary(updatedVocabulary);
      if (updatedVocabulary.length >= 3) {
        setView('learn');
        setQuizScope('recent');
      }
      return updatedVocabulary;
    });
  }, []);

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
  }, [view]);

  const handleUpdateVocabularyItem = useCallback((updatedItem: VocabularyItem) => {
    setVocabulary(prevVocabulary => {
      const updatedVocabulary = prevVocabulary.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      );
      persistVocabulary(updatedVocabulary);
      return updatedVocabulary;
    });
  }, []);
  
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
  }


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
                title={!hasEnoughVocabularyForQuiz ? "Add at least 3 words to start learning" : "Start learning"}
                >
                <LearnIcon className="w-5 h-5" />
                <span>Learn</span>
                <ChevronDownIcon className="w-4 h-4 ml-1 transition-transform" style={{ transform: isLearnDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'}} />
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
              title={!hasAnyVocabulary ? "Add words to manage your collection" : "Manage collection"}
            >
              <ManageIcon className="w-5 h-5" />
              <span>Manage</span>
            </button>
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
      <footer className="text-center py-4 text-slate-500 text-sm">
        <p>Created by a world-class senior frontend React engineer.</p>
      </footer>
    </div>
  );
};

export default App;
