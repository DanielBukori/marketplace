import { getAllZones } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import RequireAdmin from "@/components/RequireAdmin";
import SetupNotice from "@/components/SetupNotice";
import ZoneManager from "@/components/ZoneManager";
import type { DeliveryZone } from "@/lib/types";

export default async function ZonesPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;

  // Jedwali huja kwenye migration ya upelekezaji. Bado liko mbali, onyesha
  // ukweli huo badala ya kurusha kosa kisichoeleweka.
  let zones: DeliveryZone[] | null = null;
  try {
    zones = await getAllZones();
  } catch {
    zones = null;
  }

  return (
    <RequireAdmin nextPath="/dashboard/zones">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">{t.zones.title}</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-500">
            {t.zones.desc}
          </p>
        </div>

        {zones === null ? (
          <p className="rounded-3xl border border-dashed border-primary-200 bg-white px-6 py-8 text-center text-sm text-gray-500">
            {t.api.dbNotConfigured}
          </p>
        ) : (
          <ZoneManager zones={zones} />
        )}
      </div>
    </RequireAdmin>
  );
}
