import { getAllOrders, type OrderFilter } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import RequireAdmin from "@/components/RequireAdmin";
import SetupNotice from "@/components/SetupNotice";
import SupportConsole from "@/components/SupportConsole";

const FILTERS: OrderFilter[] = [
  "all",
  "open",
  "paid",
  "unpaid",
  "completed",
  "cancelled",
];

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;

  const query = await searchParams;
  const filter: OrderFilter = FILTERS.includes(query.filter as OrderFilter)
    ? (query.filter as OrderFilter)
    : "all";
  const search = String(query.q ?? "").slice(0, 60);

  let orders: Awaited<ReturnType<typeof getAllOrders>> = [];
  let loadError: string | null = null;
  try {
    orders = await getAllOrders(filter, search);
  } catch (error) {
    loadError = error instanceof Error ? error.message : String(error);
  }

  return (
    <RequireAdmin nextPath="/dashboard/admin/support">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
            {t.support.title}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-500">
            {t.support.desc}
          </p>
        </div>

        {loadError && (
          <p className="rounded-2xl bg-accent-100 px-5 py-4 text-sm font-semibold text-accent-600">
            {loadError}
          </p>
        )}

        <SupportConsole orders={orders} filter={filter} search={search} />
      </div>
    </RequireAdmin>
  );
}
