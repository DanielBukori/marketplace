import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Kurasa za mtu binafsi na njia za API hazipaswi kuruhusiwa.
      disallow: ["/dashboard", "/orders", "/checkout", "/post", "/login", "/auth", "/api"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
