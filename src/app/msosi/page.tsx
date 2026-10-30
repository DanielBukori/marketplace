import AdStrip from "@/components/AdStrip";
import MsosiBoard from "@/components/MsosiBoard";
import SetupNotice from "@/components/SetupNotice";
import { getFoodBoard, getLiveAds } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";

export default async function MsosiPage() {
  const t = await getT();
  const board = isSupabaseConfigured
    ? await getFoodBoard()
    : { businesses: [], menu: [] };
  const ads = isSupabaseConfigured ? await getLiveAds("msosi") : [];

  return (
    <div className="w-full pb-24">
      {!isSupabaseConfigured && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SetupNotice />
        </div>
      )}

      {ads.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <AdStrip ads={ads} label={t.ads.stripMsosi} sponsored={t.ads.sponsored} />
        </div>
      )}

      <MsosiBoard businesses={board.businesses} menu={board.menu} />
    </div>
  );
}
