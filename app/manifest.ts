import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pulse — Student Health",
    short_name: "Pulse",
    description: "Your digital health passport for university.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f6f8fb",
    theme_color: "#0ea5a4",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
