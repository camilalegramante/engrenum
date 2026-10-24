import { isValidElement, type ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { STRINGS } from "@/data/strings";
import RootLayout, { metadata, viewport } from "./layout";

vi.mock("next/font/google", () => ({
  Plus_Jakarta_Sans: () => ({ variable: "font-jakarta-var" }),
  Space_Grotesk: () => ({ variable: "font-space-grotesk-var" }),
}));

type HtmlProps = { lang: string; className: string; children: ReactElement<{ children: ReactElement }> };

describe("RootLayout", () => {
  it("renders a pt-BR document with both font variables and the page content", () => {
    const content = <p>conteúdo</p>;
    const html = RootLayout({ children: content, params: Promise.resolve({}) }) as ReactElement<HtmlProps>;

    expect(html.props.lang).toBe("pt-BR");
    expect(html.props.className).toContain("font-jakarta-var");
    expect(html.props.className).toContain("font-space-grotesk-var");
    expect(isValidElement(html.props.children)).toBe(true);
    expect(html.props.children.props.children).toBe(content);
  });

  it("keeps pinch-zoom enabled", () => {
    expect(viewport).not.toHaveProperty("maximumScale");
    expect(viewport).not.toHaveProperty("userScalable");
  });

  it("exposes the project title and Apple icon", () => {
    expect(metadata.title).toBe(STRINGS.app.title);
    expect(metadata.icons).toEqual({ apple: "/icon-192.png" });
  });
});
