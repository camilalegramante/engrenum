import type { Level, PathNode, PathUnit, QuizSession } from "@/types/quiz";

export interface PathProgress {
  completedLessonIds: string[];
  completedLevelIds: string[];
  openedChestIds: string[];
}

/** The reward chest sits right after this many lessons. */
const LESSONS_BEFORE_CHEST = 2;

export function getChestId(levelId: string): string {
  return `${levelId}-chest`;
}

export function getChallengeId(levelId: string): string {
  return `${levelId}-challenge`;
}

/**
 * Turns levels + progress into the learning path: lessons in order, a reward chest
 * after the second lesson and the final challenge, which unlocks the next level.
 */
export function buildPath(levels: Level[], progress: PathProgress): PathUnit[] {
  return levels.map((level, i) => {
    const isComingSoon = level.questions.length === 0;
    const isUnlocked = !isComingSoon && (i === 0 || progress.completedLevelIds.includes(levels[i - 1].id));
    const isCompleted = progress.completedLevelIds.includes(level.id);
    const nodes: PathNode[] = [];
    let isPreviousDone = isUnlocked;

    function pushSequentialNode(node: Omit<PathNode, "status">, isDone: boolean) {
      nodes.push({ ...node, status: isDone ? "completed" : isPreviousDone ? "current" : "locked" });
      isPreviousDone = isDone;
    }

    level.lessons.forEach((lesson, index) => {
      if (index === LESSONS_BEFORE_CHEST) {
        // The chest is a side reward: it never blocks the lessons after it.
        const chestId = getChestId(level.id);
        const isOpened = progress.openedChestIds.includes(chestId);
        nodes.push({
          id: chestId,
          kind: "chest",
          title: "Baú de recompensa",
          status: isOpened ? "completed" : isPreviousDone ? "available" : "locked",
        });
      }
      const session: QuizSession = {
        id: lesson.id,
        kind: "lesson",
        levelId: level.id,
        title: lesson.title,
        questions: lesson.questions,
      };
      // Finishing the final challenge also counts every lesson of the level as done.
      pushSequentialNode(
        { id: lesson.id, kind: "lesson", title: lesson.title, session },
        isCompleted || progress.completedLessonIds.includes(lesson.id),
      );
    });

    if (!isComingSoon) {
      const challengeId = getChallengeId(level.id);
      pushSequentialNode(
        {
          id: challengeId,
          kind: "challenge",
          title: "Desafio final",
          session: {
            id: challengeId,
            kind: "challenge",
            levelId: level.id,
            title: `Desafio final: ${level.title}`,
            questions: level.questions,
          },
        },
        isCompleted,
      );
    }

    return { level, isComingSoon, isUnlocked, isCompleted, nodes };
  });
}
