import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STRINGS } from "@/data/strings";
import swipeCardsData from "@/data/swipeCards.json";
import { playSound } from "@/lib/sound";
import type { SwipeCard } from "@/types/swipe";
import SwipeCardView from "./SwipeCardView";

vi.mock("@/lib/sound", () => ({ playSound: vi.fn() }));

const CARDS: SwipeCard[] = [
  {
    id: 1,
    speakerRole: "Candidato a Vereador",
    statement: "Vou mudar o Código Penal.",
    isLegitimate: false,
    constitutionalArticle: "Art. 22, I da CF/88",
    explanation: "Direito penal é competência privativa da União.",
  },
  {
    id: 2,
    speakerRole: "Candidata a Vereadora",
    statement: "Vou fiscalizar os contratos da prefeitura.",
    isLegitimate: true,
    constitutionalArticle: "Art. 31 da CF/88",
    explanation: "A Câmara fiscaliza o Executivo municipal.",
  },
];

function renderSwipe(cards: SwipeCard[] | null = CARDS) {
  const props = { onToggleSound: vi.fn(), onCorrectAnswer: vi.fn(), onExit: vi.fn() };
  render(<SwipeCardView xp={10} streak={2} isSoundEnabled cards={cards ?? undefined} {...props} />);
  return props;
}

function card(): HTMLElement {
  return screen.getByRole("article");
}

function drag(fromX: number, toX: number) {
  fireEvent.pointerDown(card(), { clientX: fromX, pointerId: 1 });
  fireEvent.pointerMove(card(), { clientX: toX, pointerId: 1 });
  fireEvent.pointerUp(card(), { clientX: toX, pointerId: 1 });
}

beforeEach(() => {
  vi.mocked(playSound).mockClear();
});

describe("SwipeCardView", () => {
  it("shows the current promise with its speaker, the mascot and the round progress", () => {
    renderSwipe();
    expect(card()).toHaveAccessibleName(STRINGS.swipe.statement(CARDS[0].statement));
    expect(screen.getByText("Candidato a Vereador")).toBeVisible();
    expect(screen.getByText(STRINGS.swipe.cardCounter(1, 2))).toBeVisible();
    expect(screen.getByRole("img", { name: STRINGS.mascot.still })).toBeVisible();
    expect(screen.getByRole("progressbar", { name: STRINGS.hud.progress })).toHaveAttribute("aria-valuenow", "0");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("plays the bundled deck by default", () => {
    renderSwipe(null);
    expect(screen.getByText(STRINGS.swipe.cardCounter(1, swipeCardsData.length))).toBeVisible();
    expect(card()).toHaveTextContent(swipeCardsData[0].statement);
  });

  it("confirms a correct call with the CF/88 article and explanation", async () => {
    const { onCorrectAnswer } = renderSwipe();
    await userEvent.click(screen.getByRole("button", { name: STRINGS.swipe.illegalAction }));

    const drawer = screen.getByRole("status");
    expect(drawer).toHaveTextContent(STRINGS.swipe.correctTitle);
    expect(drawer).toHaveTextContent(STRINGS.swipe.illegalVerdict);
    expect(drawer).toHaveTextContent("Art. 22, I da CF/88");
    expect(drawer).toHaveTextContent("Direito penal é competência privativa da União.");
    expect(onCorrectAnswer).toHaveBeenCalledOnce();
    expect(playSound).toHaveBeenLastCalledWith("correct", true);
    expect(screen.queryByRole("button", { name: STRINGS.swipe.legitimateAction })).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: STRINGS.hud.progress })).toHaveAttribute("aria-valuenow", "50");
  });

  it("corrects a wrong call without awarding XP", async () => {
    const { onCorrectAnswer } = renderSwipe();
    await userEvent.click(screen.getByRole("button", { name: STRINGS.swipe.legitimateAction }));

    expect(screen.getByRole("status")).toHaveTextContent(STRINGS.swipe.wrongTitle);
    expect(onCorrectAnswer).not.toHaveBeenCalled();
    expect(playSound).toHaveBeenLastCalledWith("error", true);
  });

  it("decides by swiping: left for illegal, right for legitimate", async () => {
    const { onCorrectAnswer } = renderSwipe();
    drag(200, 50);
    expect(screen.getByRole("status")).toHaveTextContent(STRINGS.swipe.correctTitle);

    await userEvent.click(screen.getByRole("button", { name: STRINGS.swipe.nextCard }));
    expect(screen.getByText(STRINGS.swipe.cardCounter(2, 2))).toBeVisible();
    drag(50, 200);
    expect(screen.getByRole("status")).toHaveTextContent(STRINGS.swipe.legitimateVerdict);
    expect(onCorrectAnswer).toHaveBeenCalledTimes(2);
  });

  it("tilts the card and fades in a verdict stamp while dragging", () => {
    renderSwipe();
    const legitimateStamp = screen.getByText(STRINGS.swipe.legitimateStamp, { selector: "span" });
    const illegalStamp = screen.getByText(STRINGS.swipe.illegalStamp);
    expect(legitimateStamp).toHaveStyle({ opacity: "0" });

    fireEvent.pointerDown(card(), { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(card(), { clientX: 150, pointerId: 1 });
    expect(card().style.transform).toBe("translateX(50px) rotate(2.5deg)");
    expect(legitimateStamp).toHaveStyle({ opacity: "0.5" });
    expect(illegalStamp).toHaveStyle({ opacity: "0" });

    fireEvent.pointerMove(card(), { clientX: -500, pointerId: 1 });
    expect(card().style.transform).toBe("translateX(-600px) rotate(-15deg)");
    expect(illegalStamp).toHaveStyle({ opacity: "1" });
  });

  it("snaps back without deciding on a short drag or a cancelled gesture", () => {
    renderSwipe();
    drag(100, 160);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(card().style.transform).toBe("translateX(0px) rotate(0deg)");

    fireEvent.pointerDown(card(), { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(card(), { clientX: 400, pointerId: 1 });
    fireEvent.pointerCancel(card(), { pointerId: 1 });
    expect(card().style.transform).toBe("translateX(0px) rotate(0deg)");

    // Stray moves and releases without a press are ignored.
    fireEvent.pointerMove(card(), { clientX: 400, pointerId: 1 });
    fireEvent.pointerUp(card(), { clientX: 400, pointerId: 1 });
    expect(card().style.transform).toBe("translateX(0px) rotate(0deg)");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("ignores drags on a card that was already decided", async () => {
    renderSwipe();
    await userEvent.click(screen.getByRole("button", { name: STRINGS.swipe.illegalAction }));
    drag(0, 300);
    expect(card().style.transform).toBe("translateX(-600px) rotate(-15deg)");
  });

  it("shows the round summary, then restarts or exits", async () => {
    const { onExit } = renderSwipe();
    await userEvent.click(screen.getByRole("button", { name: STRINGS.swipe.illegalAction }));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.swipe.nextCard }));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.swipe.illegalAction }));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.common.seeResult }));

    expect(screen.getByText(STRINGS.swipe.roundDoneBadge)).toBeVisible();
    expect(screen.getByRole("heading", { name: "Cidadão Atento" })).toBeVisible();
    expect(screen.getByText(STRINGS.swipe.hitsLabel).nextElementSibling).toHaveTextContent("1/2");
    expect(screen.getByText(STRINGS.swipe.accuracyLabel).nextElementSibling).toHaveTextContent("50%");
    expect(screen.getByText(STRINGS.swipe.pointsLabel).nextElementSibling).toHaveTextContent("+15 XP");

    await userEvent.click(screen.getByRole("button", { name: STRINGS.common.playAgain }));
    expect(screen.getByText(STRINGS.swipe.cardCounter(1, 2))).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: STRINGS.hud.back }));
    expect(onExit).toHaveBeenCalledOnce();
  });

  it("returns to the path from the summary", async () => {
    const { onExit } = renderSwipe([CARDS[0]]);
    await userEvent.click(screen.getByRole("button", { name: STRINGS.swipe.illegalAction }));
    await userEvent.click(screen.getByRole("button", { name: STRINGS.common.seeResult }));
    expect(screen.getByRole("heading", { name: "Guardião da Constituição" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: STRINGS.common.backToPath }));
    expect(onExit).toHaveBeenCalledOnce();
  });
});
