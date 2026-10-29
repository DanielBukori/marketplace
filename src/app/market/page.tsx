import MarketBoard from "@/components/MarketBoard";
import SetupNotice from "@/components/SetupNotice";
import { getActiveListings } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import type { Listing } from "@/lib/types";

export default async function MarketPage() {
  const t = await getT();
  let listings: Listing[] = [];
  if (isSupabaseConfigured) listings = await getActiveListings();

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <h1 className="sr-only">{t.market.srTitle}</h1>
      {!isSupabaseConfigured && <SetupNotice />}
      <MarketBoard listings={listings} />
    </div>
  );
}
