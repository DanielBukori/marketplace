import AdStrip from "@/components/AdStrip";
import FeedBoard from "@/components/FeedBoard";
import SetupNotice from "@/components/SetupNotice";
import { getFoodBoard, getLiveAds } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import { pageMeta } from "@/lib/seo";
import type { Business, MenuItem } from "@/lib/types";

export async function generateMetadata() {
  const t = await getT();
  return pageMeta("/feed", t.feed.title, t.feed.desc);
}

export default async function FeedPage() {
  const t = await getT();

  let board: { businesses: Business[]; menu: MenuItem[] } = {
    businesses: [],
    menu: [],
  };
  let ads: Awaited<ReturnType<typeof getLiveAds>> = [];

  if (isSupabaseConfigured) {
    [board, ads] = await Promise.all([getFoodBoard(), getLiveAds("msosi")]);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 pb-24 sm:px-6 lg:px-8">
      {!isSupabaseConfigured && <SetupNotice />}

      {ads.length > 0 && (
        <AdStrip ads={ads} label={t.ads.stripMsosi} sponsored={t.ads.sponsored} />
      )}

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
          {t.feed.title}
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-gray-500">
          {t.feed.desc}
        </p>
      </div>

      <FeedBoard menu={board.menu} />
    </div>
  );
}
