import { getAllAdPlans, getAllAds } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import { requireUser } from "@/lib/require-user";
import AdPlansManager from "@/components/AdPlansManager";
import AdsBoard from "@/components/AdsBoard";
import RequireAdmin from "@/components/RequireAdmin";
import SetupNotice from "@/components/SetupNotice";

export default async function AdminAdsPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;
  const user = await requireUser("/dashboard/admin/ads");

  const [plans, ads] = await Promise.all([getAllAdPlans(), getAllAds()]);

  return (
    <RequireAdmin nextPath="/dashboard/admin/ads">
      <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
            {t.ads.adminTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-500">
            {t.ads.adminDesc}
          </p>
        </div>

        <section className="space-y-5">
          <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
            {t.adPlan.sectionTitle}
          </h2>
          <AdPlansManager plans={plans} />
        </section>

        <section className="space-y-5">
          <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
            {t.ads.requestsTitle}
          </h2>
          <p className="max-w-2xl text-[15px] leading-relaxed text-gray-500">
            {t.ads.requestsDesc}
          </p>
          <AdsBoard ads={ads} canModerate userId={user.id} />
        </section>
      </div>
    </RequireAdmin>
  );
}
