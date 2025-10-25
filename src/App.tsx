import { useMemo, useState } from 'react';

const TOTAL_QUESTIONS = 10;

const POSITIVE_MESSAGES = [
  'Bravo, super héros des chiffres !',
  'Yes ! Tu as dégainé la bonne réponse !',
  'Génial, tu vises juste !',
  'Tu progresses à la vitesse de la lumière !',
  'Fantastique, tu domptes les multiplications !',
] as const;

const ENCOURAGEMENT_MESSAGES = [
  "Pas grave, on retente au prochain coup !",
  'Respire un grand coup, tu vas y arriver !',
  'Chaque erreur est un tremplin pour réussir !',
  'Courage, tu deviens un pro des tables !',
  'On continue, la victoire est proche !',
] as const;

const MOTIVATION_PROMPTS = [
  '✨ Mission: devenir champion des multiplications !',
  '🚀 Plus tu joues, plus ton cerveau muscle ses super-pouvoirs !',
  '🎯 Un pas à la fois et tu connaîtras toutes les tables !',
  '🧠 Ton cerveau brille, continue comme ça !',
] as const;

type Question = {
  factors: [number, number];
  options: number[];
  correctAnswer: number;
};

type HistoryEntry = {
  expression: string;
  correctAnswer: number;
  playerAnswer: number;
  isCorrect: boolean;
};

type LastResult = {
  isCorrect: boolean;
  message: string;
  detail: string;
};

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = <T,>(items: T[]): T[] => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const pick = <T,>(list: readonly T[]): T => list[randomInt(0, list.length - 1)];

const createQuestion = (): Question => {
  const factorA = randomInt(2, 10);
  const factorB = randomInt(2, 10);
  const correctAnswer = factorA * factorB;

  const wrongAnswers = new Set<number>();
  while (wrongAnswers.size < 2) {
    const candidate = randomInt(2, 10) * randomInt(2, 10);
    if (candidate !== correctAnswer) {
      wrongAnswers.add(candidate);
    }
  }

  const options = shuffle([correctAnswer, ...wrongAnswers]);
  return {
    factors: [factorA, factorB],
    correctAnswer,
    options,
  };
};

const App: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<Question>(() => createQuestion());
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [streak, setStreak] = useState(0);

  const handleAnswer = (choice: number) => {
    if (quizFinished) {
      return;
    }

    const { factors, correctAnswer } = currentQuestion;
    const [a, b] = factors;
    const isCorrect = choice === correctAnswer;
    const newTotalAnswered = questionsAnswered + 1;

    setHistory(prev => [
      ...prev,
      {
        expression: `${a} × ${b}`,
        correctAnswer,
        playerAnswer: choice,
        isCorrect,
      },
    ]);

    setScore(prev => prev + (isCorrect ? 1 : 0));
    setStreak(prev => (isCorrect ? prev + 1 : 0));
    setLastResult({
      isCorrect,
      message: isCorrect ? pick(POSITIVE_MESSAGES) : pick(ENCOURAGEMENT_MESSAGES),
      detail: isCorrect
        ? `${a} × ${b} = ${correctAnswer}`
        : `La bonne réponse était ${correctAnswer}.`,
    });

    setQuestionsAnswered(newTotalAnswered);

    if (newTotalAnswered >= TOTAL_QUESTIONS) {
      setQuizFinished(true);
    } else {
      setCurrentQuestion(createQuestion());
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(createQuestion());
    setQuestionsAnswered(0);
    setScore(0);
    setHistory([]);
    setQuizFinished(false);
    setLastResult(null);
    setStreak(0);
  };

  const progressPercent = quizFinished
    ? 100
    : Math.round((questionsAnswered / TOTAL_QUESTIONS) * 100);

  const questionNumber = quizFinished ? TOTAL_QUESTIONS : questionsAnswered + 1;

  const motivationMessage = useMemo(() => {
    if (quizFinished) {
      if (score === TOTAL_QUESTIONS) {
        return '🌟 Score parfait ! Tu es le maître des multiplications !';
      }
      if (score >= 8) {
        return '🏅 Impressionnant ! Encore une partie pour devenir imbattable ?';
      }
      if (score >= 5) {
        return '💪 Beau travail ! Un petit entraînement de plus et tu seras au top.';
      }
      return '🔁 Chaque partie te rapproche du super-héros des maths !';
    }

    if (streak >= 3) {
      return `🔥 ${streak} réponses justes d'affilée, quelle fusée !`;
    }

    switch (questionsAnswered) {
      case 0:
        return '🚀 Prêt pour une mission spéciale multiplications ?';
      case 1:
        return '🎉 Une de faite, continue comme ça !';
      case 5:
        return '🧠 Tu es déjà à mi-parcours, ne lâche rien !';
      default:
        return pick(MOTIVATION_PROMPTS);
    }
  }, [quizFinished, questionsAnswered, score, streak]);

  const finalBadge = useMemo(() => {
    const ratio = score / TOTAL_QUESTIONS;
    if (ratio === 1) {
      return '🏆 Capitaine Calcul Ultime';
    }
    if (ratio >= 0.8) {
      return '🥇 Héros des Multiplications';
    }
    if (ratio >= 0.5) {
      return '🥈 Explorateur Malin';
    }
    return '🥉 Apprenti Courageux';
  }, [score]);

  const currentFactors = currentQuestion.factors;

  return (
    <div className="app">
      <main className="game-card">
        <header className="game-header">
          <div>
            <p className="badge">Mission Multiplications</p>
            <h1>Capitaine Calcul</h1>
            <p className="subtitle">
              Réponds aux {TOTAL_QUESTIONS} défis et gagne un maximum d'étoiles !
            </p>
          </div>
          <div className="scoreboard" aria-live="polite">
            <div className="score-box">
              <span className="score-label">Score</span>
              <span className="score-value">{score}</span>
              <span className="score-helper">sur {TOTAL_QUESTIONS}</span>
            </div>
            <div className="score-box">
              <span className="score-label">Question</span>
              <span className="score-value">{questionNumber}</span>
              <span className="score-helper">/ {TOTAL_QUESTIONS}</span>
            </div>
            <div className="score-box">
              <span className="score-label">Série</span>
              <span className="score-value">{streak}</span>
              <span className="score-helper">d'affilée</span>
            </div>
          </div>
        </header>

        <section className="progress-section" aria-label="Progression du quiz">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="progress-text">Progression : {progressPercent}%</span>
        </section>

        {lastResult && (
          <div
            className={`last-result ${lastResult.isCorrect ? 'last-result-correct' : 'last-result-wrong'}`}
            role="status"
            aria-live="polite"
          >
            <span className="last-result-emoji">{lastResult.isCorrect ? '🎉' : '💡'}</span>
            <div>
              <p className="last-result-message">{lastResult.message}</p>
              <p className="last-result-detail">{lastResult.detail}</p>
            </div>
          </div>
        )}

        <section className="mascot-area">
          <div className="mascot-avatar" aria-hidden="true">
            🤖
          </div>
          <p className="mascot-bubble">{motivationMessage}</p>
        </section>

        {quizFinished ? (
          <section className="summary" aria-live="polite">
            <h2>Mission accomplie !</h2>
            <p className="summary-score">
              Tu as obtenu <strong>{score}</strong> point{score > 1 ? 's' : ''} sur {TOTAL_QUESTIONS}.
            </p>
            <p className="summary-badge">{finalBadge}</p>

            <ul className="history-list">
              {history.map((entry, index) => (
                <li key={`${entry.expression}-${index}`} className={entry.isCorrect ? 'history-correct' : 'history-wrong'}>
                  <span className="history-step">Q{index + 1}</span>
                  <span className="history-expression">{entry.expression}</span>
                  <span className="history-answer">
                    {entry.playerAnswer}
                    {entry.isCorrect ? ' ✅' : ` → ${entry.correctAnswer}`}
                  </span>
                </li>
              ))}
            </ul>

            <button type="button" className="restart-button" onClick={handleRestart}>
              Rejouer la mission
            </button>
          </section>
        ) : (
          <section className="question-area">
            <div className="question-card">
              <p className="question-label">Défi #{questionNumber}</p>
              <p className="question-expression">
                <span>{currentFactors[0]}</span>
                <span className="question-symbol">×</span>
                <span>{currentFactors[1]}</span>
              </p>
            </div>

            <p className="question-instruction">Choisis la bonne réponse :</p>
            <div className="options-grid">
              {currentQuestion.options.map(option => (
                <button
                  type="button"
                  key={option}
                  className="option-button"
                  onClick={() => handleAnswer(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
