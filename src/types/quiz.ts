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

export interface Lesson {
  id: string;
  title: string;
  questions: Question[];
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
  /** Every question of the level; played together in the final challenge. */
  questions: Question[];
}

export type QuizSessionKind = "lesson" | "challenge";

/** One playable run of the quiz engine: a lesson or a level's final challenge. */
export interface QuizSession {
  id: string;
  kind: QuizSessionKind;
  levelId: string;
  title: string;
  questions: Question[];
}

export type PathNodeKind = "lesson" | "chest" | "challenge";

/**
 * completed: done (lessons and challenges stay replayable);
 * current: the next step to play;
 * available: unlocked side reward (an unopened chest);
 * locked: previous steps are still pending.
 */
export type PathNodeStatus = "completed" | "current" | "available" | "locked";

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
