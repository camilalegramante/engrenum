import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEVELS } from "@/data/levels";
import { STRINGS } from "@/data/strings";
import { TERM_OF_DAY_XP, getTermOfDay } from "@/lib/glossary";
import { INITIAL_PROGRESS, type Progress } from "@/lib/progress";
import type { Level } from "@/types/quiz";
import Dashboard from "./Dashboard";

function renderDashboard(progress: Partial<Progress> = {}, levels?: Level[]) {
  const props = { onStartSession: vi.fn(), onOpenChest: vi.fn(), onStartSwipe: vi.fn(), onOpenGlossary: vi.fn(), onReadTermOfDay: vi.fn() };
  render(<Dashboard progress={{ ...INITIAL_PROGRESS, ...progress }} levels={levels} {...props} />);
  return props;
}

function node(name: string): HTMLElement {
  return screen.getByRole("button", { name: new RegExp(`^${name}:`) });
}

const ALL_MUNICIPAL_LESSONS = ["municipal-1", "municipal-2", "municipal-3", "municipal-4"];

describe("Dashboard", () => {
  it("shows a banner per level with its sphere and step count", () => {
    renderDashboard();
    const municipal = screen.getByRole("region", { name: "No Meu Bairro" });
    expect(within(municipal).getByText(STRINGS.path.unitLabel(1, "Municipal"))).toBeVisible();
    expect(within(municipal).getByText(STRINGS.path.steps(0, 5))).toBeVisible();
    expect(screen.getByRole("region", { name: "Ordem e Região" })).toHaveTextContent(STRINGS.path.comingSoon);
  });

  it("offers the Fato ou Fake Eleitoral quick mode", async () => {
    const { onStartSwipe } = renderDashboard();
    const section = screen.getByRole("region", { name: STRINGS.swipe.title });
    await userEvent.click(within(section).getByRole("button", { name: STRINGS.dashboard.swipeAction }));
    expect(onStartSwipe).toHaveBeenCalledOnce();
  });


  describe("mobile bottom bar", () => {
    function bottomNav(): HTMLElement {
      return screen.getByRole("navigation", { name: STRINGS.bottomNav.label });
    }

    it("switches between the path and the profile (civic rank and daily mission)", async () => {
      renderDashboard();
      const nav = bottomNav();
      const pathTab = within(nav).getByRole("button", { name: STRINGS.bottomNav.path });
      const profileTab = within(nav).getByRole("button", { name: STRINGS.bottomNav.profile });
      const journey = screen.getByRole("complementary", { name: STRINGS.journey.label }).parentElement as HTMLElement;
      const path = screen.getByRole("heading", { level: 1, name: STRINGS.dashboard.heading }).parentElement as HTMLElement;
      expect(pathTab).toHaveAttribute("aria-current", "page");
      expect(journey).toHaveClass("hidden");
      expect(path).not.toHaveClass("hidden");

      await userEvent.click(profileTab);
      expect(profileTab).toHaveAttribute("aria-current", "page");
      expect(pathTab).not.toHaveAttribute("aria-current");
      expect(journey).not.toHaveClass("hidden");
      expect(path).toHaveClass("hidden");

      await userEvent.click(pathTab);
      expect(path).not.toHaveClass("hidden");
    });

    it("starts the quick mode and opens the glossary", async () => {
      const { onStartSwipe, onOpenGlossary } = renderDashboard();
      await userEvent.click(within(bottomNav()).getByRole("button", { name: STRINGS.bottomNav.quickMode }));
      expect(onStartSwipe).toHaveBeenCalledOnce();
      await userEvent.click(within(bottomNav()).getByRole("button", { name: STRINGS.bottomNav.glossary }));
      expect(onOpenGlossary).toHaveBeenCalledOnce();
    });

  });

  describe("term of the day", () => {
    const today = "2026-10-27";
    const termOfDay = getTermOfDay(today);

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 9, 27, 12));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows today's term and claims its bonus when read", async () => {
      const { onReadTermOfDay } = renderDashboard();
      const section = screen.getByRole("region", { name: termOfDay.term });
      expect(section).toHaveTextContent(STRINGS.dashboard.termOfDayHeading);
      expect(section).toHaveTextContent(termOfDay.shortDefinition);

      await userEvent.click(within(section).getByRole("button", { name: STRINGS.dashboard.termOfDayAction(TERM_OF_DAY_XP) }));
      expect(onReadTermOfDay).toHaveBeenCalledOnce();
      const dialog = screen.getByRole("dialog", { name: termOfDay.term });
      expect(dialog).toHaveTextContent(STRINGS.glossary.reward(TERM_OF_DAY_XP));
    });

    it("opens it from the bottom bar, flagging the pending bonus until it is read", async () => {
      const { onReadTermOfDay } = renderDashboard();
      const nav = screen.getByRole("navigation", { name: STRINGS.bottomNav.label });
      await userEvent.click(within(nav).getByRole("button", { name: STRINGS.bottomNav.termOfDayPending }));
      expect(onReadTermOfDay).toHaveBeenCalledOnce();
      expect(screen.getByRole("dialog", { name: termOfDay.term })).toHaveTextContent(STRINGS.glossary.reward(TERM_OF_DAY_XP));
    });

    it("drops the bottom bar badge once read today", () => {
      renderDashboard({ termOfDayReadDay: today });
      const nav = screen.getByRole("navigation", { name: STRINGS.bottomNav.label });
      expect(within(nav).getByRole("button", { name: STRINGS.bottomNav.termOfDay })).toBeEnabled();
    });

    it("lets the player reread it without a second bonus", async () => {
      renderDashboard({ termOfDayReadDay: today });
      const section = screen.getByRole("region", { name: termOfDay.term });
      expect(section).toHaveTextContent(STRINGS.dashboard.termOfDayDone);

      await userEvent.click(within(section).getByRole("button", { name: STRINGS.dashboard.termOfDayReread }));
      expect(screen.getByRole("dialog", { name: termOfDay.term })).not.toHaveTextContent(STRINGS.glossary.newDiscovery);
    });
  });

  it("highlights the next step with a 'Jogar' callout and the mascot tip", () => {
    renderDashboard();
    expect(node("Serviços do bairro")).toHaveAccessibleName(STRINGS.path.nodeLabel("Serviços do bairro", STRINGS.path.status.current));
    expect(node("Saúde, escola e calçada")).toHaveAccessibleName(STRINGS.path.nodeLabel("Saúde, escola e calçada", STRINGS.path.status.locked));
    expect(screen.getByText(STRINGS.path.play)).toBeVisible();
    expect(screen.getByText(LEVELS[0].mascotTip)).toBeVisible();
    expect(screen.getByRole("img", { name: STRINGS.mascot.waving })).toBeVisible();
  });

  it("treats the 'Jogar' callout as a hint, not a button", () => {
    renderDashboard();
    const callout = screen.getByText(STRINGS.path.play);
    expect(callout.closest("button")).toBeNull();
    expect(callout).toHaveClass("pointer-events-none");
  });

  // Hidden with `visibility`, not removed, so the mascot below it stays in place.
  it("hides the mascot tip while a step's card is open, keeping the mascot where it was", async () => {
    renderDashboard();
    const tip = screen.getByText(LEVELS[0].mascotTip);
    await userEvent.click(node("Serviços do bairro"));
    expect(screen.getByRole("button", { name: STRINGS.path.startLesson })).toBeVisible();
    expect(screen.getByText(LEVELS[0].mascotTip)).toBe(tip);
    expect(tip).toHaveClass("invisible");

    await userEvent.click(node("Serviços do bairro"));
    expect(tip).not.toHaveClass("invisible");
  });

  it("shows coming-soon levels with placeholder steps and a sleepy mascot", () => {
    renderDashboard();
    expect(screen.getAllByTestId("ghost-node")).toHaveLength(9);
    expect(screen.getAllByRole("img", { name: STRINGS.mascot.sleepy })).toHaveLength(3);
  });

  it("opens a lesson card and starts the lesson", async () => {
    const { onStartSession } = renderDashboard();
    await userEvent.click(node("Serviços do bairro"));

    expect(node("Serviços do bairro")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(STRINGS.path.lessonSubtitle(1, 4, STRINGS.path.scenarios(3)))).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: STRINGS.path.startLesson }));
    expect(onStartSession).toHaveBeenCalledWith(expect.objectContaining({ id: "municipal-1", kind: "lesson" }));
  });

  it("closes the card when the same step is tapped again", async () => {
    renderDashboard();
    await userEvent.click(node("Serviços do bairro"));
    await userEvent.click(node("Serviços do bairro"));
    expect(screen.queryByRole("button", { name: STRINGS.path.startLesson })).not.toBeInTheDocument();
  });

  it("explains how to unlock a locked step", async () => {
    renderDashboard();
    await userEvent.click(node(STRINGS.path.challengeTitle));
    expect(screen.getByText(STRINGS.path.challengeSubtitle(STRINGS.path.scenarios(10)))).toBeVisible();
    expect(screen.getByText(STRINGS.path.lockedMessage)).toBeVisible();
    expect(screen.queryByRole("button", { name: STRINGS.path.startChallenge })).not.toBeInTheDocument();
  });

  it("lets the player replay a completed lesson", async () => {
    const { onStartSession } = renderDashboard({ completedLessonIds: ["municipal-1"] });
    expect(node("Serviços do bairro")).toHaveAccessibleName(STRINGS.path.nodeLabel("Serviços do bairro", STRINGS.path.status.completed));
    await userEvent.click(node("Serviços do bairro"));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.path.replayLesson }));
    expect(onStartSession).toHaveBeenCalledWith(expect.objectContaining({ id: "municipal-1" }));
  });

  it("opens the reward chest once two lessons are done", async () => {
    const { onOpenChest } = renderDashboard({ completedLessonIds: ["municipal-1", "municipal-2"] });
    expect(node(STRINGS.path.chestTitle)).toHaveAccessibleName(STRINGS.path.nodeLabel(STRINGS.path.chestTitle, STRINGS.path.status.available));

    await userEvent.click(node(STRINGS.path.chestTitle));
    expect(screen.getByText(STRINGS.path.chestBonus(20))).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: STRINGS.path.openChest }));

    expect(onOpenChest).toHaveBeenCalledWith("municipal-chest");
    expect(screen.queryByRole("button", { name: STRINGS.path.openChest })).not.toBeInTheDocument();
  });

  it("tells the player when a chest was already opened", async () => {
    renderDashboard({ completedLessonIds: ["municipal-1", "municipal-2"], openedChestIds: ["municipal-chest"] });
    await userEvent.click(node(STRINGS.path.chestTitle));
    expect(screen.getByText(STRINGS.path.chestOpened)).toBeVisible();
  });

  it("starts the final challenge after every lesson", async () => {
    const { onStartSession } = renderDashboard({ completedLessonIds: ALL_MUNICIPAL_LESSONS });
    await userEvent.click(node(STRINGS.path.challengeTitle));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.path.startChallenge }));
    expect(onStartSession).toHaveBeenCalledWith(expect.objectContaining({ kind: "challenge" }));
  });

  it("marks a completed level and allows redoing its challenge", async () => {
    renderDashboard({ completedLevelIds: ["municipal"] });
    expect(screen.getByRole("region", { name: "No Meu Bairro" })).toHaveTextContent(STRINGS.path.levelCompleted);
    expect(screen.queryByText(STRINGS.path.play)).not.toBeInTheDocument();
    await userEvent.click(node(STRINGS.path.challengeTitle));
    expect(screen.getByRole("button", { name: STRINGS.path.redoChallenge })).toBeVisible();
  });

  it("dims a level that has content but is still locked", () => {
    const question = LEVELS[0].questions[0];
    const levels: Level[] = [
      LEVELS[0],
      { ...LEVELS[1], lessons: [{ id: "state-1", title: "Única", questions: [question] }], questions: [question] },
    ];
    renderDashboard({}, levels);
    const state = screen.getByRole("region", { name: "Ordem e Região" });
    expect(within(state).getByText(STRINGS.path.steps(0, 2))).toBeVisible();
    expect(within(state).queryByText(LEVELS[1].mascotTip)).toBeVisible();
    expect(within(state).getByRole("img", { name: STRINGS.mascot.sleepy })).toBeVisible();
  });

  it("uses the singular for single-scenario lessons", async () => {
    const question = LEVELS[0].questions[0];
    const levels: Level[] = [
      { ...LEVELS[0], lessons: [{ id: "municipal-1", title: "Única", questions: [question] }], questions: [question] },
    ];
    renderDashboard({}, levels);
    await userEvent.click(node("Única"));
    expect(screen.getByText(STRINGS.path.lessonSubtitle(1, 1, STRINGS.path.scenarios(1)))).toBeVisible();
  });

  describe("journey panel", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 9, 23, 12, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows the civic rank and the XP left for the next one", () => {
      renderDashboard({ xp: 105 });
      const panel = screen.getByRole("complementary", { name: STRINGS.journey.label });
      expect(within(panel).getByText("Fiscal Cívico Júnior")).toBeVisible();
      expect(within(panel).getByText(STRINGS.journey.xpToNextRank(45, "Líder Comunitário"))).toBeVisible();
      expect(within(panel).getByRole("progressbar", { name: STRINGS.journey.rankProgress })).toHaveAttribute(
        "aria-valuenow",
        "50",
      );
    });

    it("celebrates reaching the top rank", () => {
      renderDashboard({ xp: 400 });
      expect(screen.getByText(STRINGS.journey.topRank)).toBeVisible();
    });

    it("tracks the daily mission", () => {
      renderDashboard();
      expect(screen.getByText(STRINGS.journey.missionPending)).toBeVisible();
      expect(screen.getByRole("progressbar", { name: STRINGS.journey.missionProgress })).toHaveAttribute(
        "aria-valuenow",
        "0",
      );
    });

    it("marks the daily mission as done after playing today", () => {
      renderDashboard({ lastPlayedDay: "2026-10-23", streak: 4 });
      expect(screen.getByText(STRINGS.journey.missionDone(4))).toBeVisible();
      expect(screen.getByRole("progressbar", { name: STRINGS.journey.missionProgress })).toHaveAttribute(
        "aria-valuenow",
        "1",
      );
    });
  });
});
