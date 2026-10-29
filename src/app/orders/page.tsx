import { requireUser } from "@/lib/require-user";
import { getBuyerOrders } from "@/lib/db";
import OrdersInbox from "@/components/OrdersInbox";
import { isSupabaseConfigured } from "@/lib/media";
import { getT } from "@/lib/i18n-server";
import SetupNotice from "@/components/SetupNotice";

export default async function MyOrdersPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;
  const user = await requireUser("/orders");
  const orders = await getBuyerOrders(user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          {t.orders.title}
        </h1>
        <p className="mt-2 text-[15px] text-gray-500">{t.orders.listDesc}</p>
      </div>

      <OrdersInbox orders={orders} canManage={false} />
    </div>
  );
}
