import { getSettings } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import RequireAdmin from "@/components/RequireAdmin";
import SetupNotice from "@/components/SetupNotice";
import SettingsEditor from "@/components/SettingsEditor";

export default async function AdminSettingsPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;

  const settings = await getSettings();

  return (
    <RequireAdmin nextPath="/dashboard/admin/settings">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
            {t.settings.title}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-500">
            {t.settings.desc}
          </p>
        </div>

        <SettingsEditor initial={settings} knownLabels={t.settings.labels} />
      </div>
    </RequireAdmin>
  );
}
