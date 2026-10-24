import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LEVELS } from "@/data/levels";
import swipeCards from "@/data/swipeCards.json";
import type { Question } from "@/types/quiz";

vi.mock("@/lib/sound", () => ({ playSound: vi.fn() }));

const STORAGE_KEY = "engrenum:progress";
const [municipal] = LEVELS;

// The progress store caches localStorage at module level, so each test renders a fresh app.
async function renderApp() {
  vi.resetModules();
  const { default: EngrenumApp } = await import("./EngrenumApp");
  render(<EngrenumApp />);
}

function storedProgress(): Record<string, unknown> {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown>;
}

async function startNode(nodeTitle: string, actionLabel: string) {
  await userEvent.click(screen.getByRole("button", { name: new RegExp(`^${nodeTitle}:`) }));
  await userEvent.click(screen.getByRole("button", { name: actionLabel }));
}

async function answerAllCorrectly(questions: Question[]) {
  for (const [i, question] of questions.entries()) {
    const correct = question.options.find((o) => o.isCorrect);
    await userEvent.click(screen.getByRole("button", { name: correct?.text }));
    await userEvent.click(screen.getByRole("button", { name: "Verificar Resposta" }));
    const isLast = i === questions.length - 1;
    await userEvent.click(screen.getByRole("button", { name: isLast ? "Concluir Nível →" : "Próximo Desafio →" }));
  }
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("EngrenumApp", () => {
  it("starts on the learning path", async () => {
    await renderApp();
    expect(screen.getByRole("region", { name: "No Meu Bairro" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Voltar ao mapa" })).not.toBeInTheDocument();
  });

  it("plays a lesson, awards XP and records it on the path", async () => {
    await renderApp();
    await startNode("Serviços do bairro", "Começar");
    expect(screen.getByRole("heading", { name: municipal.lessons[0].questions[0].prompt })).toBeVisible();

    await answerAllCorrectly(municipal.lessons[0].questions);
    expect(screen.getByRole("heading", { name: "Lição perfeita!" })).toBeVisible();
    expect(storedProgress()).toMatchObject({ xp: 45, streak: 1, completedLessonIds: ["municipal-1"] });

    await userEvent.click(screen.getByRole("button", { name: "Voltar à Trilha" }));
    expect(screen.getByRole("button", { name: "Serviços do bairro: concluída" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Saúde, escola e calçada: próxima etapa" })).toBeVisible();
  });

  it("plays Fato ou Fake Eleitoral, awards XP and returns to the path", async () => {
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: "Avaliar promessas" }));
    expect(screen.getByRole("heading", { name: "Fato ou Fake Eleitoral" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: swipeCards[0].isLegitimate ? "Legítimo" : "Promessa ilegal" }));
    expect(screen.getByRole("status")).toHaveTextContent(swipeCards[0].constitutionalArticle);
    expect(storedProgress()).toMatchObject({ xp: 15 });

    await userEvent.click(screen.getByRole("button", { name: "Voltar ao mapa" }));
    expect(screen.getByRole("region", { name: "No Meu Bairro" })).toBeVisible();
  });

  it("leaves a lesson midway and returns to the path", async () => {
    await renderApp();
    await startNode("Serviços do bairro", "Começar");
    await userEvent.click(screen.getByRole("button", { name: "Voltar ao mapa" }));
    expect(screen.getByRole("region", { name: "No Meu Bairro" })).toBeVisible();
  });

  it("opens the reward chest for bonus XP", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ completedLessonIds: ["municipal-1", "municipal-2"] }));
    await renderApp();
    await startNode("Baú de recompensa", "Abrir baú");

    expect(screen.getByRole("dialog", { name: "Baú aberto!" })).toHaveTextContent("+20 XP");
    expect(storedProgress()).toMatchObject({ xp: 20, openedChestIds: ["municipal-chest"] });

    await userEvent.click(screen.getByRole("button", { name: "Oba!" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Baú de recompensa: concluída" })).toBeVisible();
  });

  it("completes the level through the final challenge", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ completedLessonIds: municipal.lessons.map((lesson) => lesson.id) }),
    );
    await renderApp();
    await startNode("Desafio final", "Encarar desafio");
    await answerAllCorrectly(municipal.questions);

    expect(screen.getByRole("heading", { name: "Guardião da Constituição" })).toBeVisible();
    expect(storedProgress()).toMatchObject({ xp: 150, completedLevelIds: ["municipal"] });

    await userEvent.click(screen.getByRole("button", { name: "Voltar à Trilha" }));
    expect(screen.getByRole("region", { name: "No Meu Bairro" })).toHaveTextContent("✓ CONCLUÍDO");
    expect(screen.getByText("Líder Comunitário")).toBeVisible();
  });

  it("persists the sound preference from the path and from a lesson", async () => {
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: "Desativar som" }));
    expect(storedProgress()).toMatchObject({ isSoundEnabled: false });

    await startNode("Serviços do bairro", "Começar");
    await userEvent.click(screen.getByRole("button", { name: "Ativar som" }));
    expect(storedProgress()).toMatchObject({ isSoundEnabled: true });
  });
});
