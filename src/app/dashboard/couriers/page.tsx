import { getApprovedCouriers, getCourierRequests } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import RequireAdmin from "@/components/RequireAdmin";
import SetupNotice from "@/components/SetupNotice";
import CourierApprovals from "@/components/CourierApprovals";

export default async function CouriersPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;

  const [requests, approved] = await Promise.all([
    getCourierRequests(),
    getApprovedCouriers(),
  ]);

  return (
    <RequireAdmin nextPath="/dashboard/couriers">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
            {t.courier.requestsTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-500">
            {t.courier.desc}
          </p>
        </div>

        <CourierApprovals requests={requests} approved={approved} />
      </div>
    </RequireAdmin>
  );
}
