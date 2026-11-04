import Link from "next/link";
import {
  ChevronRight,
  ClipboardList,
  FileText,
  Megaphone,
  Package,
  Percent,
  Plus,
  Settings2,
  ShieldCheck,
  Store,
  Truck,
  User,
  Wallet,
  MapPin,
} from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { getRoles } from "@/lib/roles";
import { getMyBusinesses } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/media";
import { formatTzs } from "@/lib/data";
import { getT } from "@/lib/i18n-server";
import SetupNotice from "@/components/SetupNotice";

type Tile = {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  href: string;
};

export default async function DashboardPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;
  const user = await requireUser("/dashboard");

  // Kila rol huona vitu vyake tu. Mnunuzi si rol inayobadilishwa — kila
  // aliyeingia nunua, kwa hivyo njia za kununua zipo kwa wote.
  const [roles, businesses] = await Promise.all([getRoles(user.id), getMyBusinesses(user.id)]);

  const held = [
    { label: t.roles.buyer, desc: t.roles.buyerDesc },
    ...(roles.isSeller ? [{ label: t.roles.seller, desc: t.roles.sellerDesc }] : []),
    ...(roles.isCourier ? [{ label: t.roles.courier, desc: t.roles.courierDesc }] : []),
    ...(roles.isAdmin ? [{ label: t.roles.admin, desc: t.roles.adminDesc }] : []),
  ];

  const tiles: Tile[] = [
    { icon: ClipboardList, label: t.roles.buyerTile, href: "/orders" },
    { icon: User, label: t.roles.profileTile, href: "/profile" },
    ...(roles.isSeller
      ? ([
          { icon: ClipboardList, label: t.dashboard.statOrders, href: "/dashboard/orders" },
          { icon: Package, label: t.dashboard.statListings, href: "/dashboard/listings" },
          { icon: Wallet, label: t.dashboard.payouts, href: "/dashboard/payouts" },
          { icon: Percent, label: t.dashboard.statOffers, href: "/dashboard/offers" },
          { icon: Megaphone, label: t.dashboard.statAds, href: "/dashboard/ads" },
        ] satisfies Tile[])
      : []),
    { icon: Store, label: t.roles.addBusinessTile, href: "/dashboard/business/new" },
    ...(roles.isCourier
      ? [{ icon: Truck, label: t.roles.courierTile, href: "/dashboard/courier" }]
      : []),
    ...(roles.isAdmin
      ? ([
          { icon: Settings2, label: t.dashboard.statAdmin, href: "/dashboard/admin" },
          { icon: MapPin, label: t.roles.zonesTile, href: "/dashboard/zones" },
          { icon: Truck, label: t.roles.courierRequestsTile, href: "/dashboard/couriers" },
          { icon: ShieldCheck, label: t.dashboard.statReview, href: "/dashboard/review" },
          { icon: FileText, label: t.dashboard.statNews, href: "/dashboard/news" },
        ] satisfies Tile[])
      : []),
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
            {t.roles.yourHub}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-500">
            {t.roles.hubIntro}
          </p>
        </div>
        <Link
          href="/post"
          className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-accent-400"
        >
          <Plus size={16} /> {t.nav.post}
        </Link>
      </div>

      <section className="flex flex-wrap gap-3" aria-label={t.roles.yourHub}>
        {held.map((role) => (
          <div
            key={role.label}
            className="min-w-0 flex-1 rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-sm"
          >
            <p className="text-sm font-extrabold uppercase tracking-wide text-primary-800">
              {role.label}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">{role.desc}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <TileLink key={tile.href + tile.label} {...tile} />
        ))}
      </div>

      {!roles.isSeller && !roles.isCourier && !roles.isAdmin && (
        <p className="rounded-3xl border border-dashed border-primary-200 bg-white px-6 py-5 text-center text-sm leading-relaxed text-gray-600">
          {t.roles.noRoleNote}
        </p>
      )}

      {roles.isSeller && (
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
                        {t.msosi.verifiedShort}
                      </span>
                    )}
                  </p>
                  {b.delivery_fee > 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      {t.checkout.fee} {formatTzs(b.delivery_fee)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function TileLink({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-3xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
        <Icon size={22} />
      </span>
      <p className="min-w-0 flex-1 text-[15px] font-extrabold text-ink-900">{label}</p>
      <ChevronRight size={18} className="shrink-0 text-gray-600" />
    </Link>
  );
}
