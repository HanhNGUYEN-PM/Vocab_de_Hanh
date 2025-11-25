import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { VocabularyItem } from './types';
import { LevelKey, VOCABULARY_BY_LEVEL, levelOrder } from './data/vocabulary';

const FAVORITES_STORAGE_KEY = 'chinese-vocab-favorites';
const LEVEL_STORAGE_KEY = 'chinese-vocab-selected-level';

const getVocabularyPool = (selectedLevel: LevelKey): VocabularyItem[] => {
  const maxIndex = levelOrder.indexOf(selectedLevel);
  return VOCABULARY_BY_LEVEL.slice(0, maxIndex + 1).flatMap((bucket) => bucket.words);
};

const App: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<LevelKey>('A1');
  const [currentWord, setCurrentWord] = useState<VocabularyItem | null>(null);
  const [favorites, setFavorites] = useState<VocabularyItem[]>([]);
  const [audioMessage, setAudioMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const storedLevel = localStorage.getItem(LEVEL_STORAGE_KEY) as LevelKey | null;

      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites) as VocabularyItem[];
        if (Array.isArray(parsedFavorites)) {
          setFavorites(parsedFavorites);
        }
      }

      if (storedLevel && levelOrder.includes(storedLevel)) {
        setSelectedLevel(storedLevel);
      }
    } catch (error) {
      console.error('Impossible de charger les données depuis le stockage local :', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(LEVEL_STORAGE_KEY, selectedLevel);
  }, [selectedLevel]);

  const vocabularyPool = useMemo(() => getVocabularyPool(selectedLevel), [selectedLevel]);

  const speakWord = useCallback((word: VocabularyItem) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setAudioMessage("La synthèse vocale n'est pas disponible dans ce navigateur.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(word.chinese);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setAudioMessage('Lecture automatique en chinois activée.');
  }, []);

  const handleGenerate = () => {
    if (vocabularyPool.length === 0) return;
    const randomIndex = Math.floor(Math.random() * vocabularyPool.length);
    const nextWord = vocabularyPool[randomIndex];
    setCurrentWord(nextWord);
    speakWord(nextWord);
  };

  const handleToggleFavorite = () => {
    if (!currentWord) return;

    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === currentWord.id);
      if (exists) {
        return prev.filter((item) => item.id !== currentWord.id);
      }
      return [...prev, currentWord];
    });
  };

  const handleRemoveFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((item) => item.id !== id));
  };

  const isCurrentFavorite = currentWord ? favorites.some((item) => item.id === currentWord.id) : false;

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Mandarin • Vietnamien</p>
            <h1 className="text-2xl font-extrabold text-slate-800 leading-tight">Vocabulaire chinois</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
            <span className="font-semibold text-indigo-700">Favoris</span>
            <span className="px-2 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-700 font-bold">{favorites.length}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {VOCABULARY_BY_LEVEL.map((level) => {
            const isActive = selectedLevel === level.key;
            return (
              <button
                key={level.key}
                onClick={() => setSelectedLevel(level.key)}
                className={`rounded-xl border transition-all duration-150 px-3 py-3 text-base font-semibold shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isActive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">{level.label}</span>
                  {isActive && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/25 text-white">Actif</span>}
                </div>
              </button>
            );
          })}
        </section>

        <section className="bg-slate-50 rounded-2xl shadow p-6 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Niveau {selectedLevel}</p>
              <h2 className="text-xl font-bold text-slate-800">{vocabularyPool.length} mots disponibles</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
              >
                Générer
              </button>
              <button
                onClick={() => currentWord && speakWord(currentWord)}
                disabled={!currentWord}
                className="px-3 py-2 bg-white text-indigo-700 font-semibold rounded-lg border border-indigo-200 shadow-sm hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Réécouter
              </button>
            </div>
          </div>

          {audioMessage && (
            <div className="mb-4 text-xs text-indigo-700 bg-white border border-indigo-100 rounded-lg px-3 py-2">
              {audioMessage}
            </div>
          )}

          {currentWord ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2">
                <p className="text-xs uppercase font-semibold text-indigo-700 tracking-wide">Mot</p>
                <h3 className="text-3xl font-extrabold text-slate-900 leading-tight">{currentWord.vietnamese}</h3>
                <p className="text-base text-slate-600">Chinois : <span className="font-semibold text-indigo-700">{currentWord.chinese}</span></p>
                <p className="text-base text-slate-600">Pinyin : <span className="font-semibold">{currentWord.pinyin}</span></p>
                <p className="text-base text-slate-600">Phonétique VN : <span className="font-semibold">{currentWord.phonetic}</span></p>
                <p className="text-base text-slate-600">Hán Việt : <span className="font-semibold">{currentWord.hanViet}</span></p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">Actions</p>
                  <p className="text-lg font-bold text-slate-800">Audio + favoris</p>
                  <p className="text-xs text-slate-600">Lecture automatique, sauvegarde rapide.</p>
                </div>
                <button
                  onClick={handleToggleFavorite}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isCurrentFavorite
                      ? 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
                      : 'bg-indigo-600 text-white shadow hover:bg-indigo-700'
                  }`}
                >
                  {isCurrentFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 border border-dashed border-slate-200 rounded-xl p-8 text-sm">
              Cliquez sur « Générer » pour commencer.
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500">Révisions</p>
              <h2 className="text-xl font-bold text-slate-800">Favoris ({favorites.length})</h2>
            </div>
          </div>
          {favorites.length === 0 ? (
            <p className="text-sm text-slate-500">Ajoutez un mot généré pour le conserver ici.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {favorites.map((word) => (
                <div key={word.id} className="border border-slate-200 rounded-xl p-3 shadow-sm bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-indigo-700 font-semibold">{word.vietnamese}</p>
                      <p className="text-lg font-bold text-slate-900 leading-tight">{word.chinese}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveFavorite(word.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold"
                    >
                      Retirer
                    </button>
                  </div>
                  <p className="text-sm text-slate-600">Pinyin : <span className="font-semibold">{word.pinyin}</span></p>
                  <p className="text-sm text-slate-600">Phonétique VN : <span className="font-semibold">{word.phonetic}</span></p>
                  <p className="text-sm text-slate-600">Hán Việt : <span className="font-semibold">{word.hanViet}</span></p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
