import { describe, expect, it } from "vitest";
import { LEVELS } from "@/data/levels";
import { STRINGS } from "@/data/strings";
import type { Level, PathNodeStatus } from "@/types/quiz";
import { buildPath, getChallengeId, getChestId, type PathProgress } from "./path";

const NO_PROGRESS: PathProgress = { completedLessonIds: [], completedLevelIds: [], openedChestIds: [] };

function statuses(levels: Level[], progress: PathProgress, unitIndex = 0): [string, PathNodeStatus][] {
  return buildPath(levels, progress)[unitIndex].nodes.map((node) => [node.id, node.status]);
}

describe("buildPath", () => {
  it("orders lessons with a chest after the second one and the challenge at the end", () => {
    const [municipal] = buildPath(LEVELS, NO_PROGRESS);
    expect(municipal.nodes.map((node) => node.kind)).toEqual([
      "lesson",
      "lesson",
      "chest",
      "lesson",
      "lesson",
      "challenge",
    ]);
  });

  it("makes the first lesson current and locks everything after it", () => {
    expect(statuses(LEVELS, NO_PROGRESS)).toEqual([
      ["municipal-1", "current"],
      ["municipal-2", "locked"],
      ["municipal-chest", "locked"],
      ["municipal-3", "locked"],
      ["municipal-4", "locked"],
      ["municipal-challenge", "locked"],
    ]);
  });

  it("opens the chest as a side reward without blocking the next lesson", () => {
    const progress = { ...NO_PROGRESS, completedLessonIds: ["municipal-1", "municipal-2"] };
    expect(statuses(LEVELS, progress)).toEqual([
      ["municipal-1", "completed"],
      ["municipal-2", "completed"],
      ["municipal-chest", "available"],
      ["municipal-3", "current"],
      ["municipal-4", "locked"],
      ["municipal-challenge", "locked"],
    ]);
  });

  it("marks an opened chest as completed", () => {
    const progress = {
      ...NO_PROGRESS,
      completedLessonIds: ["municipal-1", "municipal-2"],
      openedChestIds: [getChestId("municipal")],
    };
    expect(statuses(LEVELS, progress)[2]).toEqual(["municipal-chest", "completed"]);
  });

  it("unlocks the final challenge after the last lesson", () => {
    const progress = {
      ...NO_PROGRESS,
      completedLessonIds: ["municipal-1", "municipal-2", "municipal-3", "municipal-4"],
    };
    expect(statuses(LEVELS, progress).at(-1)).toEqual(["municipal-challenge", "current"]);
  });

  it("treats every lesson as done once the level is completed", () => {
    const [municipal] = buildPath(LEVELS, { ...NO_PROGRESS, completedLevelIds: ["municipal"] });
    expect(municipal.isCompleted).toBe(true);
    expect(municipal.nodes.filter((n) => n.kind !== "chest").every((n) => n.status === "completed")).toBe(true);
  });

  it("builds playable sessions for lessons and the challenge", () => {
    const [municipal] = buildPath(LEVELS, NO_PROGRESS);
    expect(municipal.nodes[0].session).toMatchObject({
      id: "municipal-1",
      kind: "lesson",
      levelId: "municipal",
      title: "Serviços do bairro",
    });
    expect(municipal.nodes.at(-1)?.session).toMatchObject({
      id: getChallengeId("municipal"),
      kind: "challenge",
      title: STRINGS.path.challengeSessionTitle("No Meu Bairro"),
    });
    const allLessonSteps = LEVELS[0].lessons.flatMap((lesson) => lesson.steps);
    expect(municipal.nodes.at(-1)?.session?.steps).toEqual(allLessonSteps);
    expect(municipal.nodes[0].session?.steps).toBe(LEVELS[0].lessons[0].steps);
    expect(municipal.nodes[2].session).toBeUndefined();
  });

  it("flags levels without questions as coming soon, with no nodes", () => {
    const units = buildPath(LEVELS, NO_PROGRESS);
    expect(units.slice(1).map((u) => [u.level.id, u.isComingSoon, u.isUnlocked, u.nodes.length])).toEqual([
      ["state", true, false, 0],
      ["federal", true, false, 0],
      ["supreme", true, false, 0],
    ]);
  });

  describe("with a second playable level", () => {
    const levels: Level[] = [
      LEVELS[0],
      {
        ...LEVELS[1],
        lessons: [{ id: "state-1", title: "Lição 1", steps: LEVELS[0].lessons[0].steps.slice(0, 2) }],
        questions: LEVELS[0].questions.slice(0, 2),
      },
    ];

    it("keeps it locked until the previous level is completed", () => {
      const state = buildPath(levels, NO_PROGRESS)[1];
      expect(state.isUnlocked).toBe(false);
      expect(state.nodes.every((n) => n.status === "locked")).toBe(true);
    });

    it("unlocks it after the previous level's challenge", () => {
      expect(statuses(levels, { ...NO_PROGRESS, completedLevelIds: ["municipal"] }, 1)).toEqual([
        ["state-1", "current"],
        ["state-challenge", "locked"],
      ]);
    });
  });
});
