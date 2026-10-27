import { GLOSSARY_TERMS } from "@/lib/glossary";
import { factOrFakeStep, quizStep, termStep } from "@/lib/steps";
import type { CivicTitle, Lesson, Level, Question, Rank, RankProgress, SessionStep } from "@/types/quiz";
import type { SwipeCard } from "@/types/swipe";
import questionsData from "./questions.json";
import { STRINGS } from "./strings";
import swipeCardsData from "./swipeCards.json";

export const INITIAL_LIVES = 3;
export const XP_PER_CORRECT_ANSWER = 15;
export const CHEST_XP = 20;
export const LESSON_SIZE = 3;

const questions = questionsData as Question[];
const swipeCards: SwipeCard[] = swipeCardsData;

function getQuestionsBySphere(sphere: Question["sphere"]): Question[] {
  return questions.filter((q) => q.sphere === sphere);
}

// Lesson step pickers: a missing id is a content bug, so they fail loudly at load time.
function quiz(id: number): SessionStep {
  const question = questions.find((q) => q.id === id);
  if (!question) throw new Error(`Question ${id} not found in questions.json`);
  return quizStep(question);
}

function factOrFake(id: number): SessionStep {
  const card = swipeCards.find((c) => c.id === id);
  if (!card) throw new Error(`Swipe card ${id} not found in swipeCards.json`);
  return factOrFakeStep(card);
}

function term(id: string): SessionStep {
  const glossaryTerm = GLOSSARY_TERMS.find((t) => t.id === id);
  if (!glossaryTerm) throw new Error(`Glossary term ${id} not found in glossaryTerms.json`);
  return termStep(glossaryTerm);
}

/**
 * Fallback for levels without hand-picked themed lessons. It only produces quiz steps,
 * which levels.test.ts rejects for real content: give new levels themed, mixed lessons.
 */
export function chunkIntoLessons(levelId: string, levelQuestions: Question[], size = LESSON_SIZE): Lesson[] {
  const lessons: Lesson[] = [];
  for (let start = 0; start < levelQuestions.length; start += size) {
    const number = lessons.length + 1;
    lessons.push({
      id: `${levelId}-${number}`,
      title: STRINGS.path.fallbackLessonTitle(number),
      steps: levelQuestions.slice(start, start + size).map(quizStep),
    });
  }
  return lessons;
}

const stateQuestions = getQuestionsBySphere("state");
const federalQuestions = getQuestionsBySphere("federal");

// Levels without questions show up on the trail as "Em breve".
export const LEVELS: Level[] = [
  {
    id: "municipal",
    sphereLabel: "Municipal",
    title: "No Meu Bairro",
    subtitle: "Prefeito, Secretarias e a Câmara de Vereadores",
    icon: "🏘️",
    mascotTip: "Psiu! Nem todo problema da cidade é com o vereador.",
    // Every lesson mixes mechanics. Glossary clues come after the scenarios they could hint at.
    lessons: [
      {
        id: "municipal-1",
        title: "Serviços do bairro",
        steps: [quiz(1), factOrFake(6), quiz(6), term("licitacao"), quiz(7)],
      },
      {
        id: "municipal-2",
        title: "Saúde, escola e calçada",
        steps: [quiz(2), term("dotacao-orcamentaria"), quiz(4), factOrFake(2), quiz(8)],
      },
      {
        id: "municipal-3",
        title: "Leis e promessas",
        steps: [quiz(3), factOrFake(1), quiz(10), term("sancao")],
      },
      {
        id: "municipal-4",
        title: "De olho no dinheiro",
        steps: [quiz(5), factOrFake(5), term("imposto"), quiz(9)],
      },
    ],
    questions: getQuestionsBySphere("municipal"),
  },
  {
    id: "state",
    sphereLabel: "Estadual",
    title: "Ordem e Região",
    subtitle: "Governador, Polícias e Assembleia Legislativa",
    icon: "🚓",
    mascotTip: "Polícia e hospital regional: é com quem?",
    lessons: chunkIntoLessons("state", stateQuestions),
    questions: stateQuestions,
  },
  {
    id: "federal",
    sphereLabel: "Federal",
    title: "Soberania e Leis Nacionais",
    subtitle: "Presidente da República e Congresso Nacional",
    icon: "🌎",
    mascotTip: "Quem cuida das fronteiras do Brasil?",
    lessons: chunkIntoLessons("federal", federalQuestions),
    questions: federalQuestions,
  },
  {
    id: "supreme",
    sphereLabel: "Desafio Supremo",
    title: "O Fiscal da República",
    subtitle: "Dilemas federativos avançados de competência concorrente",
    icon: "🏛️",
    mascotTip: "Aqui só chega quem domina as três esferas!",
    lessons: [],
    questions: [],
  },
];

export const SPHERE_LABELS: Record<Question["sphere"], string> = {
  municipal: "Municipal",
  state: "Estadual",
  federal: "Federal",
};

export const RANKS: readonly Rank[] = [
  { name: "Eleitor Curioso", minXp: 0 },
  { name: "Fiscal Cívico Júnior", minXp: 60 },
  { name: "Líder Comunitário", minXp: 150 },
  { name: "Constitucionalista Pleno", minXp: 300 },
];

export function getRankProgress(xp: number): RankProgress {
  const index = RANKS.findLastIndex((rank) => xp >= rank.minXp);
  const current = RANKS[index];
  const next = RANKS[index + 1];
  if (!next) return { name: current.name, nextName: null, xpToNext: 0, percent: 100 };
  return {
    name: current.name,
    nextName: next.name,
    xpToNext: next.minXp - xp,
    percent: Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100),
  };
}

export function getRankByXp(xp: number): string {
  return getRankProgress(xp).name;
}

export function getCivicTitle(score: number, total: number): CivicTitle {
  const accuracy = total > 0 ? score / total : 0;
  if (accuracy === 1) {
    return {
      name: "Guardião da Constituição",
      description: "Você domina as competências desta esfera. Ninguém te engana em época de eleição!",
    };
  }
  if (accuracy >= 0.7) {
    return {
      name: "Fiscal do Povo",
      description: "Você sabe exatamente para quem cobrar o serviço público sem desperdiçar seu voto.",
    };
  }
  if (accuracy >= 0.4) {
    return {
      name: "Cidadão Atento",
      description: "Bom começo! Revise as explicações e tente de novo para subir de título.",
    };
  }
  return {
    name: "Aprendiz Cívico",
    description: "Todo cidadão começa em algum lugar. Jogue novamente e aprenda com a CF/88!",
  };
}
