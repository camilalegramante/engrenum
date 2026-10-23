import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { playSound } from "@/lib/sound";
import type { Level, Question } from "@/types/quiz";
import EngrenumQuiz from "./EngrenumQuiz";

vi.mock("@/lib/sound", () => ({ playSound: vi.fn() }));

function makeQuestion(id: number): Question {
  return {
    id,
    sphere: "municipal",
    prompt: `Cenário ${id}: quem resolve?`,
    options: [
      { id: "a", text: `Certa ${id}`, isCorrect: true },
      { id: "b", text: `Errada ${id}`, isCorrect: false },
    ],
    constitutionalArticle: `Art. ${id} da CF/88`,
    explanation: `Explicação ${id}`,
  };
}

function makeLevel(questionCount: number): Level {
  return {
    id: "municipal",
    sphereLabel: "Municipal",
    title: "Nível 1: Teste",
    subtitle: "Subtítulo",
    icon: "🏘️",
    questions: Array.from({ length: questionCount }, (_, i) => makeQuestion(i + 1)),
  };
}

function renderQuiz(questionCount: number) {
  const props = {
    level: makeLevel(questionCount),
    xp: 0,
    streak: 0,
    isSoundEnabled: true,
    onToggleSound: vi.fn(),
    onCorrectAnswer: vi.fn(),
    onLevelComplete: vi.fn(),
    onExit: vi.fn(),
  };
  render(<EngrenumQuiz {...props} />);
  return props;
}

async function answer(optionText: string) {
  await userEvent.click(screen.getByRole("button", { name: optionText }));
  await userEvent.click(screen.getByRole("button", { name: "Verificar Resposta" }));
}

beforeEach(() => {
  vi.mocked(playSound).mockClear();
});

describe("EngrenumQuiz", () => {
  it("shows the first scenario and enables verification only after a choice", async () => {
    renderQuiz(2);

    expect(screen.getByRole("heading", { name: "Cenário 1: quem resolve?" })).toBeVisible();
    expect(screen.getByText("Esfera Municipal")).toBeVisible();
    expect(screen.getByText("Fase 1 de 2")).toBeVisible();
    expect(screen.getByRole("button", { name: "Verificar Resposta" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Errada 1" }));
    expect(screen.getByRole("button", { name: "Errada 1" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Verificar Resposta" })).toBeEnabled();
    expect(playSound).toHaveBeenCalledWith("tap", true);
  });

  it("locks the options and explains a correct answer", async () => {
    const props = renderQuiz(2);
    await answer("Certa 1");

    expect(screen.getByRole("status")).toHaveTextContent("Competência Constitucional Precisa!");
    expect(screen.getByText("📖 Art. 1 da CF/88")).toBeVisible();
    expect(screen.getByText("Explicação 1")).toBeVisible();
    expect(screen.queryByText(/Destinatário correto/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Certa 1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Errada 1" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Verificar Resposta" })).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    expect(props.onCorrectAnswer).toHaveBeenCalledOnce();
    expect(playSound).toHaveBeenCalledWith("correct", true);
  });

  it("costs a life and shows the right answer on a mistake", async () => {
    const props = renderQuiz(2);
    await answer("Errada 1");

    expect(screen.getByRole("status")).toHaveTextContent("Cobrança no Lugar Errado!");
    expect(screen.getByText("Destinatário correto: Certa 1")).toBeVisible();
    expect(screen.getByTitle("Fichas de credibilidade (vidas)")).toHaveTextContent("2");
    expect(screen.getByRole("main")).toHaveClass("animate-shake");
    expect(props.onCorrectAnswer).not.toHaveBeenCalled();
    expect(playSound).toHaveBeenCalledWith("error", true);
  });

  it("advances to the next scenario", async () => {
    renderQuiz(2);
    await answer("Certa 1");
    await userEvent.click(screen.getByRole("button", { name: "Próximo Desafio →" }));

    expect(screen.getByRole("heading", { name: "Cenário 2: quem resolve?" })).toBeVisible();
    expect(screen.getByText("Fase 2 de 2")).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verificar Resposta" })).toBeDisabled();
  });

  it("completes the level and shows the victory screen", async () => {
    const props = renderQuiz(2);
    await answer("Certa 1");
    await userEvent.click(screen.getByRole("button", { name: "Próximo Desafio →" }));
    await answer("Errada 2");
    await userEvent.click(screen.getByRole("button", { name: "Concluir Nível →" }));

    expect(props.onLevelComplete).toHaveBeenCalledOnce();
    expect(screen.getByText("Nível Concluído")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Cidadão Atento" })).toBeVisible();
    expect(screen.getByText("Pontos Obtidos").nextElementSibling).toHaveTextContent("+15 XP");
    expect(screen.getByText("Taxa de Acerto").nextElementSibling).toHaveTextContent("50%");
  });

  it("restarts or exits from the victory screen", async () => {
    const props = renderQuiz(1);
    await answer("Certa 1");
    await userEvent.click(screen.getByRole("button", { name: "Concluir Nível →" }));

    await userEvent.click(screen.getByRole("button", { name: "Retornar ao Mapa Federativo" }));
    expect(props.onExit).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole("button", { name: "Jogar Novamente" }));
    expect(screen.getByRole("heading", { name: "Cenário 1: quem resolve?" })).toBeVisible();
    expect(screen.getByTitle("Fichas de credibilidade (vidas)")).toHaveTextContent("3");
  });

  describe("when all lives are lost", () => {
    async function loseAllLives() {
      const props = renderQuiz(4);
      for (const n of [1, 2]) {
        await answer(`Errada ${n}`);
        await userEvent.click(screen.getByRole("button", { name: "Próximo Desafio →" }));
      }
      await answer("Errada 3");
      return props;
    }

    it("announces it in the drawer and opens the defeat dialog", async () => {
      await loseAllLives();
      expect(screen.getByRole("status")).toHaveTextContent("Credibilidade Esgotada!");
      expect(screen.getByTitle("Fichas de credibilidade (vidas)")).toHaveTextContent("0");

      await userEvent.click(screen.getByRole("button", { name: "Ver Resultado" }));
      const dialog = screen.getByRole("dialog", { name: "Credibilidade Esgotada!" });
      expect(dialog).toHaveTextContent("Você acertou 0 de 3 cenários");
    });

    it("lets the player retry the level", async () => {
      await loseAllLives();
      await userEvent.click(screen.getByRole("button", { name: "Ver Resultado" }));
      await userEvent.click(screen.getByRole("button", { name: "Tentar Novamente" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByText("Fase 1 de 4")).toBeVisible();
      expect(screen.getByTitle("Fichas de credibilidade (vidas)")).toHaveTextContent("3");
    });

    it("lets the player go back to the map", async () => {
      const props = await loseAllLives();
      await userEvent.click(screen.getByRole("button", { name: "Ver Resultado" }));
      await userEvent.click(screen.getByRole("button", { name: "Voltar ao Mapa" }));
      expect(props.onExit).toHaveBeenCalledOnce();
    });
  });

  it("forwards sound toggling and leaving to the parent", async () => {
    const props = renderQuiz(1);
    await userEvent.click(screen.getByRole("button", { name: "Desativar som" }));
    await userEvent.click(screen.getByRole("button", { name: "Voltar ao mapa" }));
    expect(props.onToggleSound).toHaveBeenCalledOnce();
    expect(props.onExit).toHaveBeenCalledOnce();
  });
});
