import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LEVELS } from "@/data/levels";
import { STRINGS } from "@/data/strings";
import swipeCards from "@/data/swipeCards.json";
import type { Question } from "@/types/quiz";

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

async function answerAllCorrectly(questions: Question[]) {
  for (const [i, question] of questions.entries()) {
    const correct = question.options.find((o) => o.isCorrect);
    await userEvent.click(screen.getByRole("button", { name: correct?.text }));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.quiz.verify }));
    const isLast = i === questions.length - 1;
    await userEvent.click(screen.getByRole("button", { name: isLast ? "Concluir Nível →" : STRINGS.quiz.nextQuestion }));
  }
}

beforeEach(() => {
  window.localStorage.clear();
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
    expect(screen.getByRole("heading", { name: municipal.lessons[0].questions[0].prompt })).toBeVisible();

    await answerAllCorrectly(municipal.lessons[0].questions);
    expect(screen.getByRole("heading", { name: STRINGS.quiz.perfectLesson })).toBeVisible();
    expect(storedProgress()).toMatchObject({ xp: 45, streak: 1, completedLessonIds: ["municipal-1"] });

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
    await answerAllCorrectly(municipal.questions);

    expect(screen.getByRole("heading", { name: "Guardião da Constituição" })).toBeVisible();
    expect(storedProgress()).toMatchObject({ xp: 150, completedLevelIds: ["municipal"] });

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
