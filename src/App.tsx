
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

const TOTAL_QUESTIONS = 10;
const SCORE_LOG_STORAGE_KEY = 'capitaine-calcul-score-log';
const MAX_SCORE_LOG_ENTRIES = 6;

type SubjectKey = 'maths' | 'francais';

type MultiplicationQuestion = {
  id: string;
  kind: 'multiplication';
  factors: [number, number];
  options: number[];
  correctAnswer: number;
};

type FillInQuestion = {
  id: string;
  kind: 'fill-in';
  sentence: string;
  options: string[];
  correctAnswer: string;
};

type Question = MultiplicationQuestion | FillInQuestion;

type HistoryEntry = {
  id: string;
  prompt: string;
  correctAnswer: string;
  playerAnswer: string;
  isCorrect: boolean;
  completedSentence?: string;
};

type LastResult = {
  isCorrect: boolean;
  message: string;
  detail: string;
};

type FillInTemplate = {
  id: string;
  sentence: string;
  correctAnswer: string;
  options: readonly string[];
};

type SubjectMessages = {
  positives: readonly string[];
  encouragements: readonly string[];
  motivations: readonly string[];
  start: string;
  afterOne: string;
  mid: string;
  streak: (count: number) => string;
  finishPerfect: string;
  finishGreat: string;
  finishGood: string;
  finishTryAgain: string;
};

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = <T,>(items: readonly T[]): T[] => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const pick = <T,>(list: readonly T[]): T => list[randomInt(0, list.length - 1)];

const SUBJECT_MESSAGES: Record<SubjectKey, SubjectMessages> = {
  maths: {
    positives: [
      'Bravo Florian, super héros des chiffres !',
      'Yes Florian ! Tu as dégainé la bonne réponse !',
      'Génial Florian, tu vises juste !',
      'Tu progresses à la vitesse de la lumière, Florian !',
      'Fantastique Florian, tu domptes les multiplications !',
    ],
    encouragements: [
      'Pas grave Florian, on retente au prochain coup !',
      'Respire un grand coup Florian, tu vas y arriver !',
      'Chaque erreur est un tremplin pour réussir, capitaine Florian !',
      'Courage Florian, tu deviens un pro des tables !',
      'On continue Florian, la victoire est proche !',
    ],
    motivations: [
      '✨ Florian, mission : devenir champion des multiplications !',
      '🚀 Plus tu joues, plus ton cerveau muscle ses super-pouvoirs Florian !',
      '🎯 Florian, un pas à la fois et tu connaîtras toutes les tables !',
      '🧠 Ton cerveau brille, continue comme ça Florian !',
    ],
    start: '🚀 Prêt pour ta mission spéciale multiplications, Florian ?',
    afterOne: '🎉 Une de faite, Florian ! Continue comme ça !',
    mid: '🧠 Tu es déjà à mi-parcours Florian, ne lâche rien !',
    streak: count => `🔥 ${count} réponses justes d'affilée, Florian, quelle fusée !`,
    finishPerfect: '🌟 Score parfait Florian ! Tu es le maître des multiplications !',
    finishGreat: '🏅 Impressionnant Florian ! Encore une mission pour devenir imbattable ?',
    finishGood: '💪 Beau travail Florian ! Un petit entraînement de plus et tu seras au top.',
    finishTryAgain: '🔁 Chaque partie te rapproche du super-héros des maths, Florian !',
  },
  francais: {
    positives: [
      "Bravo Florian, tu choisis les bons mots !",
      "Yes Florian ! Tes phrases sont impeccables !",
      "Génial Florian, ton français brille !",
      "Tu deviens un as des mots, Florian !",
      "Super Florian, ces phrases sont parfaites !",
    ],
    encouragements: [
      "Pas grave Florian, on révise ces mots ensemble !",
      "Respire Florian, tu trouveras le bon mot !",
      "Chaque erreur t'aide à maîtriser le français, capitaine Florian !",
      "Courage Florian, les bonnes réponses arrivent !",
      "On continue Florian, tes phrases vont être impeccables !",
    ],
    motivations: [
      "✨ Florian, mission : devenir champion des mots !",
      "🚀 Chaque phrase juste te rend plus fort en français, Florian !",
      "🎯 Florian, choisis bien les mots pour gagner le quiz !",
      "🧠 Ton français s'améliore à chaque question, continue Florian !",
    ],
    start: "📚 Prêt pour ta mission spéciale mots, Florian ?",
    afterOne: "📝 Une phrase réussie, continue Florian !",
    mid: "💡 Tu as déjà corrigé la moitié des phrases Florian, bravo !",
    streak: count => `🔥 ${count} bonnes réponses d'affilée, quel pro des mots Florian !`,
    finishPerfect: "🌟 Score parfait Florian ! Tes phrases sont irréprochables !",
    finishGreat: "🏅 Impressionnant Florian ! Tu maîtrises presque toutes les phrases !",
    finishGood: "💪 Beau travail Florian ! Encore un peu et les mots n'auront plus de secrets.",
    finishTryAgain: "🔁 Chaque partie te rapproche d'un français impeccable, Florian !",
  },
};

const ET_EST_TEMPLATES: readonly FillInTemplate[] = [
  { id: 'et-est-1', sentence: 'Florian ___ Lucas jouent dans le jardin.', correctAnswer: 'et', options: ['et', 'est'] },
  { id: 'et-est-2', sentence: 'Le gâteau ___ très bon.', correctAnswer: 'est', options: ['et', 'est'] },
  { id: 'et-est-3', sentence: "Il fait froid ___ humide aujourd'hui.", correctAnswer: 'et', options: ['et', 'est'] },
  { id: 'et-est-4', sentence: 'Cette réponse ___ excellente.', correctAnswer: 'est', options: ['et', 'est'] },
  { id: 'et-est-5', sentence: 'Papa ___ maman préparent le dîner.', correctAnswer: 'et', options: ['et', 'est'] },
  { id: 'et-est-6', sentence: 'La mission ___ presque terminée.', correctAnswer: 'est', options: ['et', 'est'] },
  { id: 'et-est-7', sentence: 'La maîtresse ___ les élèves chantent ensemble.', correctAnswer: 'et', options: ['et', 'est'] },
  { id: 'et-est-8', sentence: 'Ce jeu ___ facile pour Florian.', correctAnswer: 'est', options: ['et', 'est'] },
  { id: 'et-est-9', sentence: 'Il rit ___ court partout.', correctAnswer: 'et', options: ['et', 'est'] },
  { id: 'et-est-10', sentence: 'Le robot ___ prêt à aider.', correctAnswer: 'est', options: ['et', 'est'] },
];

const A_A_TEMPLATES: readonly FillInTemplate[] = [
  { id: 'a-a-1', sentence: 'Florian ___ terminé ses devoirs.', correctAnswer: 'a', options: ['a', 'à'] },
  { id: 'a-a-2', sentence: "Il va ___ l'école en vélo.", correctAnswer: 'à', options: ['a', 'à'] },
  { id: 'a-a-3', sentence: 'Maman ___ préparé un goûter délicieux.', correctAnswer: 'a', options: ['a', 'à'] },
  { id: 'a-a-4', sentence: 'Nous allons ___ la piscine ce soir.', correctAnswer: 'à', options: ['a', 'à'] },
  { id: 'a-a-5', sentence: 'La classe ___ une sortie demain.', correctAnswer: 'a', options: ['a', 'à'] },
  { id: 'a-a-6', sentence: 'Le chat saute ___ la fenêtre.', correctAnswer: 'à', options: ['a', 'à'] },
  { id: 'a-a-7', sentence: 'Papa offre un livre ___ Florian.', correctAnswer: 'à', options: ['a', 'à'] },
  { id: 'a-a-8', sentence: 'Florian ___ reçu un nouveau jeu.', correctAnswer: 'a', options: ['a', 'à'] },
  { id: 'a-a-9', sentence: 'Il pense souvent ___ ses cousins.', correctAnswer: 'à', options: ['a', 'à'] },
  { id: 'a-a-10', sentence: 'La maîtresse ___ félicité toute la classe.', correctAnswer: 'a', options: ['a', 'à'] },
];

const OU_AU_AUX_TEMPLATES: readonly FillInTemplate[] = [
  { id: 'ou-au-aux-1', sentence: 'Florian va ___ parc avec son papa.', correctAnswer: 'au', options: ['ou', 'au', 'aux'] },
  { id: 'ou-au-aux-2', sentence: "Tu veux du jus ___ de l'eau ?", correctAnswer: 'ou', options: ['ou', 'au', 'aux'] },
  { id: 'ou-au-aux-3', sentence: 'Les élèves jouent ___ billes à la récré.', correctAnswer: 'aux', options: ['ou', 'au', 'aux'] },
  { id: 'ou-au-aux-4', sentence: 'Nous partons ___ marché ce matin.', correctAnswer: 'au', options: ['ou', 'au', 'aux'] },
  { id: 'ou-au-aux-5', sentence: 'Il hésite entre chocolat ___ vanille.', correctAnswer: 'ou', options: ['ou', 'au', 'aux'] },
  { id: 'ou-au-aux-6', sentence: 'La maîtresse parle ___ parents de Florian.', correctAnswer: 'aux', options: ['ou', 'au', 'aux'] },
  { id: 'ou-au-aux-7', sentence: 'La bibliothèque est ___ premier étage.', correctAnswer: 'au', options: ['ou', 'au', 'aux'] },
  { id: 'ou-au-aux-8', sentence: 'Vous offrez des dessins ___ voisins.', correctAnswer: 'aux', options: ['ou', 'au', 'aux'] },
  { id: 'ou-au-aux-9', sentence: 'Florian préfère lire ___ regarder la télé.', correctAnswer: 'ou', options: ['ou', 'au', 'aux'] },
  { id: 'ou-au-aux-10', sentence: 'Ils répondent ___ questions du quiz.', correctAnswer: 'aux', options: ['ou', 'au', 'aux'] },
];

const createMultiplicationQuestion = (index: number): MultiplicationQuestion => {
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
    id: `multi-${index}-${factorA}-${factorB}-${Math.random().toString(36).slice(2, 8)}`,
    kind: 'multiplication',
    factors: [factorA, factorB],
    options,
    correctAnswer,
  };
};

const createMultiplicationQuestionSet = (): MultiplicationQuestion[] =>
  Array.from({ length: TOTAL_QUESTIONS }, (_, index) => createMultiplicationQuestion(index));

const createFillInQuestionSet = (templates: readonly FillInTemplate[]): FillInQuestion[] => {
  const pool = shuffle(templates);
  const available = pool.length >= TOTAL_QUESTIONS ? pool.slice(0, TOTAL_QUESTIONS) : pool;
  const result: FillInQuestion[] = available.map(template => ({
    id: template.id,
    kind: 'fill-in',
    sentence: template.sentence,
    options: [...template.options],
    correctAnswer: template.correctAnswer,
  }));

  while (result.length < TOTAL_QUESTIONS && pool.length > 0) {
    const template = pool[result.length % pool.length];
    result.push({
      id: `${template.id}-${result.length}`,
      kind: 'fill-in',
      sentence: template.sentence,
      options: [...template.options],
      correctAnswer: template.correctAnswer,
    });
  }

  return result;
};

type CategoryConfig = {
  subject: SubjectKey;
  label: string;
  shortLabel: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  questionLabel: string;
  questionInstruction: string;
  summaryTitle: string;
  restartLabel: string;
  createQuestionSet: () => Question[];
};

const CATEGORY_CONFIGS = {
  'maths-multiplications': {
    subject: 'maths',
    label: 'Maths · Tables de multiplication',
    shortLabel: 'Maths · Multiplications',
    heroBadge: 'Mission Multiplications',
    heroTitle: 'Capitaine Calcul',
    heroSubtitle: `Florian, relève les ${TOTAL_QUESTIONS} défis et décroche toutes les étoiles !`,
    questionLabel: 'Défi',
    questionInstruction: 'Choisis la bonne réponse :',
    summaryTitle: 'Mission accomplie Florian !',
    restartLabel: 'Rejouer la mission',
    createQuestionSet: () => createMultiplicationQuestionSet(),
  },
  'francais-et-est': {
    subject: 'francais',
    label: 'Français · et / est',
    shortLabel: 'Français · et / est',
    heroBadge: 'Mission Orthographe',
    heroTitle: 'Capitaine des Mots',
    heroSubtitle: 'Florian, complète les phrases avec les bons mots magiques !',
    questionLabel: 'Phrase',
    questionInstruction: 'Sélectionne la bonne orthographe :',
    summaryTitle: 'Mission mots réussie Florian !',
    restartLabel: 'Rejouer ce test',
    createQuestionSet: () => createFillInQuestionSet(ET_EST_TEMPLATES),
  },
  'francais-a-a': {
    subject: 'francais',
    label: 'Français · a / à',
    shortLabel: 'Français · a / à',
    heroBadge: 'Mission Orthographe',
    heroTitle: 'Capitaine des Mots',
    heroSubtitle: 'Florian, trouve le bon accent pour chaque phrase !',
    questionLabel: 'Phrase',
    questionInstruction: 'Choisis la bonne réponse :',
    summaryTitle: 'Mission mots réussie Florian !',
    restartLabel: 'Rejouer ce test',
    createQuestionSet: () => createFillInQuestionSet(A_A_TEMPLATES),
  },
  'francais-ou-au-aux': {
    subject: 'francais',
    label: 'Français · ou / au / aux',
    shortLabel: 'Français · ou / au / aux',
    heroBadge: 'Mission Orthographe',
    heroTitle: 'Capitaine des Mots',
    heroSubtitle: 'Florian, complète les phrases en choisissant la bonne petite syllabe !',
    questionLabel: 'Phrase',
    questionInstruction: 'Sélectionne la bonne orthographe :',
    summaryTitle: 'Mission mots réussie Florian !',
    restartLabel: 'Rejouer ce test',
    createQuestionSet: () => createFillInQuestionSet(OU_AU_AUX_TEMPLATES),
  },
} as const satisfies Record<string, CategoryConfig>;

type CategoryId = keyof typeof CATEGORY_CONFIGS;

const DEFAULT_CATEGORY_ID: CategoryId = 'maths-multiplications';

type ScoreLogEntry = {
  id: string;
  playedAt: string;
  score: number;
  total: number;
  categoryId: CategoryId;
};

const isCategoryId = (value: string): value is CategoryId => value in CATEGORY_CONFIGS;

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

  const rawCategory = typeof raw.categoryId === 'string' ? raw.categoryId : '';
  const categoryId = isCategoryId(rawCategory) ? rawCategory : DEFAULT_CATEGORY_ID;

  return {
    id,
    playedAt,
    score,
    total,
    categoryId,
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

const App = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId>(DEFAULT_CATEGORY_ID);
  const [questionSet, setQuestionSet] = useState<Question[]>(
    () => CATEGORY_CONFIGS[DEFAULT_CATEGORY_ID].createQuestionSet(),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [scoreLog, setScoreLog] = useState<ScoreLogEntry[]>(() => readStoredScoreLog());

  const currentCategory = CATEGORY_CONFIGS[selectedCategoryId];
  const subjectMessages = SUBJECT_MESSAGES[currentCategory.subject];
  const currentQuestion = questionSet[currentIndex];

  const resetQuizState = (categoryId: CategoryId) => {
    const config = CATEGORY_CONFIGS[categoryId];
    setSelectedCategoryId(categoryId);
    setQuestionSet(config.createQuestionSet());
    setCurrentIndex(0);
    setQuestionsAnswered(0);
    setScore(0);
    setHistory([]);
    setQuizFinished(false);
    setLastResult(null);
    setStreak(0);
  };

  const handleAnswer = (choice: string) => {
    if (!currentQuestion || quizFinished) {
      return;
    }

    const expectedAnswer = currentQuestion.kind === 'multiplication'
      ? String(currentQuestion.correctAnswer)
      : currentQuestion.correctAnswer;

    const isCorrect = choice === expectedAnswer;
    const newTotalAnswered = questionsAnswered + 1;
    const newScore = isCorrect ? score + 1 : score;

    const prompt = currentQuestion.kind === 'multiplication'
      ? `${currentQuestion.factors[0]} × ${currentQuestion.factors[1]}`
      : currentQuestion.sentence;

    const completedSentence = currentQuestion.kind === 'fill-in'
      ? currentQuestion.sentence.replace('___', expectedAnswer)
      : undefined;

    setHistory(prev => ([
      ...prev,
      {
        id: `${currentQuestion.id}-${newTotalAnswered}`,
        prompt,
        correctAnswer: expectedAnswer,
        playerAnswer: choice,
        isCorrect,
        completedSentence,
      },
    ]));

    setScore(newScore);
    setStreak(prev => (isCorrect ? prev + 1 : 0));

    const detail = currentQuestion.kind === 'multiplication'
      ? `${currentQuestion.factors[0]} × ${currentQuestion.factors[1]} = ${currentQuestion.correctAnswer}`
      : isCorrect
        ? completedSentence ?? ''
        : `La bonne réponse était « ${expectedAnswer} » : ${completedSentence ?? ''}`;

    setLastResult({
      isCorrect,
      message: isCorrect ? pick(subjectMessages.positives) : pick(subjectMessages.encouragements),
      detail,
    });

    setQuestionsAnswered(newTotalAnswered);

    if (newTotalAnswered >= TOTAL_QUESTIONS) {
      const logEntry: ScoreLogEntry = {
        id: `${Date.now()}`,
        playedAt: new Date().toISOString(),
        score: newScore,
        total: TOTAL_QUESTIONS,
        categoryId: selectedCategoryId,
      };

      setScoreLog(prev => [logEntry, ...prev].slice(0, MAX_SCORE_LOG_ENTRIES));
      setQuizFinished(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleRestart = () => {
    resetQuizState(selectedCategoryId);
  };

  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextCategory = event.target.value;
    if (!isCategoryId(nextCategory)) {
      return;
    }
    resetQuizState(nextCategory);
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

  const questionNumber = quizFinished ? TOTAL_QUESTIONS : currentIndex + 1;

  const motivationMessage = useMemo(() => {
    if (quizFinished) {
      if (score === TOTAL_QUESTIONS) {
        return subjectMessages.finishPerfect;
      }
      if (score >= 8) {
        return subjectMessages.finishGreat;
      }
      if (score >= 5) {
        return subjectMessages.finishGood;
      }
      return subjectMessages.finishTryAgain;
    }

    if (streak >= 3) {
      return subjectMessages.streak(streak);
    }

    switch (questionsAnswered) {
      case 0:
        return subjectMessages.start;
      case 1:
        return subjectMessages.afterOne;
      case 5:
        return subjectMessages.mid;
      default:
        return pick(subjectMessages.motivations);
    }
  }, [quizFinished, score, streak, questionsAnswered, subjectMessages]);

  const finalBadge = useMemo(() => {
    const ratio = score / TOTAL_QUESTIONS;
    if (ratio === 1) {
      return '🏆 Capitaine Super-Star';
    }
    if (ratio >= 0.8) {
      return '🥇 Héros des Missions';
    }
    if (ratio >= 0.5) {
      return '🥈 Explorateur Malin';
    }
    return '🥉 Apprenti Courageux';
  }, [score]);

  const formatHistoryAnswer = (value: string) => (Number.isNaN(Number(value)) ? `« ${value} »` : value);

  const resolvedCurrentQuestion = quizFinished ? null : currentQuestion;

  return (
    <div className="app">
      <main className="game-card">
        <header className="game-header">
          <div className="hero">
            <p className="badge">{currentCategory.heroBadge}</p>
            <h1>{currentCategory.heroTitle}</h1>
            <p className="subtitle">{currentCategory.heroSubtitle}</p>
          </div>

          <div className="header-controls">
            <div className="category-selector">
              <label className="category-label" htmlFor="category-select">
                Choisis ta mission :
              </label>
              <select
                id="category-select"
                className="category-select"
                value={selectedCategoryId}
                onChange={handleCategoryChange}
              >
                {Object.entries(CATEGORY_CONFIGS).map(([id, config]) => (
                  <option key={id} value={id}>
                    {config.label}
                  </option>
                ))}
              </select>
              <p className="category-note">Changer de mission réinitialise le test en cours.</p>
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
                  <h2>{currentCategory.summaryTitle}</h2>
                  <p className="summary-badge">{finalBadge}</p>
                </div>
                <p className="summary-score">
                  Tu as obtenu <strong>{score}</strong> point{score > 1 ? 's' : ''} sur {TOTAL_QUESTIONS}.
                </p>

                <ul className="history-grid">
                  {history.map((entry, index) => (
                    <li
                      key={entry.id}
                      className={entry.isCorrect ? 'history-correct' : 'history-wrong'}
                    >
                      <span className="history-step">Q{index + 1}</span>
                      <span className="history-expression">
                        {entry.prompt.includes('___') ? entry.prompt.replace('___', '____') : entry.prompt}
                        {entry.completedSentence && (
                          <span className="history-completed">{entry.completedSentence}</span>
                        )}
                      </span>
                      <span className="history-answer">
                        {formatHistoryAnswer(entry.playerAnswer)}
                        {entry.isCorrect
                          ? ' ✅'
                          : ` → ${formatHistoryAnswer(entry.correctAnswer)}`}
                      </span>
                    </li>
                  ))}
                </ul>

                <button type="button" className="restart-button" onClick={handleRestart}>
                  {currentCategory.restartLabel}
                </button>
              </div>
            ) : resolvedCurrentQuestion ? (
              <div className="question-area">
                <div
                  className={`question-card ${
                    resolvedCurrentQuestion.kind === 'multiplication'
                      ? 'question-card-maths'
                      : 'question-card-words'
                  }`}
                >
                  <p className="question-label">
                    {currentCategory.questionLabel} #{questionNumber}
                  </p>
                  {resolvedCurrentQuestion.kind === 'multiplication' ? (
                    <p className="question-expression">
                      <span>{resolvedCurrentQuestion.factors[0]}</span>
                      <span className="question-symbol">×</span>
                      <span>{resolvedCurrentQuestion.factors[1]}</span>
                    </p>
                  ) : (
                    <p className="sentence-with-blank">
                      {resolvedCurrentQuestion.sentence.split('___').map((part, partIndex, parts) => (
                        <span key={`part-${partIndex}`} className="sentence-part">
                          {part}
                          {partIndex < parts.length - 1 && (
                            <>
                              <span className="sentence-blank" aria-hidden="true">______</span>
                              <span className="visually-hidden">Zone à compléter</span>
                            </>
                          )}
                        </span>
                      ))}
                    </p>
                  )}
                </div>

                <p className="question-instruction">{currentCategory.questionInstruction}</p>

                <div className="options-grid">
                  {resolvedCurrentQuestion.kind === 'multiplication'
                    ? resolvedCurrentQuestion.options.map(option => (
                        <button
                          type="button"
                          key={option}
                          className="option-button"
                          onClick={() => handleAnswer(String(option))}
                        >
                          {option}
                        </button>
                      ))
                    : resolvedCurrentQuestion.options.map(option => (
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
            ) : null}
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
                  {scoreLog.map(entry => {
                    const category = CATEGORY_CONFIGS[entry.categoryId] ?? CATEGORY_CONFIGS[DEFAULT_CATEGORY_ID];
                    return (
                      <li key={entry.id}>
                        <div className="log-row">
                          <span className="log-date">{formatLogDate(entry.playedAt)}</span>
                          <span className="log-score">
                            {entry.score} / {entry.total}
                          </span>
                        </div>
                        <span className="log-category">{category.shortLabel}</span>
                      </li>
                    );
                  })}
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
