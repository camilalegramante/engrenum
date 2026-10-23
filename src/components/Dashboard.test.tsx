import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LEVELS } from "@/data/levels";
import type { Level } from "@/types/quiz";
import Dashboard from "./Dashboard";

function getLevelButton(title: string): HTMLElement {
  return screen.getByRole("button", { name: new RegExp(title) });
}

describe("Dashboard", () => {
  it("shows the hero with the rank for the current XP", () => {
    render(<Dashboard xp={160} completedLevelIds={[]} onStartLevel={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1, name: "Quem Manda Aqui?" })).toBeVisible();
    expect(screen.getByText("Líder Comunitário")).toBeVisible();
  });

  it("focuses the first level and locks the levels without questions", () => {
    render(<Dashboard xp={0} completedLevelIds={[]} onStartLevel={vi.fn()} />);

    const municipal = getLevelButton("Nível 1");
    expect(municipal).toBeEnabled();
    expect(within(municipal).getByText("EM FOCO")).toBeVisible();

    for (const title of ["Nível 2", "Nível 3", "Nível 4"]) {
      const level = getLevelButton(title);
      expect(level).toBeDisabled();
      expect(within(level).getByText("EM BREVE")).toBeVisible();
    }
  });

  it("starts the chosen level", async () => {
    const onStartLevel = vi.fn();
    render(<Dashboard xp={0} completedLevelIds={[]} onStartLevel={onStartLevel} />);
    await userEvent.click(getLevelButton("Nível 1"));
    expect(onStartLevel).toHaveBeenCalledWith(LEVELS[0]);
  });

  it("marks completed levels and keeps them replayable", () => {
    render(<Dashboard xp={150} completedLevelIds={["municipal"]} onStartLevel={vi.fn()} />);
    const municipal = getLevelButton("Nível 1");
    expect(municipal).toBeEnabled();
    expect(within(municipal).getByText("✓ CONCLUÍDO")).toBeVisible();
    expect(screen.queryByText("EM FOCO")).not.toBeInTheDocument();
  });

  describe("with content in later levels", () => {
    const question = LEVELS[0].questions[0];
    const levels: Level[] = [
      { ...LEVELS[0], questions: [question] },
      { ...LEVELS[1], questions: [{ ...question, id: 100, sphere: "state" }] },
    ];

    it("locks a level until the previous one is completed", () => {
      render(<Dashboard xp={0} completedLevelIds={[]} onStartLevel={vi.fn()} levels={levels} />);
      const state = getLevelButton("Nível 2");
      expect(state).toBeDisabled();
      expect(within(state).queryByText("EM BREVE")).not.toBeInTheDocument();
    });

    it("unlocks and focuses the next level after completing the previous one", () => {
      render(<Dashboard xp={0} completedLevelIds={["municipal"]} onStartLevel={vi.fn()} levels={levels} />);
      const state = getLevelButton("Nível 2");
      expect(state).toBeEnabled();
      expect(within(state).getByText("EM FOCO")).toBeVisible();
    });
  });
});
