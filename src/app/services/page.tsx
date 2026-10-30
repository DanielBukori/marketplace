import ServicesBoard from "@/components/ServicesBoard";
import SetupNotice from "@/components/SetupNotice";
import { getActiveBusinesses, getActiveListings } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import { serviceCategoryIds } from "@/lib/data";
import type { Business, Listing } from "@/lib/types";

export default async function ServicesPage() {
  const t = await getT();
  let providers: Business[] = [];
  let listings: Listing[] = [];
  if (isSupabaseConfigured) {
    [providers, listings] = await Promise.all([
      getActiveBusinesses("service"),
      getActiveListings(serviceCategoryIds),
    ]);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-700">
          {t.services.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 md:text-4xl">
          {t.services.title}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-gray-500">
          {t.services.desc}
        </p>
      </div>

      {!isSupabaseConfigured && <SetupNotice />}
      <ServicesBoard listings={listings} providers={providers} />
    </div>
  );
}
