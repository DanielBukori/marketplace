import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IAA Marketplace — Arusha",
    short_name: "IAA Market",
    description:
      "Soko la IAA Arusha: nunua na uza bidhaa, patafuta huduma na agiza chakula kwa mobile money.",
    id: "/",
    start_url: absoluteUrl("/"),
    scope: "/",
    display: "standalone",
    lang: "sw",
    background_color: "#f7f9fc",
    theme_color: "#10497e",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/iaa/iaa-crest.png", sizes: "90x87", type: "image/png" },
    ],
  };
}
