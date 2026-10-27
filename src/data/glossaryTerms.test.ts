import { describe, expect, it } from "vitest";
import { GLOSSARY_CATEGORIES, GLOSSARY_TERMS, maskTerm, normalizeText, segmentByGlossary } from "@/lib/glossary";
import type { Question } from "@/types/quiz";
import questionsData from "./questions.json";
import { STRINGS } from "./strings";

const terms = GLOSSARY_TERMS;
const questions = questionsData as Question[];

describe("glossary dataset", () => {
  it("has between 15 and 20 high-frequency terms", () => {
    expect(terms.length).toBeGreaterThanOrEqual(15);
    expect(terms.length).toBeLessThanOrEqual(20);
  });

  it("has unique slug ids", () => {
    const ids = terms.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("is sorted alphabetically", () => {
    const names = terms.map((t) => t.term);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "pt-BR")));
  });

  it("lists the same categories as the UI labels", () => {
    expect(GLOSSARY_CATEGORIES).toEqual(Object.keys(STRINGS.glossary.categories));
  });

  // "Qual é o termo?" uses the definition as a clue, so it must not give the term away.
  it.each(terms)("$term clue never reveals the term", (term) => {
    expect(normalizeText(maskTerm(term.shortDefinition, term))).not.toContain(normalizeText(term.term));
  });

  it("covers every category", () => {
    for (const category of Object.keys(STRINGS.glossary.categories)) {
      expect(terms.some((t) => t.category === category)).toBe(true);
    }
  });

  it.each(terms)("$term has a definition, an everyday example and its CF/88 basis", (term) => {
    expect(term.category in STRINGS.glossary.categories).toBe(true);
    expect(term.shortDefinition.trim()).not.toBe("");
    expect(term.practicalExample.trim()).not.toBe("");
    if (term.constitutionalArticle !== undefined) expect(term.constitutionalArticle).toContain("CF/88");
  });

  // Two terms sharing a form would make inline links ambiguous.
  it("never shares a name or alias between terms", () => {
    const forms = terms.flatMap((t) => [t.term, ...t.aliases].map(normalizeText));
    expect(new Set(forms).size).toBe(forms.length);
  });

  it("links at least one term in the quiz explanations", () => {
    const linkedIds = new Set(
      questions.flatMap((q) => segmentByGlossary(q.explanation).flatMap((s) => (s.term ? [s.term.id] : []))),
    );
    expect(linkedIds.size).toBeGreaterThan(0);
  });
});
