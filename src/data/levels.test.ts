import { describe, expect, it } from "vitest";
import { INITIAL_LIVES, LEVELS, SPHERE_LABELS, XP_PER_CORRECT_ANSWER, getCivicTitle, getRankByXp } from "./levels";

const allQuestions = LEVELS.flatMap((level) => level.questions);

describe("question dataset", () => {
  it("has unique question ids", () => {
    const ids = allQuestions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(allQuestions)("question $id has exactly one correct option and unique option ids", (question) => {
    expect(question.options.filter((o) => o.isCorrect)).toHaveLength(1);
    const optionIds = question.options.map((o) => o.id);
    expect(new Set(optionIds).size).toBe(optionIds.length);
  });

  it.each(allQuestions)("question $id cites the CF/88 and has an explanation", (question) => {
    expect(question.constitutionalArticle).toContain("CF/88");
    expect(question.prompt.trim()).not.toBe("");
    expect(question.explanation.trim()).not.toBe("");
  });
});

// Guards against questions that give the answer away (see CLAUDE.md, section 5).
describe("question difficulty", () => {
  const correctOptionOf = (q: (typeof allQuestions)[number]) => q.options.find((o) => o.isCorrect)!;

  it.each(allQuestions)("question $id offers four alternatives", (question) => {
    expect(question.options).toHaveLength(4);
  });

  it.each(allQuestions)("question $id does not repeat the correct answer in the prompt", (question) => {
    expect(question.prompt.toLowerCase()).not.toContain(correctOptionOf(question).text.toLowerCase());
  });

  it("varies the position of the correct answer", () => {
    const positions = allQuestions.map((q) => q.options.indexOf(correctOptionOf(q)));
    const maxPerPosition = Math.ceil(allQuestions.length / 2);
    for (let position = 0; position < 4; position++) {
      expect(positions.filter((p) => p === position).length).toBeLessThanOrEqual(maxPerPosition);
    }
  });

  it("does not make the correct answer systematically the longest", () => {
    const longestIsCorrect = allQuestions.filter((q) => {
      const correct = correctOptionOf(q);
      return q.options.every((o) => o === correct || o.text.length < correct.text.length);
    });
    expect(longestIsCorrect.length).toBeLessThanOrEqual(Math.floor(allQuestions.length / 3));
  });
});

describe("LEVELS", () => {
  it("has unique level ids", () => {
    const ids = LEVELS.map((level) => level.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only puts questions of the matching sphere in each sphere level", () => {
    const [municipal, state, federal] = LEVELS;
    expect(municipal.questions.every((q) => q.sphere === "municipal")).toBe(true);
    expect(state.questions.every((q) => q.sphere === "state")).toBe(true);
    expect(federal.questions.every((q) => q.sphere === "federal")).toBe(true);
  });

  it("ships the municipal level with its 10 scenarios", () => {
    expect(LEVELS[0].questions).toHaveLength(10);
  });
});

describe("game constants", () => {
  it("defines 3 lives and 15 XP per correct answer", () => {
    expect(INITIAL_LIVES).toBe(3);
    expect(XP_PER_CORRECT_ANSWER).toBe(15);
  });

  it("labels every sphere in pt-BR", () => {
    expect(SPHERE_LABELS).toEqual({ municipal: "Municipal", state: "Estadual", federal: "Federal" });
  });
});

describe("getRankByXp", () => {
  it.each([
    [0, "Eleitor Curioso"],
    [59, "Eleitor Curioso"],
    [60, "Fiscal Cívico Júnior"],
    [149, "Fiscal Cívico Júnior"],
    [150, "Líder Comunitário"],
    [299, "Líder Comunitário"],
    [300, "Constitucionalista Pleno"],
  ])("returns the rank for %i XP", (xp, rank) => {
    expect(getRankByXp(xp)).toBe(rank);
  });
});

describe("getCivicTitle", () => {
  it.each([
    [10, 10, "Guardião da Constituição"],
    [9, 10, "Fiscal do Povo"],
    [7, 10, "Fiscal do Povo"],
    [6, 10, "Cidadão Atento"],
    [4, 10, "Cidadão Atento"],
    [3, 10, "Aprendiz Cívico"],
    [0, 10, "Aprendiz Cívico"],
  ])("returns the title for %i/%i correct answers", (score, total, name) => {
    const title = getCivicTitle(score, total);
    expect(title.name).toBe(name);
    expect(title.description).not.toBe("");
  });

  it("treats an empty level as zero accuracy", () => {
    expect(getCivicTitle(0, 0).name).toBe("Aprendiz Cívico");
  });
});
