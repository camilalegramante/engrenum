import { useSyncExternalStore } from "react";
import type { QuizSession } from "@/types/quiz";

export interface Progress {
  xp: number;
  streak: number;
  lastPlayedDay: string | null;
  completedLessonIds: string[];
  completedLevelIds: string[];
  openedChestIds: string[];
  isSoundEnabled: boolean;
}

export const INITIAL_PROGRESS: Progress = {
  xp: 0,
  streak: 0,
  lastPlayedDay: null,
  completedLessonIds: [],
  completedLevelIds: [],
  openedChestIds: [],
  isSoundEnabled: true,
};

const STORAGE_KEY = "engrenum:progress";
const listeners = new Set<() => void>();

// undefined = not read from localStorage yet
let rawValue: string | null | undefined;
let currentProgress: Progress = INITIAL_PROGRESS;

function parseProgress(text: string | null): Progress {
  if (!text) return INITIAL_PROGRESS;
  try {
    return { ...INITIAL_PROGRESS, ...(JSON.parse(text) as Partial<Progress>) };
  } catch {
    return INITIAL_PROGRESS;
  }
}

function getSnapshot(): Progress {
  if (rawValue === undefined) {
    try {
      rawValue = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      rawValue = null;
    }
    currentProgress = parseProgress(rawValue);
  }
  return currentProgress;
}

function getServerSnapshot(): Progress {
  return INITIAL_PROGRESS;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    rawValue = undefined;
    onChange();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function updateProgress(update: (current: Progress) => Progress): void {
  currentProgress = update(getSnapshot());
  rawValue = JSON.stringify(currentProgress);
  try {
    window.localStorage.setItem(STORAGE_KEY, rawValue);
  } catch {
    // No storage available (private tab, blocked site data): progress stays in memory only.
  }
  listeners.forEach((listener) => listener());
}

function toLocalDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function addUnique(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids : [...ids, id];
}

export function hasPlayedToday(progress: Progress, now?: Date): boolean {
  // Bail out before reading the clock: the server prerender always sees INITIAL_PROGRESS,
  // and Cache Components forbids `new Date()` while prerendering.
  if (!progress.lastPlayedDay) return false;
  return progress.lastPlayedDay === toLocalDay(now ?? new Date());
}

export function registerSessionCompletion(current: Progress, session: QuizSession): Progress {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  let streak = 1;
  if (current.lastPlayedDay === toLocalDay(today)) streak = current.streak;
  else if (current.lastPlayedDay === toLocalDay(yesterday)) streak = current.streak + 1;

  return {
    ...current,
    streak,
    lastPlayedDay: toLocalDay(today),
    completedLessonIds:
      session.kind === "lesson" ? addUnique(current.completedLessonIds, session.id) : current.completedLessonIds,
    completedLevelIds:
      session.kind === "challenge" ? addUnique(current.completedLevelIds, session.levelId) : current.completedLevelIds,
  };
}

export function registerChestOpening(current: Progress, chestId: string, xpReward: number): Progress {
  if (current.openedChestIds.includes(chestId)) return current;
  return { ...current, xp: current.xp + xpReward, openedChestIds: [...current.openedChestIds, chestId] };
}
