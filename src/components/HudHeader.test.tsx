import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { STRINGS } from "@/data/strings";
import HudHeader from "./HudHeader";

describe("HudHeader", () => {
  it("shows the brand, streak and XP on the dashboard, without lesson controls", () => {
    render(<HudHeader xp={45} streak={3} isSoundEnabled onToggleSound={vi.fn()} />);

    expect(screen.getByText(STRINGS.app.name)).toBeVisible();
    expect(screen.getByTitle(STRINGS.hud.streakTitle)).toHaveTextContent("3");
    expect(screen.getByTitle(STRINGS.hud.xpTitle)).toHaveTextContent("45");
    expect(screen.queryByRole("button", { name: STRINGS.hud.back })).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByTitle(STRINGS.hud.livesTitle)).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("opens the glossary from the main menu", async () => {
    const onOpenGlossary = vi.fn();
    render(<HudHeader xp={0} streak={0} isSoundEnabled onToggleSound={vi.fn()} onOpenGlossary={onOpenGlossary} />);
    const menu = screen.getByRole("navigation", { name: STRINGS.hud.menu });
    await userEvent.click(within(menu).getByRole("button", { name: STRINGS.hud.glossary }));
    expect(onOpenGlossary).toHaveBeenCalledOnce();
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
    expect(screen.getByTitle(STRINGS.hud.livesTitle)).toHaveTextContent("2");
    // The streak gives its room to the progress bar on small screens
    expect(screen.getByTitle(STRINGS.hud.streakTitle)).toHaveClass("hidden", "sm:flex");

    await userEvent.click(screen.getByRole("button", { name: STRINGS.hud.back }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("toggles sound and reflects its state", async () => {
    const onToggleSound = vi.fn();
    const { rerender } = render(<HudHeader xp={0} streak={0} isSoundEnabled onToggleSound={onToggleSound} />);

    const soundButton = screen.getByRole("button", { name: STRINGS.hud.disableSound });
    expect(soundButton).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(soundButton);
    expect(onToggleSound).toHaveBeenCalledOnce();

    rerender(<HudHeader xp={0} streak={0} isSoundEnabled={false} onToggleSound={onToggleSound} />);
    expect(screen.getByRole("button", { name: STRINGS.hud.enableSound })).toHaveAttribute("aria-pressed", "false");
  });

  it("widens to match the dashboard layout when asked", () => {
    const { container, rerender } = render(<HudHeader xp={0} streak={0} isSoundEnabled onToggleSound={vi.fn()} />);
    expect(container.querySelector("header > div")).toHaveClass("max-w-xl");
    rerender(<HudHeader xp={0} streak={0} isSoundEnabled onToggleSound={vi.fn()} isWide />);
    expect(container.querySelector("header > div")).toHaveClass("max-w-6xl");
  });

  it("keeps icon buttons at least 44px", () => {
    render(<HudHeader xp={0} streak={0} isSoundEnabled onToggleSound={vi.fn()} onBack={vi.fn()} />);
    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveClass("min-h-[44px]", "min-w-[44px]");
    }
  });
});
