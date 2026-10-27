import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEVELS } from "@/data/levels";
import { STRINGS } from "@/data/strings";
import swipeCards from "@/data/swipeCards.json";
import { GLOSSARY_TERMS, buildTermQuizRound, getTermOfDay, segmentByGlossary } from "@/lib/glossary";
import { toStepView } from "@/lib/session";
import type { SessionStep } from "@/types/quiz";

vi.mock("@/lib/sound", () => ({ playSound: vi.fn() }));

const STORAGE_KEY = "engrenum:progress";
const [municipal] = LEVELS;

// The progress store caches localStorage at module level, so each test renders a fresh app.
async function renderApp() {
  vi.resetModules();
  const { default: EngrenumApp } = await import("./EngrenumApp");
  render(<EngrenumApp />);
}

function storedProgress(): Record<string, unknown> {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown>;
}

async function startNode(nodeTitle: string, actionLabel: string) {
  await userEvent.click(screen.getByRole("button", { name: new RegExp(`^${nodeTitle}:`) }));
  await userEvent.click(screen.getByRole("button", { name: actionLabel }));
}

async function answerAllCorrectly(steps: SessionStep[]) {
  for (const [i, step] of steps.entries()) {
    const correct = toStepView(step).options.find((o) => o.isCorrect);
    await userEvent.click(screen.getByRole("button", { name: correct?.text }));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.quiz.verify }));
    const isLast = i === steps.length - 1;
    await userEvent.click(screen.getByRole("button", { name: isLast ? "Concluir Nível →" : STRINGS.quiz.nextQuestion }));
  }
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("EngrenumApp", () => {
  it("starts on the learning path", async () => {
    await renderApp();
    expect(screen.getByRole("region", { name: "No Meu Bairro" })).toBeVisible();
    expect(screen.queryByRole("button", { name: STRINGS.hud.back })).not.toBeInTheDocument();
  });

  it("plays a lesson, awards XP and records it on the path", async () => {
    await renderApp();
    await startNode("Serviços do bairro", STRINGS.path.startLesson);
    const lessonSteps = municipal.lessons[0].steps;
    expect(screen.getByRole("heading", { name: toStepView(lessonSteps[0]).prompt })).toBeVisible();

    await answerAllCorrectly(lessonSteps);
    expect(screen.getByRole("heading", { name: STRINGS.quiz.perfectLesson })).toBeVisible();
    expect(storedProgress()).toMatchObject({
      xp: lessonSteps.length * 15,
      streak: 1,
      completedLessonIds: ["municipal-1"],
    });

    await userEvent.click(screen.getByRole("button", { name: STRINGS.common.backToPath }));
    expect(screen.getByRole("button", { name: STRINGS.path.nodeLabel("Serviços do bairro", STRINGS.path.status.completed) })).toBeVisible();
    expect(screen.getByRole("button", { name: STRINGS.path.nodeLabel("Saúde, escola e calçada", STRINGS.path.status.current) })).toBeVisible();
  });

  it("plays Fato ou Fake Eleitoral, awards XP and returns to the path", async () => {
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: STRINGS.dashboard.swipeAction }));
    expect(screen.getByRole("heading", { name: STRINGS.swipe.title })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: swipeCards[0].isLegitimate ? "Legítimo" : STRINGS.swipe.illegalAction }));
    expect(screen.getByRole("status")).toHaveTextContent(swipeCards[0].constitutionalArticle);
    expect(storedProgress()).toMatchObject({ xp: 15 });

    await userEvent.click(screen.getByRole("button", { name: STRINGS.hud.back }));
    expect(screen.getByRole("region", { name: "No Meu Bairro" })).toBeVisible();
  });

  it("opens the civic glossary and returns to the path", async () => {
    await renderApp();
    await userEvent.click(within(screen.getByRole("navigation", { name: STRINGS.hud.menu })).getByRole("button", { name: STRINGS.hud.glossary }));
    expect(screen.getByRole("heading", { level: 1, name: STRINGS.glossary.heading })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: STRINGS.hud.back }));
    expect(screen.getByRole("region", { name: "No Meu Bairro" })).toBeVisible();
  });

  it("adds an opened glossary term to the album, rewarding it only once", async () => {
    await renderApp();
    await userEvent.click(within(screen.getByRole("navigation", { name: STRINGS.hud.menu })).getByRole("button", { name: STRINGS.hud.glossary }));
    const [first] = GLOSSARY_TERMS;
    await userEvent.click(screen.getByRole("button", { name: STRINGS.glossary.cardLabel(first.term, STRINGS.glossary.termStatus.new) }));
    expect(screen.getByRole("dialog")).toHaveTextContent(STRINGS.glossary.reward(5));
    expect(storedProgress()).toMatchObject({ xp: 5, discoveredTermIds: [first.id] });

    await userEvent.click(screen.getByRole("button", { name: STRINGS.glossary.confirm }));
    await userEvent.click(
      screen.getByRole("button", { name: STRINGS.glossary.cardLabel(first.term, STRINGS.glossary.termStatus.discovered) }),
    );
    expect(screen.getByRole("dialog")).not.toHaveTextContent(STRINGS.glossary.newDiscovery);
    expect(storedProgress()).toMatchObject({ xp: 5 });
  });

  it("plays 'Qual é o termo?' from the glossary and masters the terms it gets right", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const [first] = buildTermQuizRound(GLOSSARY_TERMS, [], () => 0);
    await renderApp();
    await userEvent.click(within(screen.getByRole("navigation", { name: STRINGS.hud.menu })).getByRole("button", { name: STRINGS.hud.glossary }));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.glossary.startQuiz }));
    expect(screen.getByRole("heading", { name: STRINGS.termQuiz.clue(first.clue) })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: first.term.term }));
    expect(storedProgress()).toMatchObject({ xp: 10, masteredTermIds: [first.term.id], discoveredTermIds: [first.term.id] });

    await userEvent.click(screen.getByRole("button", { name: STRINGS.hud.back }));
    expect(screen.getByRole("button", { name: STRINGS.glossary.cardLabel(first.term.term, STRINGS.glossary.termStatus.mastered) })).toBeVisible();
  });

  it("starts a fresh round on 'Jogar novamente'", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    await renderApp();
    await userEvent.click(within(screen.getByRole("navigation", { name: STRINGS.hud.menu })).getByRole("button", { name: STRINGS.hud.glossary }));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.glossary.startQuiz }));
    for (let i = 0; i < 5; i++) {
      const options = within(screen.getByRole("list", { name: STRINGS.termQuiz.optionsLabel })).getAllByRole("button");
      await userEvent.click(options[0]);
      await userEvent.click(screen.getByRole("button", { name: i === 4 ? STRINGS.common.seeResult : STRINGS.termQuiz.nextClue }));
    }
    await userEvent.click(screen.getByRole("button", { name: STRINGS.common.playAgain }));
    expect(screen.getByText(STRINGS.termQuiz.clueCounter(1, 5))).toBeVisible();
  });

  it("links glossary terms in a lesson's explanation and adds them to the album", async () => {
    await renderApp();
    await startNode("Serviços do bairro", STRINGS.path.startLesson);
    const [firstStep] = municipal.lessons[0].steps;
    const question = firstStep.kind === "quiz" ? firstStep.question : municipal.questions[0];
    const linked = segmentByGlossary(question.explanation).find((segment) => segment.term);
    expect(linked).toBeDefined();

    await userEvent.click(screen.getByRole("button", { name: question.options.find((o) => o.isCorrect)?.text }));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.quiz.verify }));
    await userEvent.click(within(screen.getByRole("status")).getByRole("button", { name: linked?.text }));
    expect(storedProgress()).toMatchObject({ xp: 20, discoveredTermIds: [linked?.term?.id] });
  });

  it("reads the term of the day from the path for a daily bonus", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 27, 9));
    const termOfDay = getTermOfDay("2026-10-27");
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: STRINGS.dashboard.termOfDayAction(10) }));
    expect(screen.getByRole("dialog", { name: termOfDay.term })).toHaveTextContent(STRINGS.glossary.reward(15));
    expect(storedProgress()).toMatchObject({ xp: 15, termOfDayReadDay: "2026-10-27", discoveredTermIds: [termOfDay.id] });
  });

  it("leaves a lesson midway and returns to the path", async () => {
    await renderApp();
    await startNode("Serviços do bairro", STRINGS.path.startLesson);
    await userEvent.click(screen.getByRole("button", { name: STRINGS.hud.back }));
    expect(screen.getByRole("region", { name: "No Meu Bairro" })).toBeVisible();
  });

  it("opens the reward chest for bonus XP", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ completedLessonIds: ["municipal-1", "municipal-2"] }));
    await renderApp();
    await startNode(STRINGS.path.chestTitle, STRINGS.path.openChest);

    expect(screen.getByRole("dialog", { name: STRINGS.chest.title })).toHaveTextContent(STRINGS.chest.reward(20));
    expect(storedProgress()).toMatchObject({ xp: 20, openedChestIds: ["municipal-chest"] });

    await userEvent.click(screen.getByRole("button", { name: STRINGS.chest.confirm }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: STRINGS.path.nodeLabel(STRINGS.path.chestTitle, STRINGS.path.status.completed) })).toBeVisible();
  });

  it("completes the level through the final challenge", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ completedLessonIds: municipal.lessons.map((lesson) => lesson.id) }),
    );
    await renderApp();
    await startNode(STRINGS.path.challengeTitle, STRINGS.path.startChallenge);
    await answerAllCorrectly(municipal.lessons.flatMap((lesson) => lesson.steps));

    expect(screen.getByRole("heading", { name: "Guardião da Constituição" })).toBeVisible();
    const stepCount = municipal.lessons.flatMap((lesson) => lesson.steps).length;
    expect(storedProgress()).toMatchObject({ xp: stepCount * 15, completedLevelIds: ["municipal"] });

    await userEvent.click(screen.getByRole("button", { name: STRINGS.common.backToPath }));
    expect(screen.getByRole("region", { name: "No Meu Bairro" })).toHaveTextContent(STRINGS.path.levelCompleted);
    expect(screen.getByText("Líder Comunitário")).toBeVisible();
  });

  it("persists the sound preference from the path and from a lesson", async () => {
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: STRINGS.hud.disableSound }));
    expect(storedProgress()).toMatchObject({ isSoundEnabled: false });

    await startNode("Serviços do bairro", STRINGS.path.startLesson);
    await userEvent.click(screen.getByRole("button", { name: STRINGS.hud.enableSound }));
    expect(storedProgress()).toMatchObject({ isSoundEnabled: true });
  });
});
