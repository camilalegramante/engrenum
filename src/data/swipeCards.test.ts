import { describe, expect, it } from "vitest";
import type { SwipeCard } from "@/types/swipe";
import swipeCardsData from "./swipeCards.json";

const cards: SwipeCard[] = swipeCardsData;

describe("swipe card dataset", () => {
  it("has unique card ids", () => {
    const ids = cards.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(cards)("card $id names the speaker, cites the CF/88 and explains the verdict", (card) => {
    expect(card.speakerRole).toMatch(/^Candidat[oa] a /);
    expect(card.statement.trim()).not.toBe("");
    expect(card.constitutionalArticle).toContain("CF/88");
    expect(card.explanation.trim()).not.toBe("");
  });

  // Guards against a deck that can be beaten by always swiping the same way.
  it("balances legitimate and illegal promises", () => {
    const legitimateCount = cards.filter((c) => c.isLegitimate).length;
    expect(legitimateCount).toBe(cards.length / 2);
  });

  it("never starts the round with the same verdict twice in a row", () => {
    expect(cards[0].isLegitimate).not.toBe(cards[1].isLegitimate);
  });
});
