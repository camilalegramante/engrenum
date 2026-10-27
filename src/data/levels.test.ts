import { describe, expect, it } from "vitest";
import {
  CHEST_XP,
  INITIAL_LIVES,
  LEVELS,
  RANKS,
  SPHERE_LABELS,
  XP_PER_CORRECT_ANSWER,
  chunkIntoLessons,
  getCivicTitle,
  getRankByXp,
  getRankProgress,
} from "./levels";

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

  it.each(LEVELS)("level $id places every question in exactly one lesson", (level) => {
    const lessonQuestionIds = level.lessons.flatMap((lesson) =>
      lesson.steps.flatMap((step) => (step.kind === "quiz" ? [step.question.id] : [])),
    );
    expect([...lessonQuestionIds].sort((a, b) => a - b)).toEqual(level.questions.map((q) => q.id).sort((a, b) => a - b));
  });

  it("splits the municipal level into short themed lessons", () => {
    const [municipal] = LEVELS;
    expect(municipal.lessons.map((lesson) => lesson.title)).toEqual([
      "Serviços do bairro",
      "Saúde, escola e calçada",
      "Leis e promessas",
      "De olho no dinheiro",
    ]);
    for (const lesson of municipal.lessons) {
      expect(lesson.steps.length).toBeGreaterThanOrEqual(4);
      expect(lesson.steps.length).toBeLessThanOrEqual(5);
    }
  });

  // Lessons must not feel repetitive (see CLAUDE.md, "Varied mechanics").
  describe.each(LEVELS.flatMap((level) => level.lessons))("lesson $id", (lesson) => {
    const kinds = lesson.steps.map((step) => step.kind);

    it("starts with a scenario and mixes all three mechanics", () => {
      expect(kinds[0]).toBe("quiz");
      expect(new Set(kinds)).toEqual(new Set(["quiz", "factOrFake", "term"]));
    });

    it("never plays the same mechanic twice in a row", () => {
      for (let i = 1; i < kinds.length; i++) expect(kinds[i]).not.toBe(kinds[i - 1]);
    });
  });

  it.each(LEVELS)("level $id never repeats a step", (level) => {
    const ids = level.lessons.flatMap((lesson) => lesson.steps.map((step) => step.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every level a mascot tip", () => {
    for (const level of LEVELS) expect(level.mascotTip.trim()).not.toBe("");
  });
});

describe("chunkIntoLessons", () => {
  const questions = LEVELS[0].questions.slice(0, 7);

  it("groups questions into numbered lessons of the given size", () => {
    const lessons = chunkIntoLessons("state", questions, 3);
    expect(lessons.map((l) => [l.id, l.title, l.steps.length])).toEqual([
      ["state-1", "Lição 1", 3],
      ["state-2", "Lição 2", 3],
      ["state-3", "Lição 3", 1],
    ]);
  });

  it("returns no lessons for a level without questions", () => {
    expect(chunkIntoLessons("state", [])).toEqual([]);
  });
});

describe("game constants", () => {
  it("defines 3 lives, 15 XP per correct answer and a 20 XP chest", () => {
    expect(INITIAL_LIVES).toBe(3);
    expect(XP_PER_CORRECT_ANSWER).toBe(15);
    expect(CHEST_XP).toBe(20);
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

describe("getRankProgress", () => {
  it("lists ranks in ascending XP order starting at zero", () => {
    expect(RANKS[0].minXp).toBe(0);
    for (let i = 1; i < RANKS.length; i++) expect(RANKS[i].minXp).toBeGreaterThan(RANKS[i - 1].minXp);
  });

  it("reports how far the player is from the next rank", () => {
    expect(getRankProgress(0)).toEqual({ name: "Eleitor Curioso", nextName: "Fiscal Cívico Júnior", xpToNext: 60, percent: 0 });
    expect(getRankProgress(105)).toEqual({
      name: "Fiscal Cívico Júnior",
      nextName: "Líder Comunitário",
      xpToNext: 45,
      percent: 50,
    });
  });

  it("caps at the top rank", () => {
    expect(getRankProgress(999)).toEqual({ name: "Constitucionalista Pleno", nextName: null, xpToNext: 0, percent: 100 });
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
