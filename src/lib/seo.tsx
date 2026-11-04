import type { Metadata } from "next";
import { getLang } from "@/lib/i18n-server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Picha ya kurasa za kumshare — iko kwenye `public/`, kwa hivyo ipo halisi. */
export const shareImageUrl = `${siteUrl}/iaa/campus-main.png`;

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).href;
}

/**
 * Metadata ya ukurasa mmoja: kichwa, maelezo, anwani kamili (canonical) na
 * kadi ya og/twitter. Nakala zote hutoka kwenye kamusi ya lugha hiyo hiyo
 * ambayo mtumiaji anasoma — hakuna kitu cha kupanga.
 */
export async function pageMeta(
  path: string,
  title: string,
  description: string,
  image?: string,
): Promise<Metadata> {
  const lang = await getLang();
  const url = absoluteUrl(path);
  const images = image
    ? [{ url: image, alt: title }]
    : [{ url: shareImageUrl, width: 800, height: 300, alt: title }];

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "IAA Marketplace",
      locale: lang === "sw" ? "sw_TZ" : "en_US",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image ?? shareImageUrl],
    },
  };
}

/** Maandishi ya hifadhidata yote hufupishwa kwa urefu wa maelezo ya SEO. */
export function clip(text: string, max = 155) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Kurasa za mtu binafsi (oda, dashibodi, malipo) hazipaswi kuonekana kwa
 * watafutaji wala kuhifadhiwa.
 */
export const noIndexMeta: Metadata = {
  title: "IAA Marketplace",
  robots: { index: false, follow: false },
};

/** Data muundo (schema.org) — inasaidia Google kuonyesha bei na nyota. */
export function jsonLd(object: Record<string, unknown>) {
  return (
    <script
      type="application/ld+json"
      // Mzigo hujengwa na seva kutoka data ya hifadhidata, si mtumiaji.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(object) }}
    />
  );
}
