import Link from "next/link";
import {
  ClipboardList,
  FileText,
  LifeBuoy,
  Megaphone,
  Settings2,
  Share2,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import { getAdminStats } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import RequireAdmin from "@/components/RequireAdmin";
import SetupNotice from "@/components/SetupNotice";

export default async function AdminHomePage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;

  let stats: Awaited<ReturnType<typeof getAdminStats>> | null = null;
  try {
    stats = await getAdminStats();
  } catch {
    // Jedwali jipya bado halijaundwa kwenye Supabase; kurasa husanyika
    // mojamoja, hesabu zirudi tupu badala ya kupitisha makosa kwenye ukurasa.
    stats = null;
  }

  const tiles = [
    {
      href: "/dashboard/admin/support",
      icon: LifeBuoy,
      title: t.hub.supportTitle,
      desc: t.hub.supportDesc,
      badge: stats ? stats.openOrders : null,
      badgeLabel: t.hub.openNow,
    },
    {
      href: "/dashboard/admin/reviews",
      icon: Star,
      title: t.hub.reviewsTitle,
      desc: t.hub.reviewsDesc,
      badge: stats ? stats.reviews : null,
      badgeLabel: t.hub.all,
    },
    {
      href: "/dashboard/admin/ads",
      icon: Megaphone,
      title: t.hub.adsTitle,
      desc: t.hub.adsDesc,
      badge: stats ? stats.submittedAds : null,
      badgeLabel: t.hub.waiting,
    },
    {
      href: "/dashboard/admin/social",
      icon: Share2,
      title: t.hub.socialTitle,
      desc: t.hub.socialDesc,
    },
    {
      href: "/dashboard/admin/settings",
      icon: Settings2,
      title: t.hub.settingsTitle,
      desc: t.hub.settingsDesc,
    },
    {
      href: "/dashboard/review",
      icon: ShieldCheck,
      title: t.admin.reviewTitle,
      desc: t.hub.reviewDesc,
      badge: stats ? stats.businesses : null,
      badgeLabel: t.hub.sellers,
    },
    {
      href: "/dashboard/news",
      icon: FileText,
      title: t.admin.newsTitle,
      desc: t.hub.newsDesc,
    },
    {
      href: "/dashboard/payouts",
      icon: Wallet,
      title: t.hub.payoutsTitle,
      desc: t.hub.payoutsDesc,
      badge: stats ? stats.payouts : null,
      badgeLabel: t.hub.all,
    },
  ];

  return (
    <RequireAdmin nextPath="/dashboard/admin">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
            {t.hub.title}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-500">
            {t.hub.desc}
          </p>
        </div>

        {stats ? (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Count label={t.hub.sellers} value={stats.businesses} />
            <Count label={t.hub.items} value={stats.listings} />
            <Count label={t.hub.orders} value={stats.orders} />
            <Count label={t.hub.reviews} value={stats.reviews} />
            <Count label={t.hub.ads} value={stats.ads} />
            <Count label={t.hub.payouts} value={stats.payouts} />
          </dl>
        ) : (
          <p className="rounded-2xl bg-accent-100 px-5 py-4 text-sm font-semibold text-accent-600">
            {t.hub.schemaMissing}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.href}
                href={tile.href}
                className="group rounded-3xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 transition group-hover:bg-primary-100">
                    <Icon size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-extrabold text-ink-900">{tile.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">{tile.desc}</p>
                    {tile.badge !== undefined && tile.badge !== null && (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-paper-100 px-3 py-1 text-xs font-bold text-gray-600">
                        <ClipboardList size={12} />
                        {tile.badge} {tile.badgeLabel}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="flex items-start gap-3 rounded-3xl border border-black/5 bg-paper-100 p-5 text-xs leading-relaxed text-gray-600">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary-700" />
          <span>{t.hub.integrity}</span>
        </p>
      </div>
    </RequireAdmin>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white px-4 py-3">
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">{label}</dt>
      <dd className="mt-1 text-2xl font-extrabold text-ink-900">{value}</dd>
    </div>
  );
}
