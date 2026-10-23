export type Sphere = "municipal" | "state" | "federal";

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  sphere: Sphere;
  prompt: string;
  options: Option[];
  constitutionalArticle: string;
  explanation: string;
}

export interface Level {
  id: string;
  sphereLabel: string;
  title: string;
  subtitle: string;
  icon: string;
  questions: Question[];
}

export interface GameState {
  currentIndex: number;
  lives: number;
  score: number;
  selectedOptionId: string | null;
  /** Answer verified: options are locked and the feedback drawer is open. */
  isSelectionLocked: boolean;
  /** Victory when lives > 0, defeat when lives === 0. */
  isGameOver: boolean;
}

export interface CivicTitle {
  name: string;
  description: string;
}
