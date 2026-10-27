import { describe, expect, it } from "vitest";
import { LEVELS } from "@/data/levels";
import { STRINGS } from "@/data/strings";
import { GLOSSARY_TERMS } from "@/lib/glossary";
import { ILLEGAL_OPTION_ID, LEGITIMATE_OPTION_ID, toStepView } from "./session";
import { factOrFakeStep, quizStep, termStep } from "./steps";

const question = LEVELS[0].questions[0];
const card = {
  id: 1,
  speakerRole: "Candidata a Prefeita",
  statement: "Vou abrir vagas em creches.",
  isLegitimate: true,
  constitutionalArticle: "Art. 211, § 2º da CF/88",
  explanation: "Educação infantil é prioridade dos municípios.",
};

describe("step builders", () => {
  it("give every step a stable id per mechanic", () => {
    expect(quizStep(question).id).toBe(`quiz-${question.id}`);
    expect(factOrFakeStep(card).id).toBe("fact-or-fake-1");
    expect(termStep(GLOSSARY_TERMS[0]).id).toBe(`term-${GLOSSARY_TERMS[0].id}`);
  });

  it("shuffles a term's options the same way on every build", () => {
    const [term] = GLOSSARY_TERMS;
    expect(termStep(term)).toEqual(termStep(term));
  });
});

describe("toStepView", () => {
  it("shows a scenario with its sphere, options and correct answer", () => {
    const view = toStepView(quizStep(question));
    const correct = question.options.find((o) => o.isCorrect);
    expect(view).toMatchObject({
      badge: STRINGS.quiz.sphere("Municipal"),
      eyebrow: STRINGS.quiz.scenarioLabel,
      prompt: question.prompt,
      options: question.options,
      layout: "list",
      correctAnswer: STRINGS.quiz.correctAnswer(correct?.text ?? ""),
    });
  });

  it("turns a campaign promise into a legitimate/illegal verdict", () => {
    const legitimate = toStepView(factOrFakeStep(card));
    expect(legitimate).toMatchObject({ badge: STRINGS.quiz.factOrFakeBadge, eyebrow: card.speakerRole, layout: "split" });
    expect(legitimate.options.find((o) => o.isCorrect)?.id).toBe(LEGITIMATE_OPTION_ID);
    expect(legitimate.correctAnswer).toBe(STRINGS.swipe.legitimateVerdict);

    const illegal = toStepView(factOrFakeStep({ ...card, isLegitimate: false }));
    expect(illegal.options.find((o) => o.isCorrect)?.id).toBe(ILLEGAL_OPTION_ID);
    expect(illegal.correctAnswer).toBe(STRINGS.swipe.illegalVerdict);
  });

  it("asks for the term behind Capi's clue", () => {
    const term = GLOSSARY_TERMS.find((t) => t.id === "veto");
    const view = toStepView(termStep(term ?? GLOSSARY_TERMS[0]));
    expect(view.badge).toBe(STRINGS.quiz.termBadge);
    expect(view.options.filter((o) => o.isCorrect).map((o) => o.text)).toEqual(["Veto"]);
    expect(view.explanation).toBe(term?.practicalExample);
  });
});
