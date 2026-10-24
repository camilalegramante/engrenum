import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STRINGS } from "@/data/strings";
import { playSound } from "@/lib/sound";
import type { Question, QuizSession, QuizSessionKind } from "@/types/quiz";
import EngrenumQuiz from "./EngrenumQuiz";

vi.mock("@/lib/sound", () => ({ playSound: vi.fn() }));

function makeQuestion(id: number): Question {
  return {
    id,
    sphere: "municipal",
    prompt: `Cenário ${id}: quem resolve?`,
    options: [
      { id: "a", text: `Certa ${id}`, isCorrect: true },
      { id: "b", text: `Errada ${id}`, isCorrect: false },
    ],
    constitutionalArticle: `Art. ${id} da CF/88`,
    explanation: `Explicação ${id}`,
  };
}

function makeSession(questionCount: number, kind: QuizSessionKind): QuizSession {
  return {
    id: kind === "lesson" ? "municipal-1" : "municipal-challenge",
    kind,
    levelId: "municipal",
    title: "Serviços do bairro",
    questions: Array.from({ length: questionCount }, (_, i) => makeQuestion(i + 1)),
  };
}

function renderQuiz(questionCount: number, kind: QuizSessionKind = "challenge") {
  const props = {
    session: makeSession(questionCount, kind),
    xp: 0,
    streak: 0,
    isSoundEnabled: true,
    onToggleSound: vi.fn(),
    onCorrectAnswer: vi.fn(),
    onComplete: vi.fn(),
    onExit: vi.fn(),
  };
  render(<EngrenumQuiz {...props} />);
  return props;
}

async function answer(optionText: string) {
  await userEvent.click(screen.getByRole("button", { name: optionText }));
  await userEvent.click(screen.getByRole("button", { name: STRINGS.quiz.verify }));
}

beforeEach(() => {
  vi.mocked(playSound).mockClear();
});

describe("EngrenumQuiz", () => {
  it("shows the first scenario and enables verification only after a choice", async () => {
    renderQuiz(2);

    expect(screen.getByRole("heading", { name: "Cenário 1: quem resolve?" })).toBeVisible();
    expect(screen.getByText(STRINGS.quiz.sphere("Municipal"))).toBeVisible();
    expect(screen.getByText(STRINGS.quiz.phase(1, 2))).toBeVisible();
    expect(screen.getByRole("button", { name: STRINGS.quiz.verify })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Errada 1" }));
    expect(screen.getByRole("button", { name: "Errada 1" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: STRINGS.quiz.verify })).toBeEnabled();
    expect(playSound).toHaveBeenCalledWith("tap", true);
  });

  it("locks the options and explains a correct answer", async () => {
    const props = renderQuiz(2);
    await answer("Certa 1");

    expect(screen.getByRole("status")).toHaveTextContent(STRINGS.quiz.correctTitle);
    expect(screen.getByText("📖 Art. 1 da CF/88")).toBeVisible();
    expect(screen.getByText("Explicação 1")).toBeVisible();
    expect(screen.queryByText(STRINGS.quiz.correctAnswer("Certa 1"))).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Certa 1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Errada 1" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: STRINGS.quiz.verify })).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    expect(props.onCorrectAnswer).toHaveBeenCalledOnce();
    expect(playSound).toHaveBeenCalledWith("correct", true);
  });

  it("costs a life and shows the right answer on a mistake", async () => {
    const props = renderQuiz(2);
    await answer("Errada 1");

    expect(screen.getByRole("status")).toHaveTextContent(STRINGS.quiz.wrongTitle);
    expect(screen.getByText(STRINGS.quiz.correctAnswer("Certa 1"))).toBeVisible();
    expect(screen.getByTitle(STRINGS.hud.livesTitle)).toHaveTextContent("2");
    expect(screen.getByRole("main")).toHaveClass("animate-shake");
    expect(props.onCorrectAnswer).not.toHaveBeenCalled();
    expect(playSound).toHaveBeenCalledWith("error", true);
  });

  it("advances to the next scenario", async () => {
    renderQuiz(2);
    await answer("Certa 1");
    await userEvent.click(screen.getByRole("button", { name: STRINGS.quiz.nextQuestion }));

    expect(screen.getByRole("heading", { name: "Cenário 2: quem resolve?" })).toBeVisible();
    expect(screen.getByText(STRINGS.quiz.phase(2, 2))).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: STRINGS.quiz.verify })).toBeDisabled();
  });

  it("completes the level and shows the victory screen", async () => {
    const props = renderQuiz(2);
    await answer("Certa 1");
    await userEvent.click(screen.getByRole("button", { name: STRINGS.quiz.nextQuestion }));
    await answer("Errada 2");
    await userEvent.click(screen.getByRole("button", { name: STRINGS.quiz.finishLevel }));

    expect(props.onComplete).toHaveBeenCalledOnce();
    expect(screen.getByText(STRINGS.quiz.levelDoneBadge)).toBeVisible();
    expect(screen.getByRole("heading", { name: "Cidadão Atento" })).toBeVisible();
    expect(screen.getByText(STRINGS.quiz.pointsLabel).nextElementSibling).toHaveTextContent("+15 XP");
    expect(screen.getByText(STRINGS.quiz.accuracyLabel).nextElementSibling).toHaveTextContent("50%");
  });

  it("celebrates a completed lesson", async () => {
    renderQuiz(2, "lesson");
    await answer("Certa 1");
    await userEvent.click(screen.getByRole("button", { name: STRINGS.quiz.nextQuestion }));
    await answer("Errada 2");
    await userEvent.click(screen.getByRole("button", { name: STRINGS.quiz.finishLevel }));

    expect(screen.getByText(STRINGS.quiz.lessonDoneBadge)).toBeVisible();
    expect(screen.getByRole("heading", { name: STRINGS.quiz.lessonDone })).toBeVisible();
    expect(screen.getByText(STRINGS.quiz.lessonDoneDescription("Serviços do bairro"))).toBeVisible();
  });

  it("calls a flawless lesson perfect", async () => {
    renderQuiz(1, "lesson");
    await answer("Certa 1");
    await userEvent.click(screen.getByRole("button", { name: STRINGS.quiz.finishLevel }));
    expect(screen.getByRole("heading", { name: STRINGS.quiz.perfectLesson })).toBeVisible();
  });

  it("restarts or exits from the victory screen", async () => {
    const props = renderQuiz(1);
    await answer("Certa 1");
    await userEvent.click(screen.getByRole("button", { name: STRINGS.quiz.finishLevel }));

    await userEvent.click(screen.getByRole("button", { name: STRINGS.common.backToPath }));
    expect(props.onExit).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole("button", { name: STRINGS.common.playAgain }));
    expect(screen.getByRole("heading", { name: "Cenário 1: quem resolve?" })).toBeVisible();
    expect(screen.getByTitle(STRINGS.hud.livesTitle)).toHaveTextContent("3");
  });

  describe("when all lives are lost", () => {
    async function loseAllLives() {
      const props = renderQuiz(4);
      for (const n of [1, 2]) {
        await answer(`Errada ${n}`);
        await userEvent.click(screen.getByRole("button", { name: STRINGS.quiz.nextQuestion }));
      }
      await answer("Errada 3");
      return props;
    }

    it("announces it in the drawer and opens the defeat dialog", async () => {
      await loseAllLives();
      expect(screen.getByRole("status")).toHaveTextContent(STRINGS.quiz.outOfLivesTitle);
      expect(screen.getByTitle(STRINGS.hud.livesTitle)).toHaveTextContent("0");

      await userEvent.click(screen.getByRole("button", { name: STRINGS.common.seeResult }));
      const dialog = screen.getByRole("dialog", { name: STRINGS.quiz.outOfLivesTitle });
      expect(dialog).toHaveTextContent(STRINGS.quiz.defeatMessage(0, 3));
    });

    it("lets the player retry the level", async () => {
      await loseAllLives();
      await userEvent.click(screen.getByRole("button", { name: STRINGS.common.seeResult }));
      await userEvent.click(screen.getByRole("button", { name: STRINGS.quiz.retry }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByText(STRINGS.quiz.phase(1, 4))).toBeVisible();
      expect(screen.getByTitle(STRINGS.hud.livesTitle)).toHaveTextContent("3");
    });

    it("lets the player go back to the map", async () => {
      const props = await loseAllLives();
      await userEvent.click(screen.getByRole("button", { name: STRINGS.common.seeResult }));
      await userEvent.click(screen.getByRole("button", { name: STRINGS.quiz.backToMap }));
      expect(props.onExit).toHaveBeenCalledOnce();
    });
  });

  it("forwards sound toggling and leaving to the parent", async () => {
    const props = renderQuiz(1);
    await userEvent.click(screen.getByRole("button", { name: STRINGS.hud.disableSound }));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.hud.back }));
    expect(props.onToggleSound).toHaveBeenCalledOnce();
    expect(props.onExit).toHaveBeenCalledOnce();
  });
});
