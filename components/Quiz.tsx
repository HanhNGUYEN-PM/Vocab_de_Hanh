import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { VocabularyItem } from '../types';
import CheckIcon from './icons/CheckIcon';
import XIcon from './icons/XIcon';
import StarIcon from './icons/StarIcon';

interface QuizProps {
  allVocabulary: VocabularyItem[];
  questionPool: VocabularyItem[];
  title: string;
  onToggleFavorite: (id: string, next?: boolean) => void;
  onWrongAnswer: (id: string) => void;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const Quiz: React.FC<QuizProps> = ({ allVocabulary, questionPool, title, onToggleFavorite, onWrongAnswer }) => {
  const [quizQuestionIds, setQuizQuestionIds] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [choices, setChoices] = useState<VocabularyItem[]>([]);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [recentAnswer, setRecentAnswer] = useState<VocabularyItem | null>(null);
  const autoAdvanceTimeoutRef = useRef<number | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  const currentQuestionId = quizQuestionIds[currentQuestionIndex] ?? null;
  const currentQuestion = useMemo(
    () => questionPool.find((item) => item.id === currentQuestionId) ?? null,
    [currentQuestionId, questionPool],
  );

  const generateNewQuiz = useCallback(() => {
    if (questionPool.length === 0) {
      setQuizQuestionIds([]);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswerId(null);
      setIsAnswered(false);
      setIsFinished(false);
      return;
    }

    const shuffledPool = shuffleArray(questionPool);
    const selected = shuffledPool.slice(0, Math.min(10, questionPool.length)).map((item) => item.id);
    setQuizQuestionIds(selected);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswerId(null);
    setIsAnswered(false);
    setIsFinished(false);
  }, [questionPool]);

  useEffect(() => {
    if (quizQuestionIds.length === 0 && questionPool.length > 0 && allVocabulary.length >= 3) {
      generateNewQuiz();
    }
  }, [allVocabulary.length, generateNewQuiz, questionPool.length, quizQuestionIds.length]);

  useEffect(() => {
    if (!currentQuestion) {
      setChoices([]);
      return;
    }

    const incorrectAnswers = shuffleArray(allVocabulary.filter((item) => item.id !== currentQuestion.id));
    const selectedIncorrect = incorrectAnswers.slice(0, Math.min(2, incorrectAnswers.length));
    const options = shuffleArray([currentQuestion, ...selectedIncorrect]);
    setChoices(options);
  }, [allVocabulary, currentQuestion]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return () => {};
    }

    const synth = window.speechSynthesis;
    const updateVoices = () => {
      voicesRef.current = synth.getVoices();
    };

    updateVoices();
    synth.addEventListener('voiceschanged', updateVoices);

    return () => {
      synth.removeEventListener('voiceschanged', updateVoices);
    };
  }, []);

  useEffect(() => () => {
    if (autoAdvanceTimeoutRef.current) {
      window.clearTimeout(autoAdvanceTimeoutRef.current);
    }
  }, []);

  const speakCurrentWord = useCallback(
    (item: VocabularyItem): Promise<void> => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
        return Promise.resolve();
      }

      const synth = window.speechSynthesis;
      if (!synth) {
        return Promise.resolve();
      }

      synth.cancel();

      const voices = voicesRef.current.length > 0 ? voicesRef.current : synth.getVoices();

      const buildUtterance = (text: string, preferredLangs: string[]): SpeechSynthesisUtterance => {
        const utterance = new SpeechSynthesisUtterance(text);
        for (const lang of preferredLangs) {
          const matchingVoice = voices.find((voice) => voice.lang?.toLowerCase().startsWith(lang.toLowerCase())) ?? null;
          if (matchingVoice) {
            utterance.voice = matchingVoice;
            utterance.lang = matchingVoice.lang;
            return utterance;
          }
        }

        if (preferredLangs[0]) {
          utterance.lang = preferredLangs[0];
        }

        return utterance;
      };

      const utterances: SpeechSynthesisUtterance[] = [];

      if (item.vietnamese) {
        utterances.push(buildUtterance(item.vietnamese, ['vi-VN', 'vi']));
      }

      if (item.chinese) {
        utterances.push(buildUtterance(item.chinese, ['zh-CN', 'zh', 'cmn']));
      }

      if (utterances.length === 0) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        const speakUtterance = (index: number) => {
          if (index >= utterances.length) {
            resolve();
            return;
          }

          const utterance = utterances[index];

          const cleanup = () => {
            utterance.removeEventListener('end', handleEnd);
            utterance.removeEventListener('error', handleError);
          };

          const handleEnd = () => {
            cleanup();
            speakUtterance(index + 1);
          };

          const handleError = () => {
            cleanup();
            speakUtterance(index + 1);
          };

          utterance.addEventListener('end', handleEnd);
          utterance.addEventListener('error', handleError);

          synth.speak(utterance);
        };

        speakUtterance(0);
      });
    },
    [],
  );

  const handleAnswer = (selectedId: string) => {
    if (isAnswered || !currentQuestion) {
      return;
    }

    setSelectedAnswerId(selectedId);
    setIsAnswered(true);
    setRecentAnswer(currentQuestion);

    const isCorrect = selectedId === currentQuestion.id;

    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
    } else {
      onWrongAnswer(currentQuestion.id);
    }

    if (autoAdvanceTimeoutRef.current) {
      window.clearTimeout(autoAdvanceTimeoutRef.current);
    }

    const delay = isCorrect ? 1200 : 2000;

    const scheduleAdvance = () => {
      autoAdvanceTimeoutRef.current = window.setTimeout(() => {
        handleNextQuestion();
      }, delay);
    };

    speakCurrentWord(currentQuestion)
      .catch(() => {
        // Ignore speech synthesis errors and continue advancing.
      })
      .finally(() => {
        scheduleAdvance();
      });
  };

  const handleNextQuestion = () => {
    if (quizQuestionIds.length === 0) {
      return;
    }

    setRecentAnswer(null);

    if (currentQuestionIndex < quizQuestionIds.length - 1) {
      setCurrentQuestionIndex((previous) => previous + 1);
      setSelectedAnswerId(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }

    autoAdvanceTimeoutRef.current = null;
  };

  const handleRestart = () => {
    generateNewQuiz();
  };

  const toggleFavorite = () => {
    if (!currentQuestion) {
      return;
    }

    onToggleFavorite(currentQuestion.id, !currentQuestion.isFavorite);
  };

  const getChoiceClass = (choiceId: string) => {
    if (!isAnswered) {
      return 'bg-white hover:bg-indigo-50 border-slate-300';
    }
    if (currentQuestion && choiceId === currentQuestion.id) {
      return 'bg-green-100 border-green-500 ring-2 ring-green-500';
    }
    if (choiceId === selectedAnswerId) {
      return 'bg-red-100 border-red-500 ring-2 ring-red-500';
    }
    return 'bg-slate-50 border-slate-200 opacity-60';
  };

  if (questionPool.length === 0 || allVocabulary.length < 3) {
    return (
      <div className="max-w-2xl mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-slate-700">Quiz indisponible</h2>
        <p className="text-slate-600">Ajoutez davantage de mots pour pouvoir lancer un quiz.</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-4 text-slate-700">Quiz terminé !</h2>
        <p className="text-xl text-slate-600 mb-6">Votre score final :</p>
        <p className="text-6xl font-bold text-indigo-600 mb-8">
          {score} / {quizQuestionIds.length}
        </p>
        <button
          onClick={handleRestart}
          className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
        >
          Recommencer le quiz
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="text-center text-slate-500">Chargement du quiz...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold text-slate-600">{title}</h1>
      </div>
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-slate-500">
          Question {currentQuestionIndex + 1} sur {quizQuestionIds.length}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-slate-600 bg-slate-200 px-3 py-1 rounded-full">Score : {score}</div>
          <button
            onClick={toggleFavorite}
            className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors bg-white border border-slate-200 hover:bg-indigo-50"
          >
            <StarIcon
              filled={Boolean(currentQuestion.isFavorite)}
              className={`w-5 h-5 ${currentQuestion.isFavorite ? 'text-yellow-500' : 'text-slate-400'}`}
            />
            <span>{currentQuestion.isFavorite ? 'Favori' : 'Ajouter aux favoris'}</span>
          </button>
        </div>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-lg mb-6 text-center">
        <p className="text-lg text-slate-500 mb-2">Quelle est la signification de :</p>
        <h2 className="text-4xl font-bold text-slate-800">{currentQuestion.vietnamese}</h2>
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
                <p className="text-sm text-slate-500 mt-1">
                  {choice.phonetic} • {choice.hanViet}
                </p>
              </div>
              {isAnswered && (
                choice.id === currentQuestion.id ? (
                  <CheckIcon className="w-8 h-8 text-green-600" />
                ) : choice.id === selectedAnswerId ? (
                  <XIcon className="w-8 h-8 text-red-600" />
                ) : null
              )}
            </div>
          </button>
        ))}
      </div>

      {isAnswered && (
        <div className="mt-8 text-center text-slate-500 text-sm">
          {currentQuestionIndex < quizQuestionIds.length - 1
            ? 'Chargement de la question suivante...'
            : 'Affichage des résultats...'}
        </div>
      )}

      {recentAnswer && (
        <div className="mt-6 text-center">
          <div className="inline-block px-4 py-2 bg-green-50 text-green-700 rounded-full font-semibold shadow-sm">
            Bonne réponse : <span className="font-bold text-green-800">{recentAnswer.chinese}</span>
          </div>
          <div className="mt-2 text-sm text-green-600">
            {recentAnswer.pinyin} • {recentAnswer.phonetic}
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
