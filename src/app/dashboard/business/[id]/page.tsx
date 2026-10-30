import { requireUser } from "@/lib/require-user";
import { getMyBusinesses } from "@/lib/db";
import BusinessForm from "@/components/BusinessForm";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import SetupNotice from "@/components/SetupNotice";
import { notFound } from "next/navigation";

export default async function EditBusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;
  const user = await requireUser("/dashboard");
  const { id } = await params;

  const businesses = await getMyBusinesses(user.id);
  const business = businesses.find((b) => b.id === id);
  if (!business) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          {t.business.editTitle}
        </h1>
        <p className="mt-2 text-[15px] text-gray-500">{business.name}</p>
      </div>

      <BusinessForm userId={user.id} business={business} />

      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={`/duka/${encodeURIComponent(business.slug)}`}
          className="rounded-2xl border border-black/5 bg-white px-6 py-4 text-center text-sm font-bold text-ink-900 transition hover:bg-paper-100"
        >
          {t.business.viewPage}
        </a>
        <a
          href={`/dashboard/menu?business=${encodeURIComponent(business.id)}`}
          className="rounded-2xl bg-primary-800 px-6 py-4 text-center text-sm font-bold text-white transition hover:bg-primary-900"
        >
          {t.business.manageMenu}
        </a>
      </div>
    </div>
  );
}
