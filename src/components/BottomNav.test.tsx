import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { STRINGS } from "@/data/strings";
import BottomNav from "./BottomNav";

describe("BottomNav", () => {
  it("disables the term of the day until the client knows today's date", () => {
    render(
      <BottomNav
        activeTab="path"
        onSelectTab={vi.fn()}
        onStartSwipe={vi.fn()}
        isTermOfDayPending={false}
        onOpenGlossary={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: STRINGS.bottomNav.termOfDay })).toBeDisabled();
  });

  it("keeps every item at least 44px tall", () => {
    render(
      <BottomNav
        activeTab="profile"
        onSelectTab={vi.fn()}
        onStartSwipe={vi.fn()}
        onOpenTermOfDay={vi.fn()}
        isTermOfDayPending
        onOpenGlossary={vi.fn()}
      />,
    );
    for (const button of screen.getAllByRole("button")) expect(button).toHaveClass("min-h-[56px]");
    expect(screen.getByRole("button", { name: STRINGS.bottomNav.profile })).toHaveAttribute("aria-current", "page");
  });
});
