import Link from "next/link";
import { ChevronRight, Store } from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { getBuyerOrders, getMyBusinesses, getProfile } from "@/lib/db";
import { getRoles } from "@/lib/roles";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import { fill } from "@/lib/i18n";
import { noIndexMeta } from "@/lib/seo";
import SetupNotice from "@/components/SetupNotice";
import ProfileEditor from "@/components/ProfileEditor";
import LangToggle from "@/components/LangToggle";

export async function generateMetadata() {
  const t = await getT();
  return {
    ...noIndexMeta,
    title: `${t.profile.title} · ${t.brand.name} ${t.brand.suffix}`,
  };
}

export default async function ProfilePage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;

  const user = await requireUser("/profile");
  const [profile, roles, businesses, orders] = await Promise.all([
    getProfile(user.id),
    getRoles(user.id),
    getMyBusinesses(user.id),
    getBuyerOrders(user.id),
  ]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-[15px] text-gray-600">{t.profile.notSignedIn}</p>
      </div>
    );
  }

  const courierNote = roles.isCourier
    ? t.courier.approved
    : roles.courierStatus === "pending"
      ? t.courier.pending
      : roles.courierStatus === "rejected"
        ? t.courier.rejected
        : t.courier.none;

  const held = [
    t.roles.buyer,
    ...(roles.isSeller ? [t.roles.seller] : []),
    ...(roles.isCourier ? [t.roles.courier] : []),
    ...(roles.isAdmin ? [t.roles.admin] : []),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          {t.profile.title}
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-500">
          {t.profile.desc}
        </p>
      </div>

      <dl className="rounded-3xl border border-black/5 bg-white px-6 py-5 shadow-sm">
        <dt className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
          {t.profile.emailLabel}
        </dt>
        <dd className="mt-1 break-words text-[15px] font-semibold text-ink-900">
          {user.email}
        </dd>
        {profile.created_at && (
          <dd className="mt-2 text-xs text-gray-500">
            {fill(t.profile.member, {
              date: new Date(profile.created_at).toLocaleDateString(t.localeDate),
            })}
          </dd>
        )}
      </dl>

      <ProfileEditor profile={profile} />

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
          {t.profile.rolesTitle}
        </h2>
        <div className="flex flex-wrap gap-2">
          {held.map((role) => (
            <span
              key={role}
              className="chip rounded-full bg-primary-50 px-4 py-2 text-sm font-bold text-primary-800"
            >
              {role}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink-900">{t.profile.courierStatus}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">{courierNote}</p>
          </div>
          <Link
            href="/dashboard/courier"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-primary-700 hover:text-primary-900"
          >
            {t.nav.courierWork} <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
          {t.profile.businessesTitle}
        </h2>

        {businesses.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-primary-200 bg-white px-6 py-6 text-center text-sm leading-relaxed text-gray-600">
            {t.profile.noBusinesses}
          </p>
        ) : (
          <ul className="space-y-2">
            {businesses.map((business) => (
              <li key={business.id}>
                <Link
                  href={`/dashboard/business/${business.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white px-5 py-4 transition hover:border-primary-200"
                >
                  <Store size={18} className="shrink-0 text-primary-700" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold text-ink-900">
                      {business.name}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {business.location ?? "—"}
                    </span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-gray-500" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
          {t.profile.ordersTitle}
        </h2>
        <Link
          href="/orders"
          className="flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white px-5 py-4 transition hover:border-primary-200"
        >
          <span className="text-sm text-gray-600">
            {orders.length > 0
              ? fill(t.profile.ordersCount, { count: String(orders.length) })
              : t.profile.ordersEmpty}
          </span>
          <ChevronRight size={16} className="shrink-0 text-gray-500" />
        </Link>
      </section>

      <section className="space-y-3 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold tracking-tight text-ink-900">
          {t.profile.languageTitle}
        </h2>
        <p className="text-sm leading-relaxed text-gray-500">{t.profile.languageDesc}</p>
        <LangToggle />
      </section>
    </div>
  );
}
