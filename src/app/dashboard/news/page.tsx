import { getAllAnnouncements } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import RequireAdmin from "@/components/RequireAdmin";
import SetupNotice from "@/components/SetupNotice";
import AnnouncementManager from "@/components/AnnouncementManager";

export default async function NewsAdminPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;
  const announcements = await getAllAnnouncements();

  return (
    <RequireAdmin nextPath="/dashboard/news">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
            {t.admin.newsTitle}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-gray-500">
            {t.admin.newsDesc}
          </p>
        </div>

        <AnnouncementManager items={announcements} />
      </div>
    </RequireAdmin>
  );
}
