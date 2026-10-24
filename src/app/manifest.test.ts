import { describe, expect, it } from "vitest";
import { STRINGS } from "@/data/strings";
import manifest from "./manifest";

describe("PWA manifest", () => {
  it("is installable as a standalone pt-BR app", () => {
    expect(manifest()).toMatchObject({
      name: STRINGS.app.name,
      start_url: "/",
      display: "standalone",
      lang: "pt-BR",
      theme_color: "#0b132b",
    });
  });

  it("provides 192px, 512px and maskable PNG icons", () => {
    const icons = manifest().icons ?? [];
    expect(icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/icon-192.png", sizes: "192x192", purpose: "any" }),
        expect.objectContaining({ src: "/icon-512.png", sizes: "512x512", purpose: "any" }),
        expect.objectContaining({ src: "/icon-512.png", sizes: "512x512", purpose: "maskable" }),
      ]),
    );
  });
});
