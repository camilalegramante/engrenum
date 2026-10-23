import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { QuizSession } from "@/types/quiz";
import type { Progress } from "./progress";

const STORAGE_KEY = "engrenum:progress";

// The store caches what it read from localStorage at module level, so each test gets a fresh module.
async function loadModule() {
  vi.resetModules();
  return import("./progress");
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("useProgress", () => {
  it("returns the initial progress when nothing is stored", async () => {
    const { useProgress, INITIAL_PROGRESS } = await loadModule();
    const { result } = renderHook(() => useProgress());
    expect(result.current).toEqual(INITIAL_PROGRESS);
  });

  it("merges stored progress with defaults", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ xp: 45, streak: 2 }));
    const { useProgress } = await loadModule();
    const { result } = renderHook(() => useProgress());
    expect(result.current).toMatchObject({ xp: 45, streak: 2, completedLevelIds: [], isSoundEnabled: true });
  });

  it("falls back to the initial progress when stored data is corrupted", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    const { useProgress, INITIAL_PROGRESS } = await loadModule();
    const { result } = renderHook(() => useProgress());
    expect(result.current).toEqual(INITIAL_PROGRESS);
  });

  it("falls back to the initial progress when storage cannot be read", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { useProgress, INITIAL_PROGRESS } = await loadModule();
    const { result } = renderHook(() => useProgress());
    expect(result.current).toEqual(INITIAL_PROGRESS);
  });

  it("renders the initial progress on the server, ignoring stored data", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ xp: 99 }));
    const { useProgress } = await loadModule();
    function XpProbe() {
      return createElement("span", null, `xp:${useProgress().xp}`);
    }
    expect(renderToString(createElement(XpProbe))).toContain("xp:0");
  });

  it("re-reads storage when another tab changes the progress key", async () => {
    const { useProgress } = await loadModule();
    const { result } = renderHook(() => useProgress());

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ xp: 30 }));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "other-key" }));
    });
    expect(result.current.xp).toBe(0);

    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    });
    expect(result.current.xp).toBe(30);
  });

  it("stops listening to storage events after unmount", async () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { useProgress } = await loadModule();
    const { unmount } = renderHook(() => useProgress());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("storage", expect.any(Function));
  });
});

describe("updateProgress", () => {
  it("persists the new progress and notifies subscribers", async () => {
    const { useProgress, updateProgress } = await loadModule();
    const { result } = renderHook(() => useProgress());

    act(() => updateProgress((p) => ({ ...p, xp: p.xp + 15 })));

    expect(result.current.xp).toBe(15);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}")).toMatchObject({ xp: 15 });
  });

  it("keeps progress in memory when storage cannot be written", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    const { useProgress, updateProgress } = await loadModule();
    const { result } = renderHook(() => useProgress());

    act(() => updateProgress((p) => ({ ...p, isSoundEnabled: false })));

    expect(result.current.isSoundEnabled).toBe(false);
  });
});

describe("registerSessionCompletion", () => {
  const base: Progress = {
    xp: 0,
    streak: 0,
    lastPlayedDay: null,
    completedLessonIds: [],
    completedLevelIds: [],
    openedChestIds: [],
    isSoundEnabled: true,
  };
  const lesson: QuizSession = { id: "municipal-1", kind: "lesson", levelId: "municipal", title: "Lição", questions: [] };
  const challenge: QuizSession = {
    id: "municipal-challenge",
    kind: "challenge",
    levelId: "municipal",
    title: "Desafio",
    questions: [],
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 23, 15, 0)); // 23 Oct 2026, local time
  });

  it("records a lesson and starts a streak on the first completion", async () => {
    const { registerSessionCompletion } = await loadModule();
    expect(registerSessionCompletion(base, lesson)).toMatchObject({
      streak: 1,
      lastPlayedDay: "2026-10-23",
      completedLessonIds: ["municipal-1"],
      completedLevelIds: [],
    });
  });

  it("records the level when its final challenge is completed", async () => {
    const { registerSessionCompletion } = await loadModule();
    expect(registerSessionCompletion(base, challenge)).toMatchObject({
      completedLessonIds: [],
      completedLevelIds: ["municipal"],
    });
  });

  it("keeps the streak when playing again on the same day", async () => {
    const { registerSessionCompletion } = await loadModule();
    const progress = { ...base, streak: 4, lastPlayedDay: "2026-10-23" };
    expect(registerSessionCompletion(progress, lesson).streak).toBe(4);
  });

  it("extends the streak when the last play was yesterday", async () => {
    const { registerSessionCompletion } = await loadModule();
    const progress = { ...base, streak: 4, lastPlayedDay: "2026-10-22" };
    expect(registerSessionCompletion(progress, lesson).streak).toBe(5);
  });

  it("resets the streak after a missed day", async () => {
    const { registerSessionCompletion } = await loadModule();
    const progress = { ...base, streak: 4, lastPlayedDay: "2026-10-20" };
    expect(registerSessionCompletion(progress, lesson).streak).toBe(1);
  });

  it("does not duplicate already completed lessons or levels", async () => {
    const { registerSessionCompletion } = await loadModule();
    const progress = { ...base, completedLessonIds: ["municipal-1"], completedLevelIds: ["municipal"] };
    expect(registerSessionCompletion(progress, lesson).completedLessonIds).toEqual(["municipal-1"]);
    expect(registerSessionCompletion(progress, challenge).completedLevelIds).toEqual(["municipal"]);
  });

  it("tells whether the player already played today", async () => {
    const { hasPlayedToday } = await loadModule();
    expect(hasPlayedToday(base)).toBe(false);
    expect(hasPlayedToday({ ...base, lastPlayedDay: "2026-10-23" })).toBe(true);
    expect(hasPlayedToday({ ...base, lastPlayedDay: "2026-10-22" })).toBe(false);
    expect(hasPlayedToday({ ...base, lastPlayedDay: "2026-10-22" }, new Date(2026, 9, 22))).toBe(true);
  });
});

describe("registerChestOpening", () => {
  it("awards the bonus XP once per chest", async () => {
    const { registerChestOpening, INITIAL_PROGRESS } = await loadModule();
    const opened = registerChestOpening(INITIAL_PROGRESS, "municipal-chest", 20);
    expect(opened).toMatchObject({ xp: 20, openedChestIds: ["municipal-chest"] });
    expect(registerChestOpening(opened, "municipal-chest", 20)).toBe(opened);
  });
});
