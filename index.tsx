// Fix: Provide global type declarations for React and ReactDOM when running without a bundler.
declare const React: typeof import('react');
declare const ReactDOM: typeof import('react-dom/client');

// This is a standalone script processed by Babel in the browser.
// React and ReactDOM are loaded from a CDN and are available as global variables.

// --- TYPES ---
interface VocabularyItem {
  id: string;
  vietnamese: string;
  chinese: string;
  pinyin: string;
  phonetic: string;
  hanViet: string;
  isFavorite?: boolean;
}


// --- ICONS ---

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const LearnIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);

const ManageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const DeleteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const StarIcon: React.FC<React.SVGProps<SVGSVGElement> & { isFavorite: boolean }> = ({ isFavorite, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
);


// --- COMPONENTS ---

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
  const { useState } = React;
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


interface QuizProps {
  vocabulary: VocabularyItem[];
  allVocabulary: VocabularyItem[];
  title: string;
  onToggleFavorite: (id: string) => void;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const Quiz: React.FC<QuizProps> = ({ vocabulary, allVocabulary, title, onToggleFavorite }) => {
  const { useState, useEffect, useMemo, useCallback } = React;
  
  // State for the quiz's structure (snapshot)
  const [quizContent, setQuizContent] = useState<{ questionIds: string[]; choicesMap: Record<string, VocabularyItem[]> } | null>(null);

  // State for the user's progress through the quiz
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [quizKey, setQuizKey] = useState(0);

  const startNewQuiz = useCallback(() => {
    setQuizKey(k => k + 1);
  }, []);
  
  // Memoize the stringified list of IDs. This creates a stable dependency for the
  // quiz generation effect. The effect will only re-run if the actual set of words
  // changes, not when a 'isFavorite' status is toggled.
  const vocabularyIds = useMemo(() => JSON.stringify(vocabulary.map(item => item.id).sort()), [vocabulary]);
  const allVocabularyIds = useMemo(() => JSON.stringify(allVocabulary.map(item => item.id).sort()), [allVocabulary]);

  // This effect builds the quiz "snapshot". It runs only when the quiz type changes (title),
  // the user explicitly starts a new quiz (quizKey), or the underlying word list changes.
  useEffect(() => {
    if (vocabulary.length < 3) {
        setQuizContent(null);
        return;
    }

    const questionsForQuiz = shuffleArray(vocabulary).slice(0, Math.min(10, vocabulary.length));
    const questionIds = questionsForQuiz.map(item => item.id);
    const choicesMap: Record<string, VocabularyItem[]> = {};

    for (const question of questionsForQuiz) {
        const incorrectAnswers = allVocabulary.filter(item => item.id !== question.id);
        const shuffledIncorrect = shuffleArray(incorrectAnswers);
        choicesMap[question.id] = shuffleArray([question, ...shuffledIncorrect.slice(0, 2)]);
    }

    setQuizContent({ questionIds, choicesMap });
    
    // Reset progress for the new quiz
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswerId(null);
    setIsAnswered(false);
    setIsFinished(false);
  }, [title, quizKey, vocabularyIds, allVocabularyIds]);

  const currentQuestionId = quizContent?.questionIds[currentQuestionIndex];

  // For rendering, we get the STABLE structure from our quizContent snapshot...
  const stableChoices = useMemo(() => {
      if (!currentQuestionId || !quizContent) return [];
      return quizContent.choicesMap[currentQuestionId];
  }, [currentQuestionId, quizContent]);

  // ...and then we sync it with the LATEST favorite status from the main vocabulary prop.
  // This ensures the star icon is always up-to-date without reshuffling choices.
  const choices = useMemo(() => {
    return stableChoices.map(stableChoice => {
      const latestVersion = allVocabulary.find(v => v.id === stableChoice.id);
      return latestVersion || stableChoice;
    });
  }, [allVocabulary, stableChoices]);
  
  const currentQuestion = useMemo(() => {
      return choices.find(c => c.id === currentQuestionId) || null;
  }, [choices, currentQuestionId]);


  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quizContent?.questionIds.length ?? 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswerId(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleAnswer = (selectedId: string) => {
    if (isAnswered) return;
    
    setSelectedAnswerId(selectedId);
    setIsAnswered(true);

    if (selectedId === currentQuestion?.id) {
      setScore(score + 1);
    } else if (currentQuestion && !currentQuestion.isFavorite) {
        onToggleFavorite(currentQuestion.id);
    }

    setTimeout(() => {
        handleNextQuestion();
    }, 1200);
  };

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-4 text-slate-700">Quiz Complete!</h2>
        <p className="text-xl text-slate-600 mb-6">
          Your final score is:
        </p>
        <p className="text-6xl font-bold text-indigo-600 mb-8">
          {score} / {quizContent?.questionIds.length ?? 0}
        </p>
        <button
          onClick={startNewQuiz}
          className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
        >
          Start New Quiz
        </button>
      </div>
    );
  }

  if (!quizContent || !currentQuestion) {
    return (
        <div className="text-center text-slate-500">Loading quiz...</div>
    );
  }
  
  const getChoiceClass = (choiceId: string) => {
      if (!isAnswered) {
          return 'bg-white hover:bg-indigo-50 border-slate-300';
      }
      if (choiceId === currentQuestion.id) {
          return 'bg-green-100 border-green-500 ring-2 ring-green-500';
      }
      if (choiceId === selectedAnswerId) {
          return 'bg-red-100 border-red-500 ring-2 ring-red-500';
      }
      return 'bg-slate-50 border-slate-200 opacity-60';
  }

  return (
    <div className="max-w-2xl mx-auto">
        <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-slate-600">{title}</h1>
        </div>
        <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-slate-500">
                Question {currentQuestionIndex + 1} of {quizContent.questionIds.length}
            </div>
            <div className="text-sm font-semibold text-slate-600 bg-slate-200 px-3 py-1 rounded-full">
                Score: {score}
            </div>
        </div>
      <div className="bg-white p-8 rounded-lg shadow-lg mb-6 text-center">
        <p className="text-lg text-slate-500 mb-2">What is the meaning of:</p>
        <div className="flex justify-center items-center gap-2">
            <h2 className="text-4xl font-bold text-slate-800">{currentQuestion.vietnamese}</h2>
            <button 
                onClick={() => onToggleFavorite(currentQuestion.id)} 
                className="text-yellow-400 hover:text-yellow-500 transition-transform transform hover:scale-125"
                title={currentQuestion.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
                <StarIcon isFavorite={!!currentQuestion.isFavorite} className="w-8 h-8"/>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => handleAnswer(choice.id)}
            disabled={isAnswered}
            className={`p-6 rounded-lg border-2 text-left transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none ${getChoiceClass(choice.id)}`}
          >
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-2xl font-semibold text-slate-800">{choice.pinyin}</p>
                    <p className="text-sm text-slate-500 mt-1">{choice.phonetic} • {choice.hanViet}</p>
                </div>
                {isAnswered && (
                  choice.id === currentQuestion.id ? <CheckIcon className="w-8 h-8 text-green-600" /> :
                  choice.id === selectedAnswerId ? <XIcon className="w-8 h-8 text-red-600" /> : null
                )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};


interface VocabularyManagerProps {
  vocabulary: VocabularyItem[];
  onUpdate: (item: VocabularyItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const VocabularyManager: React.FC<VocabularyManagerProps> = ({ vocabulary, onUpdate, onDelete, onToggleFavorite }) => {
  const { useState } = React;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedItem, setEditedItem] = useState<VocabularyItem | null>(null);

  const handleEdit = (item: VocabularyItem) => {
    setEditingId(item.id);
    setEditedItem({ ...item });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedItem(null);
  };

  const handleSave = () => {
    if (editedItem) {
      onUpdate(editedItem);
    }
    handleCancel();
  };

  const handleDelete = (id: string, vietnamese: string) => {
    if (window.confirm(`Are you sure you want to delete "${vietnamese}"?`)) {
      onDelete(id);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editedItem) {
      setEditedItem({ ...editedItem, [e.target.name]: e.target.value });
    }
  };

  const renderCell = (field: keyof VocabularyItem, item: VocabularyItem) => {
    if (editingId === item.id && editedItem && typeof editedItem[field] === 'string') {
      return (
        <input
          type="text"
          name={field}
          value={editedItem[field] as string}
          onChange={handleInputChange}
          className="w-full bg-slate-50 border border-indigo-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      );
    }
    return item[field];
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-700 mb-6">Manage Vocabulary Collection</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-100">
            <tr>
              <th scope="col" className="px-4 py-3">Vietnamese</th>
              <th scope="col" className="px-4 py-3">Chinese</th>
              <th scope="col" className="px-4 py-3">Pinyin</th>
              <th scope="col" className="px-4 py-3">Phonetic</th>
              <th scope="col" className="px-4 py-3">Hán Việt</th>
              <th scope="col" className="px-4 py-3 text-center">Favorite</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vocabulary.map((item) => (
              <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                <td className="px-4 py-3">{renderCell('vietnamese', item)}</td>
                <td className="px-4 py-3">{renderCell('chinese', item)}</td>
                <td className="px-4 py-3">{renderCell('pinyin', item)}</td>
                <td className="px-4 py-3">{renderCell('phonetic', item)}</td>
                <td className="px-4 py-3">{renderCell('hanViet', item)}</td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => onToggleFavorite(item.id)}
                    className="p-2 text-yellow-400 hover:text-yellow-500 rounded-full hover:bg-yellow-50"
                    title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <StarIcon isFavorite={!!item.isFavorite} className="w-5 h-5"/>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end items-center space-x-2">
                    {editingId === item.id ? (
                      <>
                        <button onClick={handleSave} className="p-2 text-green-600 hover:text-green-800 rounded-full hover:bg-green-100" title="Save">
                          <CheckIcon className="w-5 h-5" />
                        </button>
                        <button onClick={handleCancel} className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200" title="Cancel">
                          <XIcon className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100" title="Edit">
                          <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(item.id, item.vietnamese)} className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100" title="Delete">
                          <DeleteIcon className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---

type View = 'add' | 'learn' | 'manage';
type QuizScope = 'recent' | 'all' | 'favorites';

const VOCAB_STORAGE_KEY = 'vocabulary-builder-data';

const App: React.FC = () => {
  const { useState, useCallback, useEffect, useRef, useMemo } = React;
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [view, setView] = useState<View>('add');
  const [isLearnDropdownOpen, setIsLearnDropdownOpen] = useState(false);
  const [quizScope, setQuizScope] = useState<QuizScope | null>(null);

  const learnButtonRef = useRef<HTMLDivElement>(null);
  
  const favoriteWords = useMemo(() => vocabulary.filter(item => item.isFavorite), [vocabulary]);

  // Fix: Safely parse and validate vocabulary data from localStorage.
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(VOCAB_STORAGE_KEY);
      if (storedData) {
        const parsedData: unknown = JSON.parse(storedData);
        if (Array.isArray(parsedData)) {
          // This type guard validates that each object from storage has the required properties.
          // This is a safer way to handle data from an external source like localStorage.
          // Fix: Use a type-safe validation guard to safely parse vocabulary data from localStorage without using 'any', resolving type errors.
          const validatedData = parsedData.filter((item: unknown): item is VocabularyItem => {
            if (typeof item !== 'object' || item === null) return false;

            const potentialItem = item as Record<string, unknown>;
            return (
              typeof potentialItem.id === 'string' &&
              typeof potentialItem.vietnamese === 'string' &&
              typeof potentialItem.chinese === 'string' &&
              typeof potentialItem.pinyin === 'string' &&
              typeof potentialItem.phonetic === 'string' &&
              typeof potentialItem.hanViet === 'string' &&
              (!('isFavorite' in potentialItem) || typeof potentialItem.isFavorite === 'boolean')
            );
          });

          setVocabulary(validatedData);
          if (validatedData.length > 0) {
            setView(validatedData.length >= 3 ? 'learn' : 'add');
            if (validatedData.length >= 3) {
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
  
  const handleToggleFavorite = useCallback((idToToggle: string) => {
    setVocabulary(prevVocabulary => {
        const updatedVocabulary = prevVocabulary.map(item =>
            item.id === idToToggle ? { ...item, isFavorite: !item.isFavorite } : item
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
  const canStartFavoriteQuiz = favoriteWords.length >= 3;

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
        if (quizScope === 'favorites' && !canStartFavoriteQuiz) {
             return (
                <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                  <h2 className="text-2xl font-bold text-slate-700 mb-4">Not Enough Favorite Words</h2>
                  <p className="text-slate-600">You need at least 3 favorite words to start a quiz.</p>
                  <p className="text-slate-600">Favorite some more words during a quiz or from the "Manage" tab.</p>
                </div>
              );
        }
        const quizTitle = quizScope === 'recent' 
            ? 'Quiz: Recent 30 Words' 
            : quizScope === 'favorites'
                ? 'Quiz: Favorite Words'
                : 'Quiz: All Words';
        const quizVocab = quizScope === 'recent' 
            ? vocabulary.slice(-30) 
            : quizScope === 'favorites'
                ? favoriteWords
                : vocabulary;
        return <Quiz vocabulary={quizVocab} allVocabulary={vocabulary} title={quizTitle} onToggleFavorite={handleToggleFavorite} />;
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
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
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
                        <div className="border-t border-slate-200 my-1"></div>
                        <button
                            onClick={() => handleStartQuiz('favorites')}
                            disabled={!canStartFavoriteQuiz}
                            className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                             title={!canStartFavoriteQuiz ? "You need at least 3 favorite words to start this quiz" : "Quiz with only your favorite words"}
                        >
                            Favorite Words ({favoriteWords.length})
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


// --- RENDER APP ---

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);