import { useEffect, useMemo, useState } from 'react';

const TOTAL_QUESTIONS = 10;
const SCORE_LOG_STORAGE_KEY = 'capitaine-calcul-score-log';
const MAX_SCORE_LOG_ENTRIES = 6;

const POSITIVE_MESSAGES = [
  'Bravo Florian, super héros des chiffres !',
  'Yes Florian ! Tu as dégainé la bonne réponse !',
  'Génial Florian, tu vises juste !',
  'Tu progresses à la vitesse de la lumière, Florian !',
  'Fantastique Florian, tu domptes les multiplications !',
] as const;

const ENCOURAGEMENT_MESSAGES = [
  'Pas grave Florian, on retente au prochain coup !',
  'Respire un grand coup Florian, tu vas y arriver !',
  'Chaque erreur est un tremplin pour réussir, capitaine Florian !',
  'Courage Florian, tu deviens un pro des tables !',
  'On continue Florian, la victoire est proche !',
] as const;

const MOTIVATION_PROMPTS = [
  '✨ Florian, mission : devenir champion des multiplications !',
  '🚀 Plus tu joues, plus ton cerveau muscle ses super-pouvoirs Florian !',
  '🎯 Florian, un pas à la fois et tu connaîtras toutes les tables !',
  '🧠 Ton cerveau brille, continue comme ça Florian !',
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

type ScoreLogEntry = {
  id: string;
  playedAt: string;
  score: number;
  total: number;
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

const formatLogDate = (isoDate: string) => {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  try {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return formatter.format(date);
  } catch (error) {
    console.warn('Date de score invalide, affichage simplifié :', isoDate, error);
    return 'Score précédent';
  }
};

const sanitiseScoreLogEntry = (entry: unknown, index: number, fallbackSeed: number): ScoreLogEntry | null => {
  if (typeof entry !== 'object' || entry === null) {
    return null;
  }

  const raw = entry as Record<string, unknown>;
  const score = Number(raw.score);
  const total = Number(raw.total ?? TOTAL_QUESTIONS);

  if (!Number.isFinite(score) || !Number.isFinite(total)) {
    return null;
  }

  const id = typeof raw.id === 'string' && raw.id.trim().length > 0
    ? raw.id
    : `legacy-${fallbackSeed}-${index}`;

  const rawDate = typeof raw.playedAt === 'string' ? raw.playedAt : '';
  const parsedDate = rawDate ? new Date(rawDate) : null;
  const playedAt = parsedDate && !Number.isNaN(parsedDate.getTime())
    ? parsedDate.toISOString()
    : new Date(fallbackSeed - index * 60_000).toISOString();

  return {
    id,
    playedAt,
    score,
    total,
  };
};

const readStoredScoreLog = (): ScoreLogEntry[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(SCORE_LOG_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as ScoreLogEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    const fallbackSeed = Date.now();

    return parsed
      .map((entry, index) => sanitiseScoreLogEntry(entry, index, fallbackSeed))
      .filter((entry): entry is ScoreLogEntry => Boolean(entry))
      .slice(0, MAX_SCORE_LOG_ENTRIES);
  } catch (error) {
    console.error('Impossible de lire le registre des scores :', error);
    return [];
  }
};

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
  const [scoreLog, setScoreLog] = useState<ScoreLogEntry[]>(() => readStoredScoreLog());

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

    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);
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
      const logEntry: ScoreLogEntry = {
        id: `${Date.now()}`,
        playedAt: new Date().toISOString(),
        score: newScore,
        total: TOTAL_QUESTIONS,
      };

      setScoreLog(prev => [logEntry, ...prev].slice(0, MAX_SCORE_LOG_ENTRIES));
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(SCORE_LOG_STORAGE_KEY, JSON.stringify(scoreLog));
    } catch (error) {
      console.error("Impossible d'enregistrer le journal des scores :", error);
    }
  }, [scoreLog]);

  const progressPercent = quizFinished
    ? 100
    : Math.round((questionsAnswered / TOTAL_QUESTIONS) * 100);

  const questionNumber = quizFinished ? TOTAL_QUESTIONS : questionsAnswered + 1;

  const motivationMessage = useMemo(() => {
    if (quizFinished) {
      if (score === TOTAL_QUESTIONS) {
        return '🌟 Score parfait Florian ! Tu es le maître des multiplications !';
      }
      if (score >= 8) {
        return '🏅 Impressionnant Florian ! Encore une mission pour devenir imbattable ?';
      }
      if (score >= 5) {
        return '💪 Beau travail Florian ! Un petit entraînement de plus et tu seras au top.';
      }
      return '🔁 Chaque partie te rapproche du super-héros des maths, Florian !';
    }

    if (streak >= 3) {
      return `🔥 ${streak} réponses justes d'affilée, Florian, quelle fusée !`;
    }

    switch (questionsAnswered) {
      case 0:
        return '🚀 Prêt pour ta mission spéciale multiplications, Florian ?';
      case 1:
        return '🎉 Une de faite, Florian ! Continue comme ça !';
      case 5:
        return '🧠 Tu es déjà à mi-parcours Florian, ne lâche rien !';
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
          <div className="hero">
            <p className="badge">Mission Multiplications</p>
            <h1>Capitaine Calcul</h1>
            <p className="subtitle">
              Florian, relève les {TOTAL_QUESTIONS} défis et décroche toutes les étoiles !
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

        <div className="game-body">
          <section
            className={`primary-panel ${quizFinished ? 'primary-panel-summary' : 'primary-panel-question'}`}
            aria-live={quizFinished ? 'polite' : undefined}
          >
            {quizFinished ? (
              <div className="summary">
                <div className="summary-header">
                  <h2>Mission accomplie Florian !</h2>
                  <p className="summary-badge">{finalBadge}</p>
                </div>
                <p className="summary-score">
                  Tu as obtenu <strong>{score}</strong> point{score > 1 ? 's' : ''} sur {TOTAL_QUESTIONS}.
                </p>

                <ul className="history-grid">
                  {history.map((entry, index) => (
                    <li
                      key={`${entry.expression}-${index}`}
                      className={entry.isCorrect ? 'history-correct' : 'history-wrong'}
                    >
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
              </div>
            ) : (
              <div className="question-area">
                <div className="question-card">
                  <div className="question-info">
                    <p className="question-label">Défi #{questionNumber}</p>
                    <p className="question-expression">
                      <span>{currentFactors[0]}</span>
                      <span className="question-symbol">×</span>
                      <span>{currentFactors[1]}</span>
                    </p>
                  </div>
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
              </div>
            )}
          </section>

          <aside className="status-panel">
            <section className="status-card progress-card" aria-label="Progression du quiz">
              <header className="status-heading">
                <h2>Progression</h2>
                <span className="progress-percent">{progressPercent}%</span>
              </header>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </section>

            {lastResult && (
              <section
                className={`status-card last-result ${
                  lastResult.isCorrect ? 'last-result-correct' : 'last-result-wrong'
                }`}
                role="status"
                aria-live="polite"
              >
                <span className="last-result-emoji">{lastResult.isCorrect ? '🎉' : '💡'}</span>
                <div>
                  <p className="last-result-message">{lastResult.message}</p>
                  <p className="last-result-detail">{lastResult.detail}</p>
                </div>
              </section>
            )}

            <section className="status-card mascot-card">
              <div className="mascot-avatar" aria-hidden="true">
                🤖
              </div>
              <p className="mascot-bubble">{motivationMessage}</p>
            </section>

            <section className="status-card log-card">
              <header className="status-heading">
                <h2>Journal des missions</h2>
                <span className="log-helper">Scores de Florian</span>
              </header>
              {scoreLog.length > 0 ? (
                <ul className="log-list">
                  {scoreLog.map(entry => (
                    <li key={entry.id}>
                      <span className="log-date">{formatLogDate(entry.playedAt)}</span>
                      <span className="log-score">
                        {entry.score} / {entry.total}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="log-empty">Joue une première partie pour remplir ton journal, Florian !</p>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default App;
