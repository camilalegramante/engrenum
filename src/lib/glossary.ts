import glossaryTermsData from "@/data/glossaryTerms.json";
import type {
  CategoryAlbumProgress,
  GlossaryCategory,
  GlossaryTerm,
  GlossaryTextSegment,
  TermQuizQuestion,
} from "@/types/glossary";

export const GLOSSARY_TERMS = glossaryTermsData as GlossaryTerm[];
export const GLOSSARY_CATEGORIES: GlossaryCategory[] = ["budget", "legislation", "powers", "elections"];
/** First time a term is opened (it goes into the civic album). */
export const TERM_DISCOVERY_XP = 5;
/** Each correct answer in "Qual é o termo?". */
export const TERM_QUIZ_XP = 10;
/** Reading the term of the day, once per day. */
export const TERM_OF_DAY_XP = 10;
export const TERM_QUIZ_SIZE = 5;
export const TERM_QUIZ_OPTIONS = 4;

const CLUE_BLANK = "_____";
const DAY_MS = 86_400_000;

const WORD_CHAR = /[\p{L}\p{N}]/u;

/**
 * Lowercases and strips accents one code unit at a time, so every index in the
 * result maps to the same index in the original text.
 */
export function normalizeText(text: string): string {
  let normalized = "";
  for (const char of text.split("")) {
    const base = char.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    normalized += base.length === 1 ? base : char;
  }
  return normalized;
}

/** Real-time glossary search: accent/case-insensitive match on the term, aliases and definition. */
export function filterGlossaryTerms(
  terms: GlossaryTerm[],
  query: string,
  category: GlossaryCategory | null,
): GlossaryTerm[] {
  const normalizedQuery = normalizeText(query.trim());
  return terms.filter((term) => {
    if (category && term.category !== category) return false;
    if (!normalizedQuery) return true;
    return [term.term, ...term.aliases, term.shortDefinition].some((text) =>
      normalizeText(text).includes(normalizedQuery),
    );
  });
}

interface TermMatch {
  start: number;
  end: number;
  term: GlossaryTerm;
}

function isWordBoundary(text: string, index: number): boolean {
  return index < 0 || index >= text.length || !WORD_CHAR.test(text[index]);
}

function findMatches(normalizedText: string, term: GlossaryTerm): TermMatch[] {
  const matches: TermMatch[] = [];
  for (const form of [term.term, ...term.aliases]) {
    const needle = normalizeText(form);
    for (let start = normalizedText.indexOf(needle); start !== -1; start = normalizedText.indexOf(needle, start + 1)) {
      const end = start + needle.length;
      if (isWordBoundary(normalizedText, start - 1) && isWordBoundary(normalizedText, end)) {
        matches.push({ start, end, term });
      }
    }
  }
  return matches;
}

/**
 * Splits a text into plain slices and glossary mentions. By default only the first
 * mention of each term is linked; on overlaps, the earliest and then longest wins.
 */
export function segmentByGlossary(
  text: string,
  terms: GlossaryTerm[] = GLOSSARY_TERMS,
  isFirstMentionOnly = true,
): GlossaryTextSegment[] {
  const normalizedText = normalizeText(text);
  const candidates = terms
    .flatMap((term) => findMatches(normalizedText, term))
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const linkedTermIds = new Set<string>();
  const segments: GlossaryTextSegment[] = [];
  let cursor = 0;
  for (const match of candidates) {
    if (match.start < cursor || (isFirstMentionOnly && linkedTermIds.has(match.term.id))) continue;
    if (match.start > cursor) segments.push({ text: text.slice(cursor, match.start) });
    segments.push({ text: text.slice(match.start, match.end), term: match.term });
    linkedTermIds.add(match.term.id);
    cursor = match.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

/** Blanks out every mention of the term, so its definition works as a clue. */
export function maskTerm(text: string, term: GlossaryTerm): string {
  return segmentByGlossary(text, [term], false)
    .map((segment) => (segment.term ? CLUE_BLANK : segment.text))
    .join("");
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Builds a "Qual é o termo?" round: terms not yet mastered come first, and
 * distractors come from the same category whenever it has enough terms.
 */
export function buildTermQuizRound(
  terms: GlossaryTerm[],
  masteredTermIds: string[],
  random: () => number = Math.random,
): TermQuizQuestion[] {
  const pending = shuffle(terms.filter((t) => !masteredTermIds.includes(t.id)), random);
  const mastered = shuffle(terms.filter((t) => masteredTermIds.includes(t.id)), random);
  return [...pending, ...mastered].slice(0, TERM_QUIZ_SIZE).map((term) => {
    const sameCategory = shuffle(terms.filter((t) => t.id !== term.id && t.category === term.category), random);
    const otherCategories = shuffle(terms.filter((t) => t.category !== term.category), random);
    const distractors = [...sameCategory, ...otherCategories].slice(0, TERM_QUIZ_OPTIONS - 1);
    return { term, clue: maskTerm(term.shortDefinition, term), options: shuffle([term, ...distractors], random) };
  });
}

/** The same term for everyone on a given local day ("YYYY-MM-DD"), cycling through the glossary. */
export function getTermOfDay(day: string, terms: GlossaryTerm[] = GLOSSARY_TERMS): GlossaryTerm {
  const [year, month, date] = day.split("-").map(Number);
  const dayNumber = Math.floor(Date.UTC(year, month - 1, date) / DAY_MS);
  return terms[dayNumber % terms.length];
}

/** Discovered terms per category, in glossary category order. */
export function getAlbumProgress(
  terms: GlossaryTerm[],
  discoveredTermIds: string[],
  categories: GlossaryCategory[] = GLOSSARY_CATEGORIES,
): CategoryAlbumProgress[] {
  return categories.map((category) => {
    const inCategory = terms.filter((t) => t.category === category);
    return {
      category,
      discovered: inCategory.filter((t) => discoveredTermIds.includes(t.id)).length,
      total: inCategory.length,
    };
  });
}
