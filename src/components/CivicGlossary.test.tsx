import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { STRINGS } from "@/data/strings";
import { GLOSSARY_TERMS } from "@/lib/glossary";
import type { GlossaryTerm } from "@/types/glossary";
import CivicGlossary from "./CivicGlossary";
import { GlossaryProgressContext, type GlossaryProgressValue } from "./GlossaryProgressContext";

const TERMS: GlossaryTerm[] = [
  {
    id: "emenda-parlamentar",
    term: "Emenda Parlamentar",
    category: "budget",
    shortDefinition: "Mudança no orçamento proposta por um parlamentar.",
    practicalExample: "Um deputado destina verba para uma ambulância.",
    constitutionalArticle: "Art. 166 da CF/88",
    aliases: [],
  },
  {
    id: "quorum",
    term: "Quórum",
    category: "legislation",
    shortDefinition: "Número mínimo de votos ou presenças.",
    practicalExample: "Mudar a Constituição exige três quintos dos votos.",
    aliases: [],
  },
];

const { termStatus } = STRINGS.glossary;

function renderGlossary(terms?: GlossaryTerm[], glossaryProgress: GlossaryProgressValue | null = null) {
  const props = { xp: 0, streak: 0, isSoundEnabled: true, onToggleSound: vi.fn(), onStartQuiz: vi.fn(), onExit: vi.fn() };
  render(
    <GlossaryProgressContext.Provider value={glossaryProgress}>
      <CivicGlossary {...props} terms={terms} />
    </GlossaryProgressContext.Provider>,
  );
  return props;
}

function termCards(): HTMLElement[] {
  return screen.queryAllByRole("button").filter((button) => button.getAttribute("aria-haspopup") === "dialog");
}

function card(term: string, status: string): HTMLElement {
  return screen.getByRole("button", { name: STRINGS.glossary.cardLabel(term, status) });
}

describe("CivicGlossary", () => {
  it("lists every shipped term by default", () => {
    renderGlossary();
    expect(screen.getByRole("heading", { level: 1, name: STRINGS.glossary.heading })).toBeVisible();
    expect(termCards()).toHaveLength(GLOSSARY_TERMS.length);
    expect(screen.getByRole("status")).toHaveTextContent(STRINGS.glossary.resultCount(GLOSSARY_TERMS.length));
  });

  it("filters instantly while typing, ignoring accents", async () => {
    renderGlossary(TERMS);
    await userEvent.type(screen.getByRole("searchbox", { name: STRINGS.glossary.searchLabel }), "quorum");
    expect(termCards()).toHaveLength(1);
    expect(card("Quórum", termStatus.new)).toHaveAccessibleDescription(TERMS[1].shortDefinition);
    expect(screen.getByRole("status")).toHaveTextContent(STRINGS.glossary.resultCount(1));
  });

  it("filters by category pills", async () => {
    renderGlossary(TERMS);
    const pills = screen.getByRole("group", { name: STRINGS.glossary.categoryFilter });
    const budget = within(pills).getByRole("button", { name: STRINGS.glossary.categories.budget });
    await userEvent.click(budget);
    expect(budget).toHaveAttribute("aria-pressed", "true");
    expect(termCards()).toHaveLength(1);
    expect(card("Emenda Parlamentar", termStatus.new)).toBeVisible();

    await userEvent.click(within(pills).getByRole("button", { name: STRINGS.glossary.allCategories }));
    expect(termCards()).toHaveLength(2);
  });

  it("shows an empty state that clears the search and the category", async () => {
    renderGlossary(TERMS);
    await userEvent.click(screen.getByRole("button", { name: STRINGS.glossary.categories.elections }));
    await userEvent.type(screen.getByRole("searchbox"), "xyz");
    expect(screen.getByRole("heading", { name: STRINGS.glossary.emptyTitle })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(STRINGS.glossary.resultCount(0));

    await userEvent.click(screen.getByRole("button", { name: STRINGS.glossary.clearFilters }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(termCards()).toHaveLength(2);
  });

  it("opens a term in depth and closes it with Escape, the close button or the backdrop", async () => {
    renderGlossary(TERMS);
    const emenda = card("Emenda Parlamentar", termStatus.new);
    await userEvent.click(emenda);
    const dialog = screen.getByRole("dialog", { name: "Emenda Parlamentar" });
    expect(dialog).toHaveTextContent(STRINGS.glossary.capiExplains);
    expect(dialog).toHaveTextContent(STRINGS.glossary.categories.budget);
    expect(dialog).toHaveTextContent(TERMS[0].practicalExample);
    expect(dialog).toHaveTextContent(TERMS[0].constitutionalArticle as string);
    // Outside the app nothing is tracked, so there is no reward.
    expect(dialog).not.toHaveTextContent(STRINGS.glossary.newDiscovery);
    expect(screen.getByRole("button", { name: STRINGS.glossary.confirm })).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(emenda).toHaveFocus();

    await userEvent.click(emenda);
    await userEvent.click(screen.getByRole("button", { name: STRINGS.glossary.close }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(emenda);
    await userEvent.click(screen.getByRole("dialog"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("omits the CF/88 badge for terms without an article", async () => {
    renderGlossary(TERMS);
    await userEvent.click(card("Quórum", termStatus.new));
    expect(screen.getByRole("dialog")).not.toHaveTextContent("CF/88");
  });

  describe("civic album", () => {
    it("shows discovered and mastered terms, the album progress and category seals", () => {
      renderGlossary(TERMS, { discoveredTermIds: ["emenda-parlamentar"], masteredTermIds: [], onDiscoverTerm: vi.fn() });
      const album = screen.getByRole("region", { name: STRINGS.glossary.albumHeading });
      expect(within(album).getByText(STRINGS.glossary.albumCount(1, 2))).toBeVisible();
      expect(within(album).getByRole("progressbar", { name: STRINGS.glossary.albumProgress })).toHaveAttribute("aria-valuenow", "50");
      expect(within(album).getByText(STRINGS.glossary.masteredCount(0))).toBeVisible();

      const seals = within(album).getByRole("list", { name: STRINGS.glossary.sealsLabel });
      expect(seals).toHaveTextContent(STRINGS.glossary.sealComplete(STRINGS.glossary.categories.budget));
      expect(seals).toHaveTextContent(STRINGS.glossary.sealProgress(STRINGS.glossary.categories.legislation, 0, 1));

      expect(card("Emenda Parlamentar", termStatus.discovered)).toBeVisible();
      expect(card("Quórum", termStatus.new)).toHaveTextContent(STRINGS.glossary.newBadge(5));
    });

    it("marks mastered terms with a star, also inside the dialog", async () => {
      renderGlossary(TERMS, { discoveredTermIds: ["quorum"], masteredTermIds: ["quorum"], onDiscoverTerm: () => 0 });
      expect(screen.getByText(STRINGS.glossary.masteredCount(1))).toBeVisible();
      await userEvent.click(card("Quórum", termStatus.mastered));
      expect(screen.getByRole("dialog")).toHaveTextContent(STRINGS.glossary.masteredMark);
      expect(screen.getByRole("dialog")).not.toHaveTextContent(STRINGS.glossary.newDiscovery);
    });

    it("adds a new term to the album and shows the reward", async () => {
      const onDiscoverTerm = vi.fn(() => 5);
      renderGlossary(TERMS, { discoveredTermIds: [], masteredTermIds: [], onDiscoverTerm });
      await userEvent.click(card("Quórum", termStatus.new));
      expect(onDiscoverTerm).toHaveBeenCalledWith("quorum");
      expect(screen.getByRole("dialog")).toHaveTextContent(STRINGS.glossary.reward(5));
      expect(screen.getByRole("dialog")).not.toHaveTextContent(STRINGS.glossary.masteredMark);
    });

    it("starts the 'Qual é o termo?' mini game", async () => {
      const { onStartQuiz } = renderGlossary(TERMS);
      await userEvent.click(screen.getByRole("button", { name: STRINGS.glossary.startQuiz }));
      expect(onStartQuiz).toHaveBeenCalledOnce();
    });
  });

  it("goes back to the path", async () => {
    const { onExit } = renderGlossary(TERMS);
    await userEvent.click(screen.getByRole("button", { name: STRINGS.hud.back }));
    expect(onExit).toHaveBeenCalledOnce();
  });
});
