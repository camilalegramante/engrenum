import { SPHERE_LABELS } from "@/data/levels";
import { STRINGS } from "@/data/strings";
import type { Option, SessionStep } from "@/types/quiz";

/** Any session step, normalized into what the quiz engine renders: a prompt with options. */
export interface StepView {
  /** Chip above the card naming the mechanic (or the sphere, for scenarios). */
  badge: string;
  /** Small label inside the card, above the prompt. */
  eyebrow: string;
  prompt: string;
  /** Extra line under the prompt telling what to decide. */
  instruction?: string;
  options: Option[];
  /** "split" lays the two verdicts side by side. */
  layout: "list" | "split";
  constitutionalArticle?: string;
  /** Shown in the feedback drawer after a wrong answer. */
  correctAnswer: string;
  explanation: string;
}

export const LEGITIMATE_OPTION_ID = "legitimate";
export const ILLEGAL_OPTION_ID = "illegal";

export function toStepView(step: SessionStep): StepView {
  switch (step.kind) {
    case "quiz": {
      const { question } = step;
      const correct = question.options.find((o) => o.isCorrect);
      return {
        badge: STRINGS.quiz.sphere(SPHERE_LABELS[question.sphere]),
        eyebrow: STRINGS.quiz.scenarioLabel,
        prompt: question.prompt,
        options: question.options,
        layout: "list",
        constitutionalArticle: question.constitutionalArticle,
        correctAnswer: STRINGS.quiz.correctAnswer(correct?.text ?? ""),
        explanation: question.explanation,
      };
    }
    case "factOrFake": {
      const { card } = step;
      return {
        badge: STRINGS.quiz.factOrFakeBadge,
        eyebrow: card.speakerRole,
        prompt: STRINGS.swipe.statement(card.statement),
        instruction: STRINGS.quiz.factOrFakeInstruction,
        options: [
          { id: LEGITIMATE_OPTION_ID, text: STRINGS.quiz.legitimateOption, isCorrect: card.isLegitimate },
          { id: ILLEGAL_OPTION_ID, text: STRINGS.quiz.illegalOption, isCorrect: !card.isLegitimate },
        ],
        layout: "split",
        constitutionalArticle: card.constitutionalArticle,
        correctAnswer: card.isLegitimate ? STRINGS.swipe.legitimateVerdict : STRINGS.swipe.illegalVerdict,
        explanation: card.explanation,
      };
    }
    case "term": {
      const { term, clue, options } = step.termQuestion;
      return {
        badge: STRINGS.quiz.termBadge,
        eyebrow: STRINGS.termQuiz.clueLead,
        prompt: STRINGS.termQuiz.clue(clue),
        options: options.map((o) => ({ id: o.id, text: o.term, isCorrect: o.id === term.id })),
        layout: "list",
        constitutionalArticle: term.constitutionalArticle,
        correctAnswer: STRINGS.termQuiz.answer(term.term),
        explanation: term.practicalExample,
      };
    }
  }
}
