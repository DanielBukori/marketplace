import { requireUser } from "@/lib/require-user";
import BusinessForm from "@/components/BusinessForm";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import SetupNotice from "@/components/SetupNotice";

export default async function NewBusinessPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;
  const user = await requireUser("/dashboard/business/new");

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          {t.business.newTitle}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-500">
          {t.business.newDesc}
        </p>
      </div>

      <BusinessForm userId={user.id} />
    </div>
  );
}
