import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("@/lib/sound", () => ({ playSound: vi.fn() }));

describe("Home page", () => {
  it("renders the Engrenum app", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: "Quem Manda Aqui?" })).toBeVisible();
  });
});
