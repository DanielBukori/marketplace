import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { getBusinessOrders, getMyBusinesses } from "@/lib/db";
import OrdersInbox from "@/components/OrdersInbox";
import { isSupabaseConfigured } from "@/lib/media";
import { getT } from "@/lib/i18n-server";
import SetupNotice from "@/components/SetupNotice";

export default async function VendorOrdersPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;
  const user = await requireUser("/dashboard/orders");
  const businesses = await getMyBusinesses(user.id);
  const orders = await getBusinessOrders(businesses.map((b) => b.id));

  if (businesses.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-[15px] text-gray-600">{t.dashboard.noBusinessForOrders}</p>
        <Link
          href="/dashboard/business/new"
          className="mt-5 inline-flex rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900"
        >
          {t.dashboard.openBusiness}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          {t.dashboard.vendorOrders}
        </h1>
        <p className="mt-2 text-[15px] text-gray-500">{t.dashboard.vendorOrdersDesc}</p>
      </div>

      <OrdersInbox orders={orders} canManage />
    </div>
  );
}
