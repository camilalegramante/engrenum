import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LEVELS } from "@/data/levels";

vi.mock("@/lib/sound", () => ({ playSound: vi.fn() }));

const STORAGE_KEY = "engrenum:progress";
const municipalQuestions = LEVELS[0].questions;

// The progress store caches localStorage at module level, so each test renders a fresh app.
async function renderApp() {
  vi.resetModules();
  const { default: EngrenumApp } = await import("./EngrenumApp");
  render(<EngrenumApp />);
}

function storedProgress(): Record<string, unknown> {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown>;
}

async function answerCurrentQuestionCorrectly(index: number) {
  const correct = municipalQuestions[index].options.find((o) => o.isCorrect);
  await userEvent.click(screen.getByRole("button", { name: correct?.text }));
  await userEvent.click(screen.getByRole("button", { name: "Verificar Resposta" }));
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("EngrenumApp", () => {
  it("starts on the dashboard", async () => {
    await renderApp();
    expect(screen.getByRole("heading", { level: 1, name: "Quem Manda Aqui?" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Voltar ao mapa" })).not.toBeInTheDocument();
  });

  it("opens a level, awards XP for a correct answer and returns to the map", async () => {
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: /Nível 1/ }));
    expect(screen.getByRole("heading", { name: municipalQuestions[0].prompt })).toBeVisible();

    await answerCurrentQuestionCorrectly(0);
    expect(screen.getByTitle("Pontos de cidadania (XP)")).toHaveTextContent("15");
    expect(storedProgress()).toMatchObject({ xp: 15 });

    await userEvent.click(screen.getByRole("button", { name: "Voltar ao mapa" }));
    expect(screen.getByRole("heading", { level: 1, name: "Quem Manda Aqui?" })).toBeVisible();
    expect(screen.getByText("Eleitor Curioso")).toBeVisible();
  });

  it("persists the sound preference", async () => {
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: "Desativar som" }));
    expect(screen.getByRole("button", { name: "Ativar som" })).toBeVisible();
    expect(storedProgress()).toMatchObject({ isSoundEnabled: false });
  });

  it("toggles sound from inside a level", async () => {
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: /Nível 1/ }));
    await userEvent.click(screen.getByRole("button", { name: "Desativar som" }));
    expect(storedProgress()).toMatchObject({ isSoundEnabled: false });
  });

  it("records a completed level with its streak", async () => {
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: /Nível 1/ }));

    for (let i = 0; i < municipalQuestions.length; i++) {
      await answerCurrentQuestionCorrectly(i);
      const isLast = i === municipalQuestions.length - 1;
      await userEvent.click(screen.getByRole("button", { name: isLast ? "Concluir Nível →" : "Próximo Desafio →" }));
    }

    expect(screen.getByRole("heading", { name: "Guardião da Constituição" })).toBeVisible();
    expect(storedProgress()).toMatchObject({ xp: 150, streak: 1, completedLevelIds: ["municipal"] });

    await userEvent.click(screen.getByRole("button", { name: "Retornar ao Mapa Federativo" }));
    expect(screen.getByText("✓ CONCLUÍDO")).toBeVisible();
    expect(screen.getByText("Líder Comunitário")).toBeVisible();
  });
});
