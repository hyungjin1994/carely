import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Carely",
    short_name: "Carely",
    description: "엄마와 자녀가 함께 건강을 챙기는 앱",
    start_url: "/home",
    display: "standalone",
    background_color: "#F4F6F9",
    theme_color: "#0066FF",
    orientation: "portrait",
    lang: "ko",
    categories: ["health", "lifestyle", "medical"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
