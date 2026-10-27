import type { TermQuizQuestion } from "@/types/glossary";
import type { SwipeCard } from "@/types/swipe";

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

/**
 * One step of a lesson, played with one of several mechanics so a lesson never feels
 * repetitive: a multiple-choice scenario, a "Fato ou Fake" campaign promise, or a
 * "Qual é o termo?" glossary clue.
 */
export type SessionStep =
  | { kind: "quiz"; id: string; question: Question }
  | { kind: "factOrFake"; id: string; card: SwipeCard }
  | { kind: "term"; id: string; termQuestion: TermQuizQuestion };

export type SessionStepKind = SessionStep["kind"];

export interface Lesson {
  id: string;
  title: string;
  /** Mixed mechanics, never the same one twice in a row (enforced in levels.test.ts). */
  steps: SessionStep[];
}

export interface Level {
  id: string;
  sphereLabel: string;
  title: string;
  subtitle: string;
  icon: string;
  /** Short pt-BR line the mascot says next to this level's path. */
  mascotTip: string;
  lessons: Lesson[];
  /** Every quiz question of the level (the final challenge plays every lesson step). */
  questions: Question[];
}

export type QuizSessionKind = "lesson" | "challenge";

/** One playable run of the quiz engine: a lesson or a level's final challenge. */
export interface QuizSession {
  id: string;
  kind: QuizSessionKind;
  levelId: string;
  title: string;
  steps: SessionStep[];
}

export type PathNodeKind = "lesson" | "chest" | "challenge";

/**
 * completed: done (lessons and challenges stay replayable; chests stay opened);
 * current: the next step to play (or the chest to open);
 * locked: previous steps are still pending.
 */
export type PathNodeStatus = "completed" | "current" | "locked";

export interface PathNode {
  id: string;
  kind: PathNodeKind;
  title: string;
  status: PathNodeStatus;
  /** Present for lessons and challenges. */
  session?: QuizSession;
}

export interface PathUnit {
  level: Level;
  isComingSoon: boolean;
  isUnlocked: boolean;
  isCompleted: boolean;
  nodes: PathNode[];
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

export interface Rank {
  name: string;
  minXp: number;
}

export interface RankProgress {
  name: string;
  nextName: string | null;
  xpToNext: number;
  percent: number;
}
