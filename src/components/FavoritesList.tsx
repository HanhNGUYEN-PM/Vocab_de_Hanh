import React from 'react';
import { VocabularyItem } from '../types';

interface FavoritesListProps {
  favorites: VocabularyItem[];
  onRemove: (id: string) => void;
}

const FavoritesList: React.FC<FavoritesListProps> = ({ favorites, onRemove }) => {
  if (favorites.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 text-center text-slate-500">
        Aucune entrée dans vos favoris pour le moment.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-indigo-500 font-semibold">Révision</p>
          <h3 className="text-2xl font-bold text-slate-800">Vos favoris</h3>
        </div>
        <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{favorites.length} mot(s)</span>
      </div>
      <div className="grid gap-4">
        {favorites.map((item) => (
          <div key={item.id} className="border border-slate-200 rounded-lg p-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-600">{item.difficulty}</p>
              <h4 className="text-xl font-bold text-slate-900">{item.vietnamese}</h4>
              <p className="text-slate-700">{item.chinese} · {item.pinyin}</p>
              <p className="text-slate-600 text-sm">{item.phonetic} · Hán Việt : {item.hanViet}</p>
            </div>
            <button
              onClick={() => onRemove(item.id)}
              className="mt-2 md:mt-0 px-4 py-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50 font-semibold"
            >
              Retirer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoritesList;
