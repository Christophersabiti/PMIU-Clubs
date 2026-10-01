import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PMI Uganda Clubs",
    short_name: "PMI Clubs",
    description: "Connect. Participate. Grow. Impact.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#1c0742",
    theme_color: "#1c0742",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Events", url: "/events" },
      { name: "My Clubs", url: "/dashboard" },
    ],
  };
}
