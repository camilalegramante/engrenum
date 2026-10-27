import { describe, expect, it } from "vitest";
import type { GlossaryTerm } from "@/types/glossary";
import {
  GLOSSARY_TERMS,
  TERM_QUIZ_OPTIONS,
  TERM_QUIZ_SIZE,
  buildTermQuestion,
  buildTermQuizRound,
  createSeededRandom,
  filterGlossaryTerms,
  getAlbumProgress,
  getTermOfDay,
  maskTerm,
  normalizeText,
  segmentByGlossary,
} from "./glossary";

function makeTerm(id: string, term: string, overrides: Partial<GlossaryTerm> = {}): GlossaryTerm {
  return {
    id,
    term,
    category: "legislation",
    shortDefinition: `Definição de ${term}`,
    practicalExample: `Exemplo de ${term}`,
    aliases: [],
    ...overrides,
  };
}

const veto = makeTerm("veto", "Veto", { aliases: ["vetar"] });
const loa = makeTerm("loa", "Lei Orçamentária Anual", { category: "budget", aliases: ["LOA"] });
const law = makeTerm("lei", "Lei");
const terms = [veto, loa, law];

describe("normalizeText", () => {
  it("lowercases and strips accents while keeping every index in place", () => {
    const text = "Orçamento PÚBLICO e Quórum 🏛️";
    const normalized = normalizeText(text);
    expect(normalized).toBe("orcamento publico e quorum 🏛️");
    expect(normalized).toHaveLength(text.length);
  });

  it("keeps characters that decompose into several code units", () => {
    expect(normalizeText("한")).toBe("한");
  });
});

describe("filterGlossaryTerms", () => {
  it("returns every term for an empty query and no category", () => {
    expect(filterGlossaryTerms(terms, "   ", null)).toEqual(terms);
  });

  it("matches the term, aliases and definition ignoring case and accents", () => {
    expect(filterGlossaryTerms(terms, "ORCAMENTARIA", null)).toEqual([loa]);
    expect(filterGlossaryTerms(terms, "vetar", null)).toEqual([veto]);
    expect(filterGlossaryTerms(terms, "definição de lei", null)).toEqual([loa, law]);
  });

  it("filters by category, alone or with a query", () => {
    expect(filterGlossaryTerms(terms, "", "budget")).toEqual([loa]);
    expect(filterGlossaryTerms(terms, "veto", "budget")).toEqual([]);
  });
});

describe("segmentByGlossary", () => {
  it("links glossary mentions and keeps the original text around them", () => {
    expect(segmentByGlossary("O prefeito pode VETAR a lei.", terms)).toEqual([
      { text: "O prefeito pode " },
      { text: "VETAR", term: veto },
      { text: " a " },
      { text: "lei", term: law },
      { text: "." },
    ]);
  });

  it("only links whole words", () => {
    expect(segmentByGlossary("Leitura sem vetores", terms)).toEqual([{ text: "Leitura sem vetores" }]);
  });

  it("links only the first mention of each term", () => {
    const segments = segmentByGlossary("Veto, veto e veto", terms);
    expect(segments.filter((s) => s.term)).toHaveLength(1);
    expect(segments.map((s) => s.text).join("")).toBe("Veto, veto e veto");
  });

  it("prefers the longest term when mentions overlap", () => {
    expect(segmentByGlossary("A Lei Orçamentária Anual", terms)).toEqual([
      { text: "A " },
      { text: "Lei Orçamentária Anual", term: loa },
    ]);
  });

  it("uses the shipped glossary by default", () => {
    const linked = segmentByGlossary("Houve superfaturamento na licitação.").filter((s) => s.term);
    expect(linked.map((s) => s.term?.id)).toEqual(["superfaturamento", "licitacao"]);
    expect(GLOSSARY_TERMS.length).toBeGreaterThan(0);
  });

  it("returns no segments for an empty text", () => {
    expect(segmentByGlossary("", terms)).toEqual([]);
  });
});

describe("maskTerm", () => {
  it("blanks out every mention of the term, keeping the rest", () => {
    expect(maskTerm("O veto e o poder de vetar.", veto)).toBe("O _____ e o poder de _____.");
  });
});

/** Deterministic pseudo-random sequence for shuffles. */
function seededRandom(seed = 1): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

describe("buildTermQuizRound", () => {
  it("builds a round of distinct terms, each with four distinct options including the answer", () => {
    const round = buildTermQuizRound(GLOSSARY_TERMS, [], seededRandom());
    expect(round).toHaveLength(TERM_QUIZ_SIZE);
    expect(new Set(round.map((q) => q.term.id)).size).toBe(TERM_QUIZ_SIZE);
    for (const question of round) {
      const optionIds = question.options.map((o) => o.id);
      expect(optionIds).toHaveLength(TERM_QUIZ_OPTIONS);
      expect(new Set(optionIds).size).toBe(TERM_QUIZ_OPTIONS);
      expect(optionIds).toContain(question.term.id);
      expect(normalizeText(question.clue)).not.toContain(normalizeText(question.term.term));
    }
  });

  it("prefers distractors from the same category", () => {
    const round = buildTermQuizRound(GLOSSARY_TERMS, [], seededRandom(7));
    for (const { term, options } of round) {
      const sameCategoryTotal = GLOSSARY_TERMS.filter((t) => t.category === term.category).length;
      const sameCategoryOptions = options.filter((o) => o.category === term.category).length;
      expect(sameCategoryOptions).toBe(Math.min(sameCategoryTotal, TERM_QUIZ_OPTIONS));
    }
  });

  it("asks about terms not yet mastered first", () => {
    const mastered = GLOSSARY_TERMS.slice(0, GLOSSARY_TERMS.length - 2).map((t) => t.id);
    const round = buildTermQuizRound(GLOSSARY_TERMS, mastered, seededRandom(3));
    const pendingIds = GLOSSARY_TERMS.slice(-2).map((t) => t.id);
    expect(round.slice(0, 2).map((q) => q.term.id).sort()).toEqual(pendingIds.sort());
  });

  it("uses Math.random by default", () => {
    expect(buildTermQuizRound(terms, [])).toHaveLength(terms.length);
  });
});

describe("getTermOfDay", () => {
  it("picks the same term all day and the next term the next day", () => {
    const today = getTermOfDay("2026-10-27");
    expect(getTermOfDay("2026-10-27")).toBe(today);
    const index = GLOSSARY_TERMS.indexOf(today);
    expect(getTermOfDay("2026-10-28")).toBe(GLOSSARY_TERMS[(index + 1) % GLOSSARY_TERMS.length]);
  });

  it("cycles through the given terms", () => {
    expect(new Set(["2026-01-01", "2026-01-02", "2026-01-03"].map((day) => getTermOfDay(day, terms).id)).size).toBe(3);
  });
});

describe("getAlbumProgress", () => {
  it("counts discovered terms per category", () => {
    expect(getAlbumProgress(terms, ["veto", "loa"], ["legislation", "budget"])).toEqual([
      { category: "legislation", discovered: 1, total: 2 },
      { category: "budget", discovered: 1, total: 1 },
    ]);
  });

  it("covers every glossary category by default", () => {
    expect(getAlbumProgress(GLOSSARY_TERMS, []).map((c) => c.category)).toEqual([
      "budget",
      "legislation",
      "powers",
      "elections",
    ]);
  });
});

describe("createSeededRandom", () => {
  it("repeats the same sequence for the same seed, within [0, 1)", () => {
    const a = createSeededRandom("veto");
    const b = createSeededRandom("veto");
    const values = Array.from({ length: 5 }, () => a());
    expect(Array.from({ length: 5 }, () => b())).toEqual(values);
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
    expect(createSeededRandom("sancao")()).not.toBe(values[0]);
  });

  it("works with an empty seed", () => {
    expect(createSeededRandom("")()).toBeLessThan(1);
  });
});

describe("buildTermQuestion", () => {
  it("masks the term in its clue and offers it among the options", () => {
    const question = buildTermQuestion(veto, terms, () => 0.5);
    expect(question.clue).toBe(maskTerm(veto.shortDefinition, veto));
    expect(question.options).toContain(veto);
    expect(question.options).toHaveLength(terms.length);
  });

  it("uses the shipped glossary and Math.random by default", () => {
    const [first] = GLOSSARY_TERMS;
    expect(buildTermQuestion(first).options).toHaveLength(TERM_QUIZ_OPTIONS);
  });
});
