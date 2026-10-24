import type { MetadataRoute } from "next";
import { STRINGS } from "@/data/strings";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: STRINGS.app.name,
    short_name: STRINGS.app.name,
    description: STRINGS.app.manifestDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9fa",
    theme_color: "#0b132b",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
