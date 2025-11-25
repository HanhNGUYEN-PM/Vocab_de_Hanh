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

const levels: DifficultyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

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
          <p className="text-sm uppercase tracking-wide text-indigo-500 font-semibold">Progression CECRL</p>
          <h2 className="text-2xl font-bold text-slate-800">Choisissez un niveau puis générez un mot</h2>
          <p className="text-slate-600 mt-2">Chaque mot inclut l'écriture chinoise, le pinyin, la phonétique vietnamienne et une prononciation audio.</p>
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
            key={level}
            onClick={() => onSelectLevel(level)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
              selectedLevel === level
                ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {currentWord ? (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-indigo-600">{currentWord.difficulty}</p>
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
          Appuyez sur « Générer » pour découvrir un nouveau mot de niveau {selectedLevel}.
        </div>
      )}
    </div>
  );
};

export default WordGenerator;
