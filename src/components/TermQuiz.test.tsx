import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STRINGS } from "@/data/strings";
import { playSound } from "@/lib/sound";
import type { GlossaryTerm, TermQuizQuestion } from "@/types/glossary";
import TermQuiz from "./TermQuiz";

vi.mock("@/lib/sound", () => ({ playSound: vi.fn() }));

function makeTerm(id: string, withArticle = true): GlossaryTerm {
  return {
    id,
    term: `Termo ${id}`,
    category: "budget",
    shortDefinition: `Definição ${id}`,
    practicalExample: `Exemplo ${id}`,
    constitutionalArticle: withArticle ? `Art. ${id} da CF/88` : undefined,
    aliases: [],
  };
}

const [a, b, c, d] = [makeTerm("1"), makeTerm("2", false), makeTerm("3"), makeTerm("4")];
const QUESTIONS: TermQuizQuestion[] = [
  { term: a, clue: "Pista 1", options: [b, a, c, d] },
  { term: b, clue: "Pista 2", options: [a, b, c, d] },
];

function renderQuiz() {
  const props = {
    questions: QUESTIONS,
    xp: 0,
    streak: 0,
    isSoundEnabled: true,
    onToggleSound: vi.fn(),
    onCorrectAnswer: vi.fn(),
    onPlayAgain: vi.fn(),
    onExit: vi.fn(),
    masteredCount: 3,
    totalTerms: 20,
  };
  render(<TermQuiz {...props} />);
  return props;
}

function option(name: string): HTMLElement {
  return within(screen.getByRole("list", { name: STRINGS.termQuiz.optionsLabel })).getByRole("button", { name });
}

beforeEach(() => {
  vi.mocked(playSound).mockClear();
});

describe("TermQuiz", () => {
  it("shows Capi's clue and four terms to choose from", () => {
    renderQuiz();
    expect(screen.getByRole("heading", { level: 1, name: STRINGS.termQuiz.title })).toBeVisible();
    expect(screen.getByText(STRINGS.termQuiz.clueCounter(1, 2))).toBeVisible();
    expect(screen.getByRole("heading", { name: STRINGS.termQuiz.clue("Pista 1") })).toBeVisible();
    expect(within(screen.getByRole("list", { name: STRINGS.termQuiz.optionsLabel })).getAllByRole("button")).toHaveLength(4);
  });

  it("masters the term on a correct answer and explains it", async () => {
    const { onCorrectAnswer } = renderQuiz();
    await userEvent.click(option(a.term));

    expect(onCorrectAnswer).toHaveBeenCalledWith("1");
    expect(playSound).toHaveBeenCalledWith("correct", true);
    const feedback = screen.getByRole("status");
    expect(feedback).toHaveTextContent(STRINGS.termQuiz.correctTitle);
    expect(feedback).toHaveTextContent(STRINGS.termQuiz.answer(a.term));
    expect(feedback).toHaveTextContent(a.practicalExample);
    expect(feedback).toHaveTextContent(a.constitutionalArticle as string);
    expect(option(b.term)).toBeDisabled();
  });

  it("reveals the answer on a mistake, then finishes the round", async () => {
    const { onCorrectAnswer, onPlayAgain, onExit } = renderQuiz();
    await userEvent.click(option(b.term));
    expect(onCorrectAnswer).not.toHaveBeenCalled();
    expect(playSound).toHaveBeenCalledWith("error", true);
    expect(screen.getByRole("status")).toHaveTextContent(STRINGS.termQuiz.wrongTitle);

    await userEvent.click(screen.getByRole("button", { name: STRINGS.termQuiz.nextClue }));
    expect(screen.getByRole("heading", { name: STRINGS.termQuiz.clue("Pista 2") })).toBeVisible();

    await userEvent.click(option(b.term));
    expect(screen.getByRole("status")).not.toHaveTextContent("CF/88");
    await userEvent.click(screen.getByRole("button", { name: STRINGS.common.seeResult }));

    expect(screen.getByRole("heading", { name: STRINGS.termQuiz.roundDone })).toBeVisible();
    expect(screen.getByText(STRINGS.termQuiz.hitsLabel).parentElement).toHaveTextContent("1/2");
    expect(screen.getByText(STRINGS.termQuiz.masteredLabel).parentElement).toHaveTextContent("3/20");

    await userEvent.click(screen.getByRole("button", { name: STRINGS.common.playAgain }));
    expect(onPlayAgain).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: STRINGS.termQuiz.backToGlossary }));
    expect(onExit).toHaveBeenCalledOnce();
  });

  it("celebrates a perfect round", async () => {
    renderQuiz();
    await userEvent.click(option(a.term));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.termQuiz.nextClue }));
    await userEvent.click(option(b.term));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.common.seeResult }));
    expect(screen.getByRole("heading", { name: STRINGS.termQuiz.perfectRound })).toBeVisible();
    expect(screen.getByText(STRINGS.termQuiz.pointsLabel).parentElement).toHaveTextContent("+20");
  });

  it("goes back to the glossary mid-round", async () => {
    const { onExit } = renderQuiz();
    await userEvent.click(screen.getByRole("button", { name: STRINGS.hud.back }));
    expect(onExit).toHaveBeenCalledOnce();
  });
});
