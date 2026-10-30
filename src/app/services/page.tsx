import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";
import { getActiveBusinesses, getActiveListings } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/media";
import { formatTzs } from "@/lib/data";
import { fill } from "@/lib/i18n";
import { getT } from "@/lib/i18n-server";
import ProductCard from "@/components/ProductCard";
import SetupNotice from "@/components/SetupNotice";

export default async function ServicesPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;

  const [providers, listings] = await Promise.all([
    getActiveBusinesses("service"),
    getActiveListings("services"),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-700">
        {t.services.eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 md:text-4xl">
        {t.services.title}
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-gray-500">
        {t.services.desc}
      </p>

      {providers.length === 0 && listings.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-primary-200 bg-white p-12 text-center">
          <Wrench className="mx-auto text-primary-400" size={28} />
          <p className="mt-4 text-[15px] text-gray-600">{t.services.empty}</p>
          <Link
            href="/dashboard/business/new"
            className="mt-5 inline-flex rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900"
          >
            {t.services.openBusiness}
          </Link>
        </div>
      ) : (
        <>
          {providers.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
                {t.services.providers}
              </h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {providers.map((business) => (
                  <Link
                    key={business.id}
                    href={`/msosi/${business.slug}`}
                    className="rounded-[26px] border border-black/5 bg-white p-6 shadow-[0_14px_34px_-28px_rgba(16,24,40,0.8)] transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <h3 className="text-lg font-extrabold text-ink-900">{business.name}</h3>
                    {business.description && (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-500">
                        {business.description}
                      </p>
                    )}
                    <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                      {business.location && <span>{business.location}</span>}
                      {business.phone && <span>{business.phone}</span>}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-primary-700">
                      {t.common.viewPage} <ArrowRight size={13} />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {listings.length > 0 && (
            <section className="mt-14">
              <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
                {t.services.ads}
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                {listings.map((listing) => (
                  <ProductCard key={listing.id} listing={listing} />
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-500">
                {fill(t.services.adsCount, { count: listings.length })} ·{" "}
                {fill(t.services.lowest, {
                  price: formatTzs(
                    Math.min(...listings.map((listing) => listing.price)),
                  ),
                })}
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
