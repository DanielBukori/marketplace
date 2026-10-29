import Link from "next/link";
import { Plus, Store, Package, ClipboardList, Megaphone, ShieldCheck, Wallet } from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { getMyBusinesses, getProfile } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/media";
import { formatTzs } from "@/lib/data";
import { getT } from "@/lib/i18n-server";
import SetupNotice from "@/components/SetupNotice";

export default async function DashboardPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;
  const user = await requireUser("/dashboard");
  const businesses = await getMyBusinesses(user.id);
  const profile = await getProfile(user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
            {t.dashboard.title}
          </h1>
          <p className="mt-2 text-[15px] text-gray-500">
            {user.email}
          </p>
        </div>
        <Link
          href="/post"
          className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-accent-400"
        >
          <Plus size={16} /> {t.nav.post}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Store} label={t.dashboard.statBusinesses} value={businesses.length} />
        <Stat icon={Package} label={t.dashboard.statListings} value="—" href="/dashboard/listings" />
        <Stat icon={ClipboardList} label={t.dashboard.statOrders} value="—" href="/dashboard/orders" />
        <Stat icon={Wallet} label={t.dashboard.payouts} value="—" href="/dashboard/payouts" />
        {profile?.is_admin && (
          <>
            <Stat icon={ShieldCheck} label={t.dashboard.statReview} value="—" href="/dashboard/review" />
            <Stat icon={Megaphone} label={t.dashboard.statNews} value="—" href="/dashboard/news" />
          </>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
          {t.dashboard.yourBusinesses}
        </h2>

        {businesses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-primary-200 bg-white p-10 text-center">
            <p className="text-[15px] text-gray-600">{t.business.noBusiness}</p>
            <Link
              href="/dashboard/business/new"
              className="mt-5 inline-flex rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900"
            >
              {t.dashboard.openBusiness}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {businesses.map((b) => (
              <Link
                key={b.id}
                href={`/dashboard/business/${b.id}`}
                className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-lg font-extrabold text-ink-900">{b.name}</p>
                <p className="mt-1 text-sm text-gray-500">{b.location ?? "—"}</p>
                <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary-700">
                  {b.kind}
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      b.is_active
                        ? "bg-primary-100 text-primary-800"
                        : "bg-paper-100 text-gray-500"
                    }`}
                  >
                    {b.is_active ? t.dashboard.live : t.dashboard.off}
                  </span>
                  {b.is_verified && (
                    <span className="rounded-full bg-accent-100 px-2 py-0.5 text-accent-600">
                      Verified
                    </span>
                  )}
                </p>
                {b.delivery_fee > 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    Delivery {formatTzs(b.delivery_fee)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string | number;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-4 rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
        <Icon size={22} />
      </span>
      <div>
        <p className="text-2xl font-extrabold text-ink-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
