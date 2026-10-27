import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { STRINGS } from "@/data/strings";
import Mascot from "./Mascot";

describe("Mascot", () => {
  it("shows the still capybara by default", () => {
    const { container } = render(<Mascot className="h-24 w-24" />);
    expect(screen.getByRole("img", { name: STRINGS.mascot.still })).toHaveAttribute("src", "/mascot/capybara.webp");
    expect(container.firstChild).toHaveClass("h-24", "w-24");
  });

  it("waves with the animated capybara and falls back to a still for reduced motion", () => {
    const { container } = render(<Mascot mood="happy" className="h-24 w-24" />);
    const image = screen.getByRole("img", { name: STRINGS.mascot.waving });

    expect(image).toHaveAttribute("src", "/mascot/capybara-wave.webp");
    expect(image).toHaveAttribute("width", "140");
    expect(image).toHaveAttribute("height", "180");
    expect(container.querySelector("picture")).toHaveClass("h-24", "w-24");
    expect(container.querySelector("source")).toHaveAttribute("media", "(prefers-reduced-motion: reduce)");
    expect(container.querySelector("source")).toHaveAttribute("srcset", "/mascot/capybara.webp");
  });

  it("naps in grayscale when sleepy", () => {
    render(<Mascot mood="sleepy" className="h-24 w-24" />);
    const image = screen.getByRole("img", { name: STRINGS.mascot.sleepy });
    expect(image).toHaveAttribute("src", "/mascot/capybara-sleepy.webp");
    expect(image).toHaveClass("grayscale");
  });
});
