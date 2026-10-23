import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LEVELS } from "@/data/levels";
import { INITIAL_PROGRESS, type Progress } from "@/lib/progress";
import type { Level } from "@/types/quiz";
import Dashboard from "./Dashboard";

function renderDashboard(progress: Partial<Progress> = {}, levels?: Level[]) {
  const props = { onStartSession: vi.fn(), onOpenChest: vi.fn() };
  render(<Dashboard progress={{ ...INITIAL_PROGRESS, ...progress }} levels={levels} {...props} />);
  return props;
}

function node(name: string): HTMLElement {
  return screen.getByRole("button", { name: new RegExp(`^${name}:`) });
}

const ALL_MUNICIPAL_LESSONS = ["municipal-1", "municipal-2", "municipal-3", "municipal-4"];

describe("Dashboard", () => {
  it("shows a banner per level with its sphere and step count", () => {
    renderDashboard();
    const municipal = screen.getByRole("region", { name: "No Meu Bairro" });
    expect(within(municipal).getByText("Nível 1 · Municipal")).toBeVisible();
    expect(within(municipal).getByText("0/5 ETAPAS")).toBeVisible();
    expect(screen.getByRole("region", { name: "Ordem e Região" })).toHaveTextContent("EM BREVE");
  });

  it("highlights the next step with a 'Jogar' callout and the mascot tip", () => {
    renderDashboard();
    expect(node("Serviços do bairro")).toHaveAccessibleName("Serviços do bairro: próxima etapa");
    expect(node("Saúde, escola e calçada")).toHaveAccessibleName("Saúde, escola e calçada: bloqueada");
    expect(screen.getByText("Jogar")).toBeVisible();
    expect(screen.getByText(LEVELS[0].mascotTip)).toBeVisible();
    expect(screen.getByRole("img", { name: "Engrenito, o mascote do Engrenum" })).toBeVisible();
  });

  it("shows coming-soon levels with placeholder steps and a sleepy mascot", () => {
    renderDashboard();
    expect(screen.getAllByTestId("ghost-node")).toHaveLength(9);
    expect(screen.getAllByRole("img", { name: "Engrenito cochilando" })).toHaveLength(3);
  });

  it("opens a lesson card and starts the lesson", async () => {
    const { onStartSession } = renderDashboard();
    await userEvent.click(node("Serviços do bairro"));

    expect(node("Serviços do bairro")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Lição 1 de 4 · 3 cenários")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Começar" }));
    expect(onStartSession).toHaveBeenCalledWith(expect.objectContaining({ id: "municipal-1", kind: "lesson" }));
  });

  it("closes the card when the same step is tapped again", async () => {
    renderDashboard();
    await userEvent.click(node("Serviços do bairro"));
    await userEvent.click(node("Serviços do bairro"));
    expect(screen.queryByRole("button", { name: "Começar" })).not.toBeInTheDocument();
  });

  it("explains how to unlock a locked step", async () => {
    renderDashboard();
    await userEvent.click(node("Desafio final"));
    expect(screen.getByText("10 cenários · libera o próximo nível")).toBeVisible();
    expect(screen.getByText("Complete as etapas anteriores para desbloquear.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Encarar desafio" })).not.toBeInTheDocument();
  });

  it("lets the player replay a completed lesson", async () => {
    const { onStartSession } = renderDashboard({ completedLessonIds: ["municipal-1"] });
    expect(node("Serviços do bairro")).toHaveAccessibleName("Serviços do bairro: concluída");
    await userEvent.click(node("Serviços do bairro"));
    await userEvent.click(screen.getByRole("button", { name: "Jogar de novo" }));
    expect(onStartSession).toHaveBeenCalledWith(expect.objectContaining({ id: "municipal-1" }));
  });

  it("opens the reward chest once two lessons are done", async () => {
    const { onOpenChest } = renderDashboard({ completedLessonIds: ["municipal-1", "municipal-2"] });
    expect(node("Baú de recompensa")).toHaveAccessibleName("Baú de recompensa: disponível");

    await userEvent.click(node("Baú de recompensa"));
    expect(screen.getByText("+20 XP de bônus")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Abrir baú" }));

    expect(onOpenChest).toHaveBeenCalledWith("municipal-chest");
    expect(screen.queryByRole("button", { name: "Abrir baú" })).not.toBeInTheDocument();
  });

  it("tells the player when a chest was already opened", async () => {
    renderDashboard({ completedLessonIds: ["municipal-1", "municipal-2"], openedChestIds: ["municipal-chest"] });
    await userEvent.click(node("Baú de recompensa"));
    expect(screen.getByText("Você já abriu este baú.")).toBeVisible();
  });

  it("starts the final challenge after every lesson", async () => {
    const { onStartSession } = renderDashboard({ completedLessonIds: ALL_MUNICIPAL_LESSONS });
    await userEvent.click(node("Desafio final"));
    await userEvent.click(screen.getByRole("button", { name: "Encarar desafio" }));
    expect(onStartSession).toHaveBeenCalledWith(expect.objectContaining({ kind: "challenge" }));
  });

  it("marks a completed level and allows redoing its challenge", async () => {
    renderDashboard({ completedLevelIds: ["municipal"] });
    expect(screen.getByRole("region", { name: "No Meu Bairro" })).toHaveTextContent("✓ CONCLUÍDO");
    expect(screen.queryByText("Jogar")).not.toBeInTheDocument();
    await userEvent.click(node("Desafio final"));
    expect(screen.getByRole("button", { name: "Refazer desafio" })).toBeVisible();
  });

  it("dims a level that has content but is still locked", () => {
    const question = LEVELS[0].questions[0];
    const levels: Level[] = [
      LEVELS[0],
      { ...LEVELS[1], lessons: [{ id: "state-1", title: "Única", questions: [question] }], questions: [question] },
    ];
    renderDashboard({}, levels);
    const state = screen.getByRole("region", { name: "Ordem e Região" });
    expect(within(state).getByText("0/2 ETAPAS")).toBeVisible();
    expect(within(state).queryByText(LEVELS[1].mascotTip)).toBeVisible();
    expect(within(state).getByRole("img", { name: "Engrenito cochilando" })).toBeVisible();
  });

  it("uses the singular for single-scenario lessons", async () => {
    const question = LEVELS[0].questions[0];
    const levels: Level[] = [
      { ...LEVELS[0], lessons: [{ id: "municipal-1", title: "Única", questions: [question] }], questions: [question] },
    ];
    renderDashboard({}, levels);
    await userEvent.click(node("Única"));
    expect(screen.getByText("Lição 1 de 1 · 1 cenário")).toBeVisible();
  });

  describe("journey panel", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 9, 23, 12, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows the civic rank and the XP left for the next one", () => {
      renderDashboard({ xp: 105 });
      const panel = screen.getByRole("complementary", { name: "Sua jornada" });
      expect(within(panel).getByText("Fiscal Cívico Júnior")).toBeVisible();
      expect(within(panel).getByText("Faltam 45 XP para Líder Comunitário")).toBeVisible();
      expect(within(panel).getByRole("progressbar", { name: "Progresso para o próximo título" })).toHaveAttribute(
        "aria-valuenow",
        "50",
      );
    });

    it("celebrates reaching the top rank", () => {
      renderDashboard({ xp: 400 });
      expect(screen.getByText("Você chegou ao topo!")).toBeVisible();
    });

    it("tracks the daily mission", () => {
      renderDashboard();
      expect(screen.getByText("Mantenha sua sequência viva")).toBeVisible();
      expect(screen.getByRole("progressbar", { name: "Progresso da missão do dia" })).toHaveAttribute(
        "aria-valuenow",
        "0",
      );
    });

    it("marks the daily mission as done after playing today", () => {
      renderDashboard({ lastPlayedDay: "2026-10-23", streak: 4 });
      expect(screen.getByText("Feito! Sequência de 4 🔥")).toBeVisible();
      expect(screen.getByRole("progressbar", { name: "Progresso da missão do dia" })).toHaveAttribute(
        "aria-valuenow",
        "1",
      );
    });
  });
});
