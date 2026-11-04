import AdStrip from "@/components/AdStrip";
import MarketBoard from "@/components/MarketBoard";
import SetupNotice from "@/components/SetupNotice";
import { getActiveListings, getLiveAds } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import { pageMeta } from "@/lib/seo";
import type { Ad, Listing } from "@/lib/types";

export async function generateMetadata() {
  const t = await getT();
  return pageMeta("/market", t.meta.pages.market.title, t.meta.pages.market.desc);
}

export default async function MarketPage() {
  const t = await getT();
  let listings: Listing[] = [];
  let ads: Ad[] = [];
  if (isSupabaseConfigured) {
    [listings, ads] = await Promise.all([getActiveListings(), getLiveAds("market")]);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <h1 className="sr-only">{t.market.srTitle}</h1>
      {!isSupabaseConfigured && <SetupNotice />}
      {ads.length > 0 && (
        <AdStrip ads={ads} label={t.ads.stripMarket} sponsored={t.ads.sponsored} />
      )}
      <MarketBoard listings={listings} />
    </div>
  );
}
