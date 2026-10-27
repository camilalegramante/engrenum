/** Glossary filter groups; pt-BR labels live in STRINGS.glossary.categories. */
export type GlossaryCategory = "budget" | "legislation" | "powers" | "elections";

/** A political/legal term from the "Glossário Cívico Descomplicado". */
export interface GlossaryTerm {
  /** Slug, e.g. "emenda-parlamentar". */
  id: string;
  term: string;
  category: GlossaryCategory;
  /** Plain-language explanation in one sentence; Capi says it in "Capi explica". */
  shortDefinition: string;
  /** Everyday scenario showing the term's impact. */
  practicalExample: string;
  /** CF/88 basis, when applicable. */
  constitutionalArticle?: string;
  /** Other forms (plural, abbreviation) recognized in quiz texts besides `term`. */
  aliases: string[];
}

/** A slice of a text, linked to the glossary term it mentions (if any). */
export interface GlossaryTextSegment {
  text: string;
  term?: GlossaryTerm;
}

/** One clue of the "Qual é o termo?" mini game. */
export interface TermQuizQuestion {
  term: GlossaryTerm;
  /** The term's definition with every mention of the term blanked out. */
  clue: string;
  /** The term plus distractors, in display order. */
  options: GlossaryTerm[];
}

/** Album progress of one category: discovered terms out of its total. */
export interface CategoryAlbumProgress {
  category: GlossaryCategory;
  discovered: number;
  total: number;
}
