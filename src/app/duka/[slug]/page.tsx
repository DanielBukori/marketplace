import { notFound } from "next/navigation";
import { getBusinessBySlug, getProfile, getZonesForBusiness } from "@/lib/db";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured, mediaUrl } from "@/lib/media";
import { getT } from "@/lib/i18n-server";
import { absoluteUrl, clip, jsonLd, pageMeta } from "@/lib/seo";
import Storefront from "@/components/Storefront";
import SetupNotice from "@/components/SetupNotice";

/** `getBusinessBySlug` imewekwa kwenye `cache()`: ukurasa na metadata
 *  husoma mara moja tu kwa kila ombi. */
async function loadStore(slug: string) {
  const board = await getBusinessBySlug(slug);
  if (!board || !board.business.is_active) notFound();
  return board;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!isSupabaseConfigured) return {};
  const { slug } = await params;
  const { business } = await loadStore(slug);
  const t = await getT();

  return pageMeta(
    `/duka/${business.slug}`,
    `${business.name} · ${t.brand.name} ${t.brand.suffix}`,
    clip(business.description || t.meta.pages.storeFallback),
    mediaUrl(business.logo_path ?? business.cover_path) ?? undefined,
  );
}

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!isSupabaseConfigured) return <SetupNotice />;
  const { slug } = await params;
  const board = await loadStore(slug);
  const t = await getT();
  const b = board.business;
  const logo = mediaUrl(b.logo_path ?? b.cover_path);

  // Oda ya papo hapo: namba na mahali hujazwa kutoka akaunti, ili mtu
  // abonyeze chakula tu na kuweka oda bila kuandika fomu ndefu.
  const [zones, user] = await Promise.all([
    getZonesForBusiness(b.id),
    getCurrentUser(),
  ]);
  const profile = user ? await getProfile(user.id).catch(() => null) : null;
  const viewer = {
    phone: profile?.phone ?? String(user?.user_metadata?.phone ?? ""),
    address: profile?.hall ?? "",
  };
  const loginHref = `/login?next=${encodeURIComponent(`/duka/${b.slug}`)}`;

  return (
    <>
      {jsonLd({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: b.name,
        description: clip(b.description || t.meta.pages.storeFallback),
        url: absoluteUrl(`/duka/${b.slug}`),
        image: logo ?? undefined,
        telephone: b.phone ?? undefined,
        address: b.location
          ? { "@type": "PostalAddress", addressLocality: b.location }
          : undefined,
        ...(b.rating_count > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: b.rating_avg,
                reviewCount: b.rating_count,
              },
            }
          : {}),
      })}
      <Storefront
        business={board.business}
        menu={board.menu}
        listings={board.listings}
        offers={board.offers}
        reviews={board.reviews}
        zones={zones}
        viewer={viewer}
        signedIn={Boolean(user)}
        loginHref={loginHref}
      />
    </>
  );
}
