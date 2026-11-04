import type { MetadataRoute } from "next";
import { getActiveBusinesses, getActiveListings } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/media";
import { absoluteUrl } from "@/lib/seo";

/** Ramani hii huhifadhiwa kwa saa moja — haihitaji kusoma hifadhidata
 *  kwa kila ombi la kutaftaji. */
export const revalidate = 3600;

const publicPaths: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/market", priority: 0.9 },
  { path: "/msosi", priority: 0.9 },
  { path: "/services", priority: 0.8 },
  { path: "/vyumba", priority: 0.8 },
  { path: "/feed", priority: 0.85 },
  { path: "/get-started", priority: 0.8 },
  { path: "/news", priority: 0.6 },
  { path: "/privacy", priority: 0.2 },
  { path: "/terms", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = publicPaths.map((p) => ({
    url: absoluteUrl(p.path),
    changeFrequency: "weekly",
    priority: p.priority,
  }));

  if (!isSupabaseConfigured) return entries;

  const [listings, businesses] = await Promise.all([
    getActiveListings(),
    getActiveBusinesses(),
  ]);

  for (const listing of listings) {
    if (!listing.published_at) continue;
    entries.push({
      url: absoluteUrl(`/product/${listing.id}`),
      lastModified: new Date(listing.published_at),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  for (const business of businesses) {
    entries.push({
      url: absoluteUrl(`/duka/${business.slug}`),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}
