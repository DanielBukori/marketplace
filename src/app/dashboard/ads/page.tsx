import Link from "next/link";
import { Megaphone } from "lucide-react";
import { getAdPlans, getMyAds, getMyBusinesses } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import { requireUser } from "@/lib/require-user";
import AdComposer from "@/components/AdComposer";
import AdsBoard from "@/components/AdsBoard";
import SetupNotice from "@/components/SetupNotice";

export default async function MyAdsPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;
  const user = await requireUser("/dashboard/ads");

  const businesses = await getMyBusinesses(user.id);
  const [plans, ads] = await Promise.all([
    getAdPlans(),
    getMyAds(businesses.map((business) => business.id)),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-ink-900">
          <Megaphone size={26} /> {t.ads.title}
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-500">
          {t.ads.desc}
        </p>
      </div>

      {businesses.length === 0 && (
        <div className="rounded-3xl border border-dashed border-primary-200 bg-white p-8 text-center">
          <p className="text-[15px] text-gray-600">{t.ads.needBusiness}</p>
          <Link
            href="/dashboard/business/new"
            className="mt-5 inline-flex rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900"
          >
            {t.dashboard.openBusiness}
          </Link>
        </div>
      )}

      <AdComposer userId={user.id} businesses={businesses} plans={plans} />

      <section className="space-y-5">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
          {t.ads.mineTitle}
        </h2>
        <AdsBoard ads={ads} canModerate={false} userId={user.id} />
      </section>
    </div>
  );
}
