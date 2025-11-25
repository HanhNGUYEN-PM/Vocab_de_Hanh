import React, { useEffect, useMemo, useState } from 'react';
import FavoritesList from './components/FavoritesList';
import WordGenerator from './components/WordGenerator';
import vocabularyPool from './data/vocabulary';
import { DifficultyLevel, VocabularyItem } from './types';

const FAVORITES_STORAGE_KEY = 'chinese-learning-favorites';

const App: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>('HSK1');
  const [currentWord, setCurrentWord] = useState<VocabularyItem | null>(null);
  const [favorites, setFavorites] = useState<VocabularyItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Impossible de charger les favoris :', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Impossible de sauvegarder les favoris :', error);
    }
  }, [favorites]);

  const wordsForLevel = useMemo(
    () => vocabularyPool.filter((item) => item.difficulty === selectedLevel),
    [selectedLevel]
  );

  const handleGenerate = () => {
    if (wordsForLevel.length === 0) {
      setCurrentWord(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * wordsForLevel.length);
    const nextWord = wordsForLevel[randomIndex];
    setCurrentWord(nextWord);
    handlePlayAudio(nextWord);
  };

  const handleAddFavorite = (item: VocabularyItem) => {
    setFavorites((prev) => {
      if (prev.some((fav) => fav.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const handleRemoveFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePlayAudio = (item: VocabularyItem) => {
    if (item.audioUrl) {
      const audio = new Audio(item.audioUrl);
      audio.play();
      return;
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(item.chinese || item.pinyin);
      utterance.lang = 'zh-CN';
      speechSynthesis.speak(utterance);
    }
  };

  const isFavorite = currentWord ? favorites.some((fav) => fav.id === currentWord.id) : false;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <p className="text-sm font-semibold text-indigo-600">Outil d'apprentissage du chinois</p>
          <span className="text-xs text-slate-500">Niveaux HSK 1 → 5</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <WordGenerator
          selectedLevel={selectedLevel}
          onSelectLevel={(level) => {
            setSelectedLevel(level);
            setCurrentWord(null);
          }}
          onGenerate={handleGenerate}
          currentWord={currentWord}
          onAddFavorite={handleAddFavorite}
          isFavorite={isFavorite}
          onPlayAudio={handlePlayAudio}
        />

        <FavoritesList favorites={favorites} onRemove={handleRemoveFavorite} />
      </main>

      <footer className="text-center py-4 text-slate-500 text-sm">
        <p>Apprenez pas à pas : un mot à la fois.</p>
      </footer>
    </div>
  );
};

export default App;
