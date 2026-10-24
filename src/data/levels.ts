import type { CivicTitle, Lesson, Level, Question, Rank, RankProgress } from "@/types/quiz";
import questionsData from "./questions.json";
import { STRINGS } from "./strings";

export const INITIAL_LIVES = 3;
export const XP_PER_CORRECT_ANSWER = 15;
export const CHEST_XP = 20;
export const LESSON_SIZE = 3;

const questions = questionsData as Question[];

function getQuestionsBySphere(sphere: Question["sphere"]): Question[] {
  return questions.filter((q) => q.sphere === sphere);
}

function pickQuestions(ids: number[]): Question[] {
  return ids.map((id) => {
    const question = questions.find((q) => q.id === id);
    if (!question) throw new Error(`Question ${id} not found in questions.json`);
    return question;
  });
}

/** Fallback for levels without hand-picked themed lessons. */
export function chunkIntoLessons(levelId: string, levelQuestions: Question[], size = LESSON_SIZE): Lesson[] {
  const lessons: Lesson[] = [];
  for (let start = 0; start < levelQuestions.length; start += size) {
    const number = lessons.length + 1;
    lessons.push({
      id: `${levelId}-${number}`,
      title: STRINGS.path.fallbackLessonTitle(number),
      questions: levelQuestions.slice(start, start + size),
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
    lessons: [
      { id: "municipal-1", title: "Serviços do bairro", questions: pickQuestions([1, 6, 7]) },
      { id: "municipal-2", title: "Saúde, escola e calçada", questions: pickQuestions([2, 4, 8]) },
      { id: "municipal-3", title: "Leis e promessas", questions: pickQuestions([3, 10]) },
      { id: "municipal-4", title: "De olho no dinheiro", questions: pickQuestions([5, 9]) },
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
