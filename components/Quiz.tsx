
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { VocabularyItem } from '../types';
import CheckIcon from './icons/CheckIcon';
import XIcon from './icons/XIcon';

interface QuizProps {
  vocabulary: VocabularyItem[];
  title: string;
}

// Utility function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const Quiz: React.FC<QuizProps> = ({ vocabulary, title }) => {
  const [quizQuestions, setQuizQuestions] = useState<VocabularyItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [choices, setChoices] = useState<VocabularyItem[]>([]);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = useMemo(() => {
    if (quizQuestions.length === 0) return null;
    return quizQuestions[currentQuestionIndex];
  }, [currentQuestionIndex, quizQuestions]);

  const generateNewQuiz = useCallback(() => {
    const shuffledVocabulary = shuffleArray(vocabulary);
    const questionsForQuiz = shuffledVocabulary.slice(0, Math.min(10, vocabulary.length));
    
    setQuizQuestions(questionsForQuiz);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswerId(null);
    setIsAnswered(false);
    setIsFinished(false);
  }, [vocabulary]);

  useEffect(() => {
    if (vocabulary.length >= 3) {
      generateNewQuiz();
    }
  }, [vocabulary, generateNewQuiz]);

  useEffect(() => {
    if (currentQuestion) {
      // Get incorrect answers from the entire vocabulary pool for more variety
      const incorrectAnswers = vocabulary
        .filter((item) => item.id !== currentQuestion.id);
      const shuffledIncorrect = shuffleArray(incorrectAnswers);
      const options = shuffleArray([
        currentQuestion,
        ...shuffledIncorrect.slice(0, 2),
      ]);
      setChoices(options);
    }
  }, [currentQuestion, vocabulary]);

  const handleAnswer = (selectedId: string) => {
    if (isAnswered) return;
    
    setSelectedAnswerId(selectedId);
    setIsAnswered(true);

    if (selectedId === currentQuestion?.id) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswerId(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-4 text-slate-700">Quiz Complete!</h2>
        <p className="text-xl text-slate-600 mb-6">
          Your final score is:
        </p>
        <p className="text-6xl font-bold text-indigo-600 mb-8">
          {score} / {quizQuestions.length}
        </p>
        <button
          onClick={generateNewQuiz}
          className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
        >
          Start New Quiz
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
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
                Question {currentQuestionIndex + 1} of {quizQuestions.length}
            </div>
            <div className="text-sm font-semibold text-slate-600 bg-slate-200 px-3 py-1 rounded-full">
                Score: {score}
            </div>
        </div>
      <div className="bg-white p-8 rounded-lg shadow-lg mb-6 text-center">
        <p className="text-lg text-slate-500 mb-2">What is the meaning of:</p>
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
      
      {isAnswered && (
        <div className="mt-8 text-center">
            <button
                onClick={handleNextQuestion}
                className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
            >
                {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
        </div>
      )}
    </div>
  );
};

export default Quiz;
