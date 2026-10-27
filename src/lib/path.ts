import { STRINGS } from "@/data/strings";
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
 * Every step is sequential: the chest must be opened before the lessons after it.
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
        const chestId = getChestId(level.id);
        pushSequentialNode(
          { id: chestId, kind: "chest", title: STRINGS.path.chestTitle },
          progress.openedChestIds.includes(chestId),
        );
      }
      const session: QuizSession = {
        id: lesson.id,
        kind: "lesson",
        levelId: level.id,
        title: lesson.title,
        steps: lesson.steps,
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
          title: STRINGS.path.challengeTitle,
          session: {
            id: challengeId,
            kind: "challenge",
            levelId: level.id,
            title: STRINGS.path.challengeSessionTitle(level.title),
            // Every step of every lesson, so the challenge mixes mechanics too
            steps: level.lessons.flatMap((lesson) => lesson.steps),
          },
        },
        isCompleted,
      );
    }

    return { level, isComingSoon, isUnlocked, isCompleted, nodes };
  });
}
