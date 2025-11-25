import React from 'react';
import { DifficultyLevel, VocabularyItem } from '../types';

interface WordGeneratorProps {
  selectedLevel: DifficultyLevel;
  onSelectLevel: (level: DifficultyLevel) => void;
  onGenerate: () => void;
  currentWord: VocabularyItem | null;
  onAddFavorite: (item: VocabularyItem) => void;
  isFavorite: boolean;
  onPlayAudio: (item: VocabularyItem) => void;
}

const levels: { value: DifficultyLevel; label: string }[] = [
  { value: 'HSK1', label: 'HSK1' },
  { value: 'HSK2', label: 'HSK2' },
  { value: 'HSK3', label: 'HSK3' },
  { value: 'HSK4', label: 'HSK4' },
  { value: 'HSK5', label: 'HSK5' },
];

const formatLevelLabel = (level: DifficultyLevel) =>
  levels.find((item) => item.value === level)?.label ?? level;

const WordGenerator: React.FC<WordGeneratorProps> = ({
  selectedLevel,
  onSelectLevel,
  onGenerate,
  currentWord,
  onAddFavorite,
  isFavorite,
  onPlayAudio,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Générez un mot HSK</h2>
          <p className="text-slate-600 mt-1">Choisissez un niveau puis appuyez sur « Générer ».</p>
        </div>
        <button
          onClick={onGenerate}
          className="self-start px-5 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Générer
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {levels.map((level) => (
          <button
            key={level.value}
            onClick={() => onSelectLevel(level.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
              selectedLevel === level.value
                ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {level.label}
          </button>
        ))}
      </div>

      {currentWord ? (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-indigo-600">{formatLevelLabel(currentWord.difficulty)}</p>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">{currentWord.vietnamese}</h3>
              <p className="text-lg text-slate-700 mb-2">{currentWord.chinese}</p>
              <p className="text-slate-600">Pinyin : <span className="font-semibold">{currentWord.pinyin}</span></p>
              <p className="text-slate-600">Phonétique VI : <span className="font-semibold">{currentWord.phonetic}</span></p>
              <p className="text-slate-600">Hán Việt : <span className="font-semibold">{currentWord.hanViet}</span></p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => onPlayAudio(currentWord)}
                className="px-4 py-2 bg-white text-indigo-700 font-semibold border border-indigo-200 rounded-md shadow-sm hover:border-indigo-400"
              >
                Écouter la prononciation
              </button>
              <button
                onClick={() => onAddFavorite(currentWord)}
                disabled={isFavorite}
                className={`px-4 py-2 rounded-md font-semibold border transition ${
                  isFavorite
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-indigo-600 text-white border-indigo-600 shadow hover:bg-indigo-700'
                }`}
              >
                {isFavorite ? 'Déjà dans les favoris' : 'Ajouter aux favoris'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-500">
          Appuyez sur « Générer » pour découvrir un nouveau mot de niveau {formatLevelLabel(selectedLevel)}.
        </div>
      )}
    </div>
  );
};

export default WordGenerator;
