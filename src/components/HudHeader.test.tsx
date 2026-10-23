import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import HudHeader from "./HudHeader";

describe("HudHeader", () => {
  it("shows the brand, streak and XP on the dashboard, without lesson controls", () => {
    render(<HudHeader xp={45} streak={3} isSoundEnabled onToggleSound={vi.fn()} />);

    expect(screen.getByText("Engrenum")).toBeVisible();
    expect(screen.getByTitle("Dias seguidos de foco cívico")).toHaveTextContent("3");
    expect(screen.getByTitle("Pontos de cidadania (XP)")).toHaveTextContent("45");
    expect(screen.queryByRole("button", { name: "Voltar ao mapa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Fichas de credibilidade (vidas)")).not.toBeInTheDocument();
  });

  it("shows back button, progress and lives during a lesson", async () => {
    const onBack = vi.fn();
    render(
      <HudHeader
        xp={0}
        streak={1}
        isSoundEnabled
        onToggleSound={vi.fn()}
        lives={2}
        progressPercent={33.4}
        onBack={onBack}
      />,
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33");
    expect(screen.getByTitle("Fichas de credibilidade (vidas)")).toHaveTextContent("2");
    // The streak gives its room to the progress bar on small screens
    expect(screen.getByTitle("Dias seguidos de foco cívico")).toHaveClass("hidden", "sm:flex");

    await userEvent.click(screen.getByRole("button", { name: "Voltar ao mapa" }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("toggles sound and reflects its state", async () => {
    const onToggleSound = vi.fn();
    const { rerender } = render(<HudHeader xp={0} streak={0} isSoundEnabled onToggleSound={onToggleSound} />);

    const soundButton = screen.getByRole("button", { name: "Desativar som" });
    expect(soundButton).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(soundButton);
    expect(onToggleSound).toHaveBeenCalledOnce();

    rerender(<HudHeader xp={0} streak={0} isSoundEnabled={false} onToggleSound={onToggleSound} />);
    expect(screen.getByRole("button", { name: "Ativar som" })).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps icon buttons at least 44px", () => {
    render(<HudHeader xp={0} streak={0} isSoundEnabled onToggleSound={vi.fn()} onBack={vi.fn()} />);
    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveClass("min-h-[44px]", "min-w-[44px]");
    }
  });
});
