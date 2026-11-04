import AdStrip from "@/components/AdStrip";
import MsosiBoard from "@/components/MsosiBoard";
import SetupNotice from "@/components/SetupNotice";
import { getFoodBoard, getLiveAds } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import { pageMeta } from "@/lib/seo";
import type { Ad, Business, MenuItem } from "@/lib/types";

export async function generateMetadata() {
  const t = await getT();
  return pageMeta("/msosi", t.meta.pages.food.title, t.meta.pages.food.desc);
}

export default async function MsosiPage() {
  const t = await getT();
  let board: { businesses: Business[]; menu: MenuItem[] } = {
    businesses: [],
    menu: [],
  };
  let ads: Ad[] = [];
  if (isSupabaseConfigured) {
    [board, ads] = await Promise.all([getFoodBoard(), getLiveAds("msosi")]);
  }

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
