import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Mascot from "./Mascot";

describe("Mascot", () => {
  it("waves with the animated capybara and falls back to a still for reduced motion", () => {
    const { container } = render(<Mascot className="h-24 w-24" />);
    const image = screen.getByRole("img", { name: "Capivara, mascote do Engrenum, acenando" });

    expect(image).toHaveAttribute("src", "/mascot/capybara-wave.webp");
    expect(image).toHaveAttribute("width", "140");
    expect(image).toHaveAttribute("height", "180");
    expect(container.querySelector("picture")).toHaveClass("h-24", "w-24");
    expect(container.querySelector("source")).toHaveAttribute("media", "(prefers-reduced-motion: reduce)");
    expect(container.querySelector("source")).toHaveAttribute("srcset", "/mascot/capybara.webp");
  });

  it("naps in grayscale when sleepy", () => {
    render(<Mascot mood="sleepy" className="h-24 w-24" />);
    const image = screen.getByRole("img", { name: "Capivara cochilando" });
    expect(image).toHaveAttribute("src", "/mascot/capybara-sleepy.webp");
    expect(image).toHaveClass("grayscale");
  });
});
