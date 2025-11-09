
import React, { useState } from 'react';
import type { VocabularyItem } from '../types';

interface VocabularyInputProps {
  onSave: (items: VocabularyItem[]) => void;
  existingVocabulary: VocabularyItem[];
}

const PLACEHOLDER_TEXT = `Paste your vocabulary here. Each line should have 5 parts separated by tabs.
Example:
Ngân hàng	银行	yínháng	dính háng	ngân hàng
Bưu điện	邮局	yóujú	dấu chú	bưu cục
...`;

const VocabularyInput: React.FC<VocabularyInputProps> = ({ onSave, existingVocabulary }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleParseAndSave = () => {
    setError(null);
    setSuccessMessage(null);
    if (!text.trim()) {
      setError('Input cannot be empty.');
      return;
    }

    const lines = text.trim().split('\n');
    const newItems: VocabularyItem[] = [];
    let lineError = false;
    const existingVietnameseWords = new Set(existingVocabulary.map(item => item.vietnamese));
    let skippedCount = 0;

    lines.forEach((line, index) => {
      if (lineError) return;
      if (!line.trim()) return;

      const parts = line.split('\t');
      if (parts.length !== 5) {
        setError(`Error on line ${index + 1}: Each line must have exactly 5 parts separated by a tab.`);
        lineError = true;
        return;
      }

      const [vietnamese, chinese, pinyin, phonetic, hanViet] = parts.map(p => p.trim());
      if (!vietnamese || !chinese || !pinyin || !phonetic || !hanViet) {
         setError(`Error on line ${index + 1}: One of the parts is empty.`);
         lineError = true;
         return;
      }
      
      if(existingVietnameseWords.has(vietnamese)) {
        skippedCount++;
        return; // Skip duplicate
      }

      newItems.push({
        id: `${Date.now()}-${index}`,
        vietnamese,
        chinese,
        pinyin,
        phonetic,
        hanViet,
        isFavorite: false,
      });
    });

    if (!lineError) {
      if(existingVocabulary.length + newItems.length < 3) {
        setError('You need a total of at least 3 vocabulary words to start the quiz.');
        return;
      }
      if (newItems.length > 0) {
        onSave(newItems);
        setSuccessMessage(`${newItems.length} new word(s) added! ${skippedCount > 0 ? `${skippedCount} duplicate(s) skipped.` : ''}`);
        setText(''); // Clear textarea on success
      } else if (skippedCount > 0) {
        setError(`All ${skippedCount} entered word(s) were duplicates and have been skipped.`);
      } else {
        setError('No new words to add.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-700">Add New Vocabulary</h2>
        <div className="text-sm font-medium text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
            {existingVocabulary.length} words in collection
        </div>
      </div>
      <p className="text-slate-600 mb-6">
        Paste your vocabulary list below. New words will be added to your existing collection. Duplicates will be skipped.
      </p>
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER_TEXT}
        className="w-full h-64 p-4 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 resize-none font-mono text-sm"
      />
      
      {error && <p className="text-red-500 mt-4 text-sm font-semibold">{error}</p>}
      {successMessage && <p className="text-green-600 mt-4 text-sm font-semibold">{successMessage}</p>}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleParseAndSave}
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
        >
          Add Words to Collection
        </button>
      </div>
    </div>
  );
};

export default VocabularyInput;
