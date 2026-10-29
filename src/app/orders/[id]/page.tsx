import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { getOrderDetail } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import { isSnippeConfigured } from "@/lib/snippe";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import SetupNotice from "@/components/SetupNotice";
import OrderDetail from "@/components/OrderDetail";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;

  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser(`/orders/${encodeURIComponent(id)}`);

  const order = await getOrderDetail(id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm font-bold text-primary-700 hover:text-primary-900"
      >
        <ArrowLeft size={16} /> {t.orders.backToList}
      </Link>

      <OrderDetail
        order={order}
        isBuyer={order.buyer_id === user.id}
        justPlaced={query.placed === "1"}
        mobileMoneyReady={isSnippeConfigured && isAdminClientConfigured}
      />

      <p className="text-xs leading-relaxed text-gray-500">{t.orders.integrityNote}</p>
    </div>
  );
}
