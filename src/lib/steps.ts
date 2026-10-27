import { buildTermQuestion, createSeededRandom, GLOSSARY_TERMS } from "@/lib/glossary";
import type { GlossaryTerm } from "@/types/glossary";
import type { Question, SessionStep } from "@/types/quiz";
import type { SwipeCard } from "@/types/swipe";

// Builders for lesson steps (see SessionStep); lessons in src/data/levels.ts are made of these.

export function quizStep(question: Question): SessionStep {
  return { kind: "quiz", id: `quiz-${question.id}`, question };
}

export function factOrFakeStep(card: SwipeCard): SessionStep {
  return { kind: "factOrFake", id: `fact-or-fake-${card.id}`, card };
}

/** Options are shuffled with a seed from the term, so lesson content is the same on every run. */
export function termStep(term: GlossaryTerm, terms: GlossaryTerm[] = GLOSSARY_TERMS): SessionStep {
  return { kind: "term", id: `term-${term.id}`, termQuestion: buildTermQuestion(term, terms, createSeededRandom(term.id)) };
}
