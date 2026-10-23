import type { CivicTitle, Level, Question } from "@/types/quiz";
import questionsData from "./questions.json";

export const INITIAL_LIVES = 3;
export const XP_PER_CORRECT_ANSWER = 15;

const questions = questionsData as Question[];

// Levels without questions show up on the trail as "Em breve".
export const LEVELS: Level[] = [
  {
    id: "municipal",
    sphereLabel: "Municipal",
    title: "Nível 1: No Meu Bairro",
    subtitle: "Prefeito, Secretarias e a Câmara de Vereadores",
    icon: "🏘️",
    questions: questions.filter((q) => q.sphere === "municipal"),
  },
  {
    id: "state",
    sphereLabel: "Estadual",
    title: "Nível 2: Ordem e Região",
    subtitle: "Governador, Polícias e Assembleia Legislativa",
    icon: "🚓",
    questions: questions.filter((q) => q.sphere === "state"),
  },
  {
    id: "federal",
    sphereLabel: "Federal",
    title: "Nível 3: Soberania e Leis Nacionais",
    subtitle: "Presidente da República e Congresso Nacional",
    icon: "🇧🇷",
    questions: questions.filter((q) => q.sphere === "federal"),
  },
  {
    id: "supreme",
    sphereLabel: "Desafio Supremo",
    title: "Nível 4: O Fiscal da República",
    subtitle: "Dilemas federativos avançados de competência concorrente",
    icon: "🏛️",
    questions: [],
  },
];

export const SPHERE_LABELS: Record<Question["sphere"], string> = {
  municipal: "Municipal",
  state: "Estadual",
  federal: "Federal",
};

export function getRankByXp(xp: number): string {
  if (xp < 60) return "Eleitor Curioso";
  if (xp < 150) return "Fiscal Cívico Júnior";
  if (xp < 300) return "Líder Comunitário";
  return "Constitucionalista Pleno";
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
