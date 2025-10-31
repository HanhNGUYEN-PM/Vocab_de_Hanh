
import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const TOTAL_QUESTIONS = 10;
const SCORE_LOG_STORAGE_KEY = 'capitaine-calcul-score-log';
const MAX_SCORE_LOG_ENTRIES = 6;

type SubjectKey = 'maths' | 'francais';

type MathOperator = '×' | '+' | '−' | '÷';

type MathQuestion = {
  id: string;
  kind: 'math';
  operands: [number, number];
  operator: MathOperator;
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

type Question = MathQuestion | FillInQuestion;

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
      'Bravo Florian, super héros des calculs !',
      'Yes Florian ! Tu as dégainé la bonne réponse !',
      'Génial Florian, tu vises juste !',
      'Tu progresses à la vitesse de la lumière, Florian !',
      'Fantastique Florian, tu domptes les opérations !',
    ],
    encouragements: [
      'Pas grave Florian, on retente au prochain coup !',
      'Respire un grand coup Florian, tu vas y arriver !',
      'Chaque erreur est un tremplin pour réussir, capitaine Florian !',
      'Courage Florian, tu deviens un pro des calculs !',
      'On continue Florian, la victoire est proche !',
    ],
    motivations: [
      '✨ Florian, mission : devenir champion des opérations !',
      '🚀 Plus tu joues, plus ton cerveau muscle ses super-pouvoirs Florian !',
      '🎯 Florian, un pas à la fois et tu maîtrises toutes les opérations !',
      '🧠 Ton cerveau brille, continue comme ça Florian !',
    ],
    start: '🚀 Prêt pour ta mission spéciale calculs, Florian ?',
    afterOne: '🎉 Une de faite, Florian ! Continue comme ça !',
    mid: '🧠 Tu es déjà à mi-parcours Florian, ne lâche rien !',
    streak: count => `🔥 ${count} réponses justes d'affilée, Florian, quelle fusée !`,
    finishPerfect: '🌟 Score parfait Florian ! Tu es le maître des calculs !',
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
  { id: 'et-est-11', sentence: 'Florian ___ son frère construisent une cabane.', correctAnswer: 'et', options: ['et', 'est'] },
  { id: 'et-est-12', sentence: 'Le ciel ___ rempli de nuages.', correctAnswer: 'est', options: ['et', 'est'] },
  { id: 'et-est-13', sentence: "Il faut être patient ___ calme pour réussir.", correctAnswer: 'et', options: ['et', 'est'] },
  { id: 'et-est-14', sentence: 'La soupe ___ trop chaude pour être servie.', correctAnswer: 'est', options: ['et', 'est'] },
  { id: 'et-est-15', sentence: 'Les amis de Florian jouent ___ rient ensemble.', correctAnswer: 'et', options: ['et', 'est'] },
  { id: 'et-est-16', sentence: 'La fusée ___ prête au décollage.', correctAnswer: 'est', options: ['et', 'est'] },
  { id: 'et-est-17', sentence: 'Il aime lire ___ écrire des histoires.', correctAnswer: 'et', options: ['et', 'est'] },
  { id: 'et-est-18', sentence: 'Le chien ___ le chat dorment sur le canapé.', correctAnswer: 'et', options: ['et', 'est'] },
  { id: 'et-est-19', sentence: 'La marelle ___ un jeu amusant.', correctAnswer: 'est', options: ['et', 'est'] },
  { id: 'et-est-20', sentence: 'Florian ___ Mila terminent le puzzle.', correctAnswer: 'et', options: ['et', 'est'] },
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
  { id: 'a-a-11', sentence: 'Le pirate ___ caché son trésor sur l’île.', correctAnswer: 'a', options: ['a', 'à'] },
  { id: 'a-a-12', sentence: 'Nous irons ___ la montagne cet hiver.', correctAnswer: 'à', options: ['a', 'à'] },
  { id: 'a-a-13', sentence: 'Florian ___ invité ses amis pour jouer.', correctAnswer: 'a', options: ['a', 'à'] },
  { id: 'a-a-14', sentence: 'Il aime offrir des dessins ___ ses parents.', correctAnswer: 'à', options: ['a', 'à'] },
  { id: 'a-a-15', sentence: 'La fusée ___ décollé à midi.', correctAnswer: 'a', options: ['a', 'à'] },
  { id: 'a-a-16', sentence: 'Les enfants vont ___ la bibliothèque après l’école.', correctAnswer: 'à', options: ['a', 'à'] },
  { id: 'a-a-17', sentence: 'Florian ___ mangé toute sa soupe.', correctAnswer: 'a', options: ['a', 'à'] },
  { id: 'a-a-18', sentence: 'On se retrouve ___ la sortie de l’école.', correctAnswer: 'à', options: ['a', 'à'] },
  { id: 'a-a-19', sentence: 'La maîtresse ___ expliqué la consigne.', correctAnswer: 'a', options: ['a', 'à'] },
  { id: 'a-a-20', sentence: 'Ils partent ___ la mer demain matin.', correctAnswer: 'à', options: ['a', 'à'] },
];

const EAU_VARIANTS_TEMPLATES: readonly FillInTemplate[] = [
  {
    id: 'eau-variants-1',
    sentence: 'Ces vitr___ sont de toute beauté.',
    correctAnswer: 'aux',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-2',
    sentence: "Je vais prendre le bat___ pour aller sur l'île voisine.",
    correctAnswer: 'eau',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-3',
    sentence: 'Mon amie part en vacances à La___ pendant une semaine.',
    correctAnswer: 'os',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-4',
    sentence: "___ ! mon Dieu ! Qu'as-tu fait ?",
    correctAnswer: 'ô',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-5',
    sentence: "J'ai planté des ros___ dans mon jardin.",
    correctAnswer: 'eaux',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-6',
    sentence: 'Je vais au jud___ trois fois par semaine.',
    correctAnswer: 'o',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-7',
    sentence: "L'eau du ch___ est utilisée en chimie.",
    correctAnswer: 'aux',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-8',
    sentence: "Ce tric___ a été offert à mon ami pour son anniversaire.",
    correctAnswer: 'ot',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-9',
    sentence: 'Ce cartable est trop lourd, vous allez avoir mal du d___.',
    correctAnswer: 'os',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-10',
    sentence: 'Cette jeune maman pousse un land___.',
    correctAnswer: 'au',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-11',
    sentence: 'Le chape___ rouge est posé sur la chaise.',
    correctAnswer: 'au',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-12',
    sentence: 'Les bate___ voguent sur la mer.',
    correctAnswer: 'aux',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-13',
    sentence: 'Il boit un grand verre d___ bien frais.',
    correctAnswer: 'eau',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-14',
    sentence: 'Ces cad___ sont emballés avec soin.',
    correctAnswer: 'eaux',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-15',
    sentence: 'Le pian___ joue une mélodie douce.',
    correctAnswer: 'o',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-16',
    sentence: 'Le cachal___ plonge dans l\'océan.',
    correctAnswer: 'ot',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-17',
    sentence: 'Il protège son d___ avec une écharpe.',
    correctAnswer: 'os',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-18',
    sentence: '___ capitaine ! Le navire est en vue.',
    correctAnswer: 'ô',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-19',
    sentence: 'Le chât___ du roi est immense.',
    correctAnswer: 'eau',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
  {
    id: 'eau-variants-20',
    sentence: 'Les chame___ avancent doucement dans le désert.',
    correctAnswer: 'aux',
    options: ['eau', 'eaux', 'au', 'aux', 'o', 'ô', 'os', 'ot'],
  },
];

const ON_ONT_TEMPLATES: readonly FillInTemplate[] = [
  { id: 'on-ont-1', sentence: 'Ce soir, ___ mange des crêpes chez mamie.', correctAnswer: 'on', options: ['on', 'ont'] },
  { id: 'on-ont-2', sentence: 'Les astronautes ___ réussi leur mission.', correctAnswer: 'ont', options: ['on', 'ont'] },
  { id: 'on-ont-3', sentence: '___ range les jeux après avoir terminé ?', correctAnswer: 'on', options: ['on', 'ont'] },
  { id: 'on-ont-4', sentence: 'Les élèves ___ préparé une surprise pour la maîtresse.', correctAnswer: 'ont', options: ['on', 'ont'] },
  { id: 'on-ont-5', sentence: 'Quand ___ travaille ensemble, tout va plus vite.', correctAnswer: 'on', options: ['on', 'ont'] },
  { id: 'on-ont-6', sentence: 'Les chats ___ dormi toute la journée.', correctAnswer: 'ont', options: ['on', 'ont'] },
  { id: 'on-ont-7', sentence: '___ part jouer dehors après le goûter ?', correctAnswer: 'on', options: ['on', 'ont'] },
  { id: 'on-ont-8', sentence: 'Les héros ___ vaincu le dragon.', correctAnswer: 'ont', options: ['on', 'ont'] },
  { id: 'on-ont-9', sentence: '___ partage ses crayons avec ses amis.', correctAnswer: 'on', options: ['on', 'ont'] },
  { id: 'on-ont-10', sentence: 'Les parents ___ organisé une chasse au trésor.', correctAnswer: 'ont', options: ['on', 'ont'] },
  { id: 'on-ont-11', sentence: '___ a décidé de construire un château de sable.', correctAnswer: 'on', options: ['on', 'ont'] },
  { id: 'on-ont-12', sentence: 'Les explorateurs ___ trouvé une carte secrète.', correctAnswer: 'ont', options: ['on', 'ont'] },
  { id: 'on-ont-13', sentence: '___ frappe à la porte avec impatience.', correctAnswer: 'on', options: ['on', 'ont'] },
  { id: 'on-ont-14', sentence: 'Les oiseaux ___ migré vers le sud.', correctAnswer: 'ont', options: ['on', 'ont'] },
  { id: 'on-ont-15', sentence: '___ prépare un gâteau pour l’anniversaire de Florian.', correctAnswer: 'on', options: ['on', 'ont'] },
  { id: 'on-ont-16', sentence: 'Les robots ___ gagné la compétition.', correctAnswer: 'ont', options: ['on', 'ont'] },
  { id: 'on-ont-17', sentence: '___ joue de la guitare pendant que papa cuisine.', correctAnswer: 'on', options: ['on', 'ont'] },
  { id: 'on-ont-18', sentence: 'Les voisins ___ décoré le sapin ensemble.', correctAnswer: 'ont', options: ['on', 'ont'] },
  { id: 'on-ont-19', sentence: '___ devrait remercier ses amis pour leur aide.', correctAnswer: 'on', options: ['on', 'ont'] },
  { id: 'on-ont-20', sentence: 'Les magiciens ___ présenté un spectacle incroyable.', correctAnswer: 'ont', options: ['on', 'ont'] },
];

const SON_SONT_TEMPLATES: readonly FillInTemplate[] = [
  { id: 'son-sont-1', sentence: 'Florian range ___ cartable après l’école.', correctAnswer: 'son', options: ['son', 'sont'] },
  { id: 'son-sont-2', sentence: 'Les jouets de Florian ___ bien alignés.', correctAnswer: 'sont', options: ['son', 'sont'] },
  { id: 'son-sont-3', sentence: 'Mila raconte ___ aventure préférée.', correctAnswer: 'son', options: ['son', 'sont'] },
  { id: 'son-sont-4', sentence: 'Les pirates ___ cachés sur l’île secrète.', correctAnswer: 'sont', options: ['son', 'sont'] },
  { id: 'son-sont-5', sentence: 'Florian vérifie ___ travail avant de le rendre.', correctAnswer: 'son', options: ['son', 'sont'] },
  { id: 'son-sont-6', sentence: 'Les étoiles ___ brillantes ce soir.', correctAnswer: 'sont', options: ['son', 'sont'] },
  { id: 'son-sont-7', sentence: 'La maîtresse félicite ___ élève pour ses efforts.', correctAnswer: 'son', options: ['son', 'sont'] },
  { id: 'son-sont-8', sentence: 'Les camarades de classe ___ en train de jouer.', correctAnswer: 'sont', options: ['son', 'sont'] },
  { id: 'son-sont-9', sentence: 'Florian cherche ___ livre préféré.', correctAnswer: 'son', options: ['son', 'sont'] },
  { id: 'son-sont-10', sentence: 'Les robots ___ prêts pour la compétition.', correctAnswer: 'sont', options: ['son', 'sont'] },
  { id: 'son-sont-11', sentence: 'Il met ___ casque avant de faire du vélo.', correctAnswer: 'son', options: ['son', 'sont'] },
  { id: 'son-sont-12', sentence: 'Ses parents ___ fiers de lui.', correctAnswer: 'sont', options: ['son', 'sont'] },
  { id: 'son-sont-13', sentence: 'Florian remplit ___ sac de goûters.', correctAnswer: 'son', options: ['son', 'sont'] },
  { id: 'son-sont-14', sentence: 'Les fleurs ___ jolies au printemps.', correctAnswer: 'sont', options: ['son', 'sont'] },
  { id: 'son-sont-15', sentence: 'Il raconte ___ rêve à ses amis.', correctAnswer: 'son', options: ['son', 'sont'] },
  { id: 'son-sont-16', sentence: 'Les cousins ___ arrivés pour la fête.', correctAnswer: 'sont', options: ['son', 'sont'] },
  { id: 'son-sont-17', sentence: 'Florian caresse ___ chat avant de dormir.', correctAnswer: 'son', options: ['son', 'sont'] },
  { id: 'son-sont-18', sentence: 'Les sacs ___ lourds à porter.', correctAnswer: 'sont', options: ['son', 'sont'] },
  { id: 'son-sont-19', sentence: 'Il prépare ___ exposé avec soin.', correctAnswer: 'son', options: ['son', 'sont'] },
  { id: 'son-sont-20', sentence: 'Les amis ___ déjà montés dans le bus.', correctAnswer: 'sont', options: ['son', 'sont'] },
];

const CES_SES_CEST_SEST_TEMPLATES: readonly FillInTemplate[] = [
  {
    id: 'ces-ses-cest-sest-1',
    sentence: 'Les copains de Florian, ___ qu’il adore, viennent jouer à la maison.',
    correctAnswer: 'ces',
    options: ['ces', 'ses', "c'est", "s'est"],
  },
  { id: 'ces-ses-cest-sest-2', sentence: 'Florian adore ___ jeux de société.', correctAnswer: 'ses', options: ['ces', 'ses', "c'est", "s'est"] },
  {
    id: 'ces-ses-cest-sest-3',
    sentence: 'Tu trouves que ___ incroyable tout ce que tu apprends !',
    correctAnswer: "c'est",
    options: ['ces', 'ses', "c'est", "s'est"],
  },
  {
    id: 'ces-ses-cest-sest-4',
    sentence: 'La fusée ___ envolée très haut dans le ciel.',
    correctAnswer: "s'est",
    options: ['ces', 'ses', "c'est", "s'est"],
  },
  { id: 'ces-ses-cest-sest-5', sentence: 'Les animaux du zoo, ___ tu préfères, mangent maintenant.', correctAnswer: 'ces', options: ['ces', 'ses', "c'est", "s'est"] },
  { id: 'ces-ses-cest-sest-6', sentence: 'Florian range ___ crayons de couleur.', correctAnswer: 'ses', options: ['ces', 'ses', "c'est", "s'est"] },
  {
    id: 'ces-ses-cest-sest-7',
    sentence: "On dirait que ___ toujours un plaisir de te voir réussir.",
    correctAnswer: "c'est",
    options: ['ces', 'ses', "c'est", "s'est"],
  },
  { id: 'ces-ses-cest-sest-8', sentence: 'La mission ___ terminée sans problème.', correctAnswer: "s'est", options: ['ces', 'ses', "c'est", "s'est"] },
  { id: 'ces-ses-cest-sest-9', sentence: 'Les histoires de Florian, ___ il lit le soir, sont passionnantes.', correctAnswer: 'ces', options: ['ces', 'ses', "c'est", "s'est"] },
  { id: 'ces-ses-cest-sest-10', sentence: 'Florian partage ___ bonbons avec ses amis.', correctAnswer: 'ses', options: ['ces', 'ses', "c'est", "s'est"] },
  { id: 'ces-ses-cest-sest-11', sentence: "Tout le monde dit que ___ vrai, tu as bien progressé !", correctAnswer: "c'est", options: ['ces', 'ses', "c'est", "s'est"] },
  { id: 'ces-ses-cest-sest-12', sentence: 'La porte ___ ouverte toute seule.', correctAnswer: "s'est", options: ['ces', 'ses', "c'est", "s'est"] },
  { id: 'ces-ses-cest-sest-13', sentence: 'Les livres sur la table, ___ parlent de dinosaures, sont passionnants.', correctAnswer: 'ces', options: ['ces', 'ses', "c'est", "s'est"] },
  { id: 'ces-ses-cest-sest-14', sentence: 'Il montre ___ dessins à la classe.', correctAnswer: 'ses', options: ['ces', 'ses', "c'est", "s'est"] },
  { id: 'ces-ses-cest-sest-15', sentence: "Tout le monde sait que ___ en jouant que Florian apprend le mieux.", correctAnswer: "c'est", options: ['ces', 'ses', "c'est", "s'est"] },
  { id: 'ces-ses-cest-sest-16', sentence: 'La lampe ___ allumée toute la nuit.', correctAnswer: "s'est", options: ['ces', 'ses', "c'est", "s'est"] },
  { id: 'ces-ses-cest-sest-17', sentence: 'Les cadeaux sur le canapé, ___ sont pour ton anniversaire.', correctAnswer: 'ces', options: ['ces', 'ses', "c'est", "s'est"] },
  { id: 'ces-ses-cest-sest-18', sentence: 'Florian termine ___ devoirs avant de jouer.', correctAnswer: 'ses', options: ['ces', 'ses', "c'est", "s'est"] },
  { id: 'ces-ses-cest-sest-19', sentence: "On dirait que ___ difficile de choisir un nouveau livre.", correctAnswer: "c'est", options: ['ces', 'ses', "c'est", "s'est"] },
  { id: 'ces-ses-cest-sest-20', sentence: 'La fusée ___ posée sur la planète inconnue.', correctAnswer: "s'est", options: ['ces', 'ses', "c'est", "s'est"] },
];

const buildMultiplicationQuestion = (
  index: number,
  factorA: number,
  factorB: number,
): MathQuestion => {
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
    kind: 'math',
    operands: [factorA, factorB],
    operator: '×',
    options,
    correctAnswer,
  };
};

const createMultiplicationQuestionSet = (
  previousKeys: readonly string[],
): GeneratedQuestionSet => {
  const previousKeySet = new Set(previousKeys);
  const questions: MathQuestion[] = [];
  const keys: string[] = [];
  const usedKeys = new Set<string>();
  const maxRepeats = Math.min(2, previousKeys.length);
  let repeatsUsed = 0;
  let attempts = 0;

  const normaliseKey = (a: number, b: number) => {
    const [min, max] = a < b ? [a, b] : [b, a];
    return `${min}x${max}`;
  };

  while (questions.length < TOTAL_QUESTIONS && attempts < 10_000) {
    attempts += 1;
    const factorA = randomInt(2, 10);
    const factorB = randomInt(2, 10);
    const key = normaliseKey(factorA, factorB);

    if (usedKeys.has(key)) {
      continue;
    }

    const isRepeat = previousKeySet.has(key);
    if (isRepeat && repeatsUsed >= maxRepeats) {
      continue;
    }

    questions.push(buildMultiplicationQuestion(questions.length, factorA, factorB));
    keys.push(key);
    usedKeys.add(key);

    if (isRepeat) {
      repeatsUsed += 1;
    }
  }

  while (questions.length < TOTAL_QUESTIONS) {
    const factorA = randomInt(2, 10);
    const factorB = randomInt(2, 10);
    const key = normaliseKey(factorA, factorB);

    if (usedKeys.has(key)) {
      continue;
    }

    questions.push(buildMultiplicationQuestion(questions.length, factorA, factorB));
    keys.push(key);
    usedKeys.add(key);
  }

  return { questions, keys };
};

const buildMathQuestion = (
  index: number,
  operandA: number,
  operandB: number,
  operator: MathOperator,
  correctAnswer: number,
  wrongAnswerGenerator: (correct: number, operands: [number, number]) => number,
  candidateRange: { min: number; max: number },
): MathQuestion | null => {
  const wrongAnswers = new Set<number>();
  let guard = 0;

  while (wrongAnswers.size < 2 && guard < 200) {
    guard += 1;
    const candidate = wrongAnswerGenerator(correctAnswer, [operandA, operandB]);
    if (candidate === correctAnswer || candidate < candidateRange.min || candidate > candidateRange.max) {
      continue;
    }
    wrongAnswers.add(candidate);
  }

  while (wrongAnswers.size < 2 && guard < 400) {
    guard += 1;
    const candidate = randomInt(candidateRange.min, candidateRange.max);
    if (candidate !== correctAnswer) {
      wrongAnswers.add(candidate);
    }
  }

  if (wrongAnswers.size < 2) {
    return null;
  }

  const options = shuffle([correctAnswer, ...wrongAnswers]);

  return {
    id: `math-${operator}-${index}-${operandA}-${operandB}-${Math.random().toString(36).slice(2, 8)}`,
    kind: 'math',
    operands: [operandA, operandB],
    operator,
    options,
    correctAnswer,
  };
};

const createAdditionQuestionSet = (previousKeys: readonly string[]): GeneratedQuestionSet => {
  const previousKeySet = new Set(previousKeys);
  const questions: MathQuestion[] = [];
  const keys: string[] = [];
  const usedKeys = new Set<string>();
  const maxRepeats = Math.min(2, previousKeys.length);
  let repeatsUsed = 0;
  let attempts = 0;

  const normaliseKey = (a: number, b: number) => {
    const [min, max] = a < b ? [a, b] : [b, a];
    return `${min}+${max}`;
  };

  while (questions.length < TOTAL_QUESTIONS && attempts < 10_000) {
    attempts += 1;
    const addendA = randomInt(2, 40);
    const addendB = randomInt(2, 40);
    const key = normaliseKey(addendA, addendB);

    if (usedKeys.has(key)) {
      continue;
    }

    const isRepeat = previousKeySet.has(key);
    if (isRepeat && repeatsUsed >= maxRepeats) {
      continue;
    }

    const correctAnswer = addendA + addendB;
    const question = buildMathQuestion(
      questions.length,
      addendA,
      addendB,
      '+',
      correctAnswer,
      (answer, _operands) => answer + randomInt(-10, 10),
      { min: 2, max: 80 },
    );

    if (!question) {
      continue;
    }

    questions.push(question);
    keys.push(key);
    usedKeys.add(key);

    if (isRepeat) {
      repeatsUsed += 1;
    }
  }

  return { questions, keys };
};

const createSubtractionQuestionSet = (previousKeys: readonly string[]): GeneratedQuestionSet => {
  const previousKeySet = new Set(previousKeys);
  const questions: MathQuestion[] = [];
  const keys: string[] = [];
  const usedKeys = new Set<string>();
  const maxRepeats = Math.min(2, previousKeys.length);
  let repeatsUsed = 0;
  let attempts = 0;

  const normaliseKey = (a: number, b: number) => `${a}-${b}`;

  while (questions.length < TOTAL_QUESTIONS && attempts < 10_000) {
    attempts += 1;
    const minuend = randomInt(10, 80);
    const subtrahend = randomInt(0, Math.min(minuend, 60));
    const key = normaliseKey(minuend, subtrahend);

    if (usedKeys.has(key)) {
      continue;
    }

    const isRepeat = previousKeySet.has(key);
    if (isRepeat && repeatsUsed >= maxRepeats) {
      continue;
    }

    const correctAnswer = minuend - subtrahend;
    const question = buildMathQuestion(
      questions.length,
      minuend,
      subtrahend,
      '−',
      correctAnswer,
      (answer, _operands) => answer + randomInt(-10, 10),
      { min: 0, max: 80 },
    );

    if (!question) {
      continue;
    }

    questions.push(question);
    keys.push(key);
    usedKeys.add(key);

    if (isRepeat) {
      repeatsUsed += 1;
    }
  }

  return { questions, keys };
};

const createDivisionQuestionSet = (previousKeys: readonly string[]): GeneratedQuestionSet => {
  const previousKeySet = new Set(previousKeys);
  const questions: MathQuestion[] = [];
  const keys: string[] = [];
  const usedKeys = new Set<string>();
  const maxRepeats = Math.min(2, previousKeys.length);
  let repeatsUsed = 0;
  let attempts = 0;

  const normaliseKey = (dividend: number, divisor: number) => `${dividend}÷${divisor}`;

  while (questions.length < TOTAL_QUESTIONS && attempts < 10_000) {
    attempts += 1;
    const divisor = randomInt(2, 10);
    const quotient = randomInt(2, 12);
    const dividend = divisor * quotient;
    const key = normaliseKey(dividend, divisor);

    if (usedKeys.has(key)) {
      continue;
    }

    const isRepeat = previousKeySet.has(key);
    if (isRepeat && repeatsUsed >= maxRepeats) {
      continue;
    }

    const question = buildMathQuestion(
      questions.length,
      dividend,
      divisor,
      '÷',
      quotient,
      () => randomInt(1, 12),
      { min: 1, max: 20 },
    );

    if (!question) {
      continue;
    }

    questions.push(question);
    keys.push(key);
    usedKeys.add(key);

    if (isRepeat) {
      repeatsUsed += 1;
    }
  }

  return { questions, keys };
};

const createFillInQuestionSet = (
  templates: readonly FillInTemplate[],
  previousKeys: readonly string[],
): GeneratedQuestionSet => {
  const previousKeySet = new Set(previousKeys);
  const freshTemplates = shuffle(templates.filter(template => !previousKeySet.has(template.id)));
  const repeatedTemplates = shuffle(templates.filter(template => previousKeySet.has(template.id)));
  const selectedTemplates: FillInTemplate[] = [];

  for (const template of freshTemplates) {
    if (selectedTemplates.length >= TOTAL_QUESTIONS) {
      break;
    }
    selectedTemplates.push(template);
  }

  let repeatBudget = Math.min(2, TOTAL_QUESTIONS - selectedTemplates.length);
  for (const template of repeatedTemplates) {
    if (selectedTemplates.length >= TOTAL_QUESTIONS || repeatBudget <= 0) {
      break;
    }
    selectedTemplates.push(template);
    repeatBudget -= 1;
  }

  if (selectedTemplates.length < TOTAL_QUESTIONS) {
    const remainingPool = shuffle(
      templates.filter(template => !selectedTemplates.some(selected => selected.id === template.id)),
    );
    for (const template of remainingPool) {
      if (selectedTemplates.length >= TOTAL_QUESTIONS) {
        break;
      }
      selectedTemplates.push(template);
    }
  }

  if (selectedTemplates.length < TOTAL_QUESTIONS) {
    const fallbackPool = shuffle(templates);
    for (const template of fallbackPool) {
      if (selectedTemplates.length >= TOTAL_QUESTIONS) {
        break;
      }
      selectedTemplates.push(template);
    }
  }

  const questions: FillInQuestion[] = selectedTemplates.slice(0, TOTAL_QUESTIONS).map(template => ({
    id: template.id,
    kind: 'fill-in',
    sentence: template.sentence,
    options: [...template.options],
    correctAnswer: template.correctAnswer,
  }));

  return {
    questions,
    keys: questions.map(question => question.id),
  };
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
  createQuestionSet: (previousKeys: readonly string[]) => GeneratedQuestionSet;
};

type GeneratedQuestionSet = {
  questions: Question[];
  keys: string[];
};

type QuestionMemory = Partial<Record<CategoryId, string[]>>;

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
    createQuestionSet: previousKeys => createMultiplicationQuestionSet(previousKeys),
  },
  'maths-additions': {
    subject: 'maths',
    label: 'Maths · Additions',
    shortLabel: 'Maths · Additions',
    heroBadge: 'Mission Additions',
    heroTitle: 'Capitaine Calcul',
    heroSubtitle: 'Florian, assemble les nombres pour trouver le bon total !',
    questionLabel: 'Défi',
    questionInstruction: 'Choisis la bonne réponse :',
    summaryTitle: 'Mission accomplie Florian !',
    restartLabel: 'Rejouer la mission',
    createQuestionSet: previousKeys => createAdditionQuestionSet(previousKeys),
  },
  'maths-soustractions': {
    subject: 'maths',
    label: 'Maths · Soustractions',
    shortLabel: 'Maths · Soustractions',
    heroBadge: 'Mission Soustractions',
    heroTitle: 'Capitaine Calcul',
    heroSubtitle: 'Florian, calcule les différences avec précision !',
    questionLabel: 'Défi',
    questionInstruction: 'Choisis la bonne réponse :',
    summaryTitle: 'Mission accomplie Florian !',
    restartLabel: 'Rejouer la mission',
    createQuestionSet: previousKeys => createSubtractionQuestionSet(previousKeys),
  },
  'maths-divisions': {
    subject: 'maths',
    label: 'Maths · Divisions',
    shortLabel: 'Maths · Divisions',
    heroBadge: 'Mission Divisions',
    heroTitle: 'Capitaine Calcul',
    heroSubtitle: 'Florian, partage les trésors équitablement !',
    questionLabel: 'Défi',
    questionInstruction: 'Choisis la bonne réponse :',
    summaryTitle: 'Mission accomplie Florian !',
    restartLabel: 'Rejouer la mission',
    createQuestionSet: previousKeys => createDivisionQuestionSet(previousKeys),
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
    createQuestionSet: previousKeys => createFillInQuestionSet(ET_EST_TEMPLATES, previousKeys),
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
    createQuestionSet: previousKeys => createFillInQuestionSet(A_A_TEMPLATES, previousKeys),
  },
  'francais-ou-au-aux': {
    subject: 'francais',
    label: 'Français · eau / eaux / au / aux / o / ô / os / ot',
    shortLabel: 'Français · eau & sons en o',
    heroBadge: 'Mission Orthographe',
    heroTitle: 'Capitaine des Mots',
    heroSubtitle: 'Florian, trouve la terminaison en “o” qui fait sonner juste chaque phrase !',
    questionLabel: 'Phrase',
    questionInstruction: 'Choisis la bonne terminaison :',
    summaryTitle: 'Mission mots réussie Florian !',
    restartLabel: 'Rejouer ce test',
    createQuestionSet: previousKeys => createFillInQuestionSet(EAU_VARIANTS_TEMPLATES, previousKeys),
  },
  'francais-on-ont': {
    subject: 'francais',
    label: 'Français · on / ont',
    shortLabel: 'Français · on / ont',
    heroBadge: 'Mission Orthographe',
    heroTitle: 'Capitaine des Mots',
    heroSubtitle: 'Florian, choisis la bonne forme du verbe avoir ou du pronom !',
    questionLabel: 'Phrase',
    questionInstruction: 'Sélectionne la bonne orthographe :',
    summaryTitle: 'Mission mots réussie Florian !',
    restartLabel: 'Rejouer ce test',
    createQuestionSet: previousKeys => createFillInQuestionSet(ON_ONT_TEMPLATES, previousKeys),
  },
  'francais-son-sont': {
    subject: 'francais',
    label: 'Français · son / sont',
    shortLabel: 'Français · son / sont',
    heroBadge: 'Mission Orthographe',
    heroTitle: 'Capitaine des Mots',
    heroSubtitle: 'Florian, trouve si on parle de possession ou du verbe être !',
    questionLabel: 'Phrase',
    questionInstruction: 'Sélectionne la bonne orthographe :',
    summaryTitle: 'Mission mots réussie Florian !',
    restartLabel: 'Rejouer ce test',
    createQuestionSet: previousKeys => createFillInQuestionSet(SON_SONT_TEMPLATES, previousKeys),
  },
  'francais-ces-ses-cest-sest': {
    subject: 'francais',
    label: "Français · ces / ses / c'est / s'est",
    shortLabel: "Français · ces · ses · c'est · s'est",
    heroBadge: 'Mission Orthographe',
    heroTitle: 'Capitaine des Mots',
    heroSubtitle: 'Florian, devine si on montre, on possède ou si une action se raconte !',
    questionLabel: 'Phrase',
    questionInstruction: 'Choisis la bonne expression :',
    summaryTitle: 'Mission mots réussie Florian !',
    restartLabel: 'Rejouer ce test',
    createQuestionSet: previousKeys => createFillInQuestionSet(CES_SES_CEST_SEST_TEMPLATES, previousKeys),
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
  const previousQuestionKeysRef = useRef<QuestionMemory>({});

  const generateQuestionSetForCategory = (categoryId: CategoryId) => {
    const previousKeys = previousQuestionKeysRef.current[categoryId] ?? [];
    const { questions, keys } = CATEGORY_CONFIGS[categoryId].createQuestionSet(previousKeys);
    previousQuestionKeysRef.current[categoryId] = keys;
    return questions;
  };

  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId>(DEFAULT_CATEGORY_ID);
  const [questionSet, setQuestionSet] = useState<Question[]>(
    () => generateQuestionSetForCategory(DEFAULT_CATEGORY_ID),
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
    setSelectedCategoryId(categoryId);
    setQuestionSet(generateQuestionSetForCategory(categoryId));
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

    const expectedAnswer = currentQuestion.kind === 'math'
      ? String(currentQuestion.correctAnswer)
      : currentQuestion.correctAnswer;

    const isCorrect = choice === expectedAnswer;
    const newTotalAnswered = questionsAnswered + 1;
    const newScore = isCorrect ? score + 1 : score;

    const prompt = currentQuestion.kind === 'math'
      ? `${currentQuestion.operands[0]} ${currentQuestion.operator} ${currentQuestion.operands[1]}`
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

    const detail = currentQuestion.kind === 'math'
      ? `${currentQuestion.operands[0]} ${currentQuestion.operator} ${currentQuestion.operands[1]} = ${currentQuestion.correctAnswer}`
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
                    resolvedCurrentQuestion.kind === 'math'
                      ? 'question-card-maths'
                      : 'question-card-words'
                  }`}
                >
                  <p className="question-label">
                    {currentCategory.questionLabel} #{questionNumber}
                  </p>
                  {resolvedCurrentQuestion.kind === 'math' ? (
                    <p className="question-expression">
                      <span>{resolvedCurrentQuestion.operands[0]}</span>
                      <span className="question-symbol">{resolvedCurrentQuestion.operator}</span>
                      <span>{resolvedCurrentQuestion.operands[1]}</span>
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
                  {resolvedCurrentQuestion.kind === 'math'
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
