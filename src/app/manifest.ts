import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Engrenum",
    short_name: "Engrenum",
    description: "Aprenda as competências dos poderes públicos segundo a CF/88.",
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
