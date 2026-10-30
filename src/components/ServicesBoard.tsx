"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  Droplets,
  GraduationCap,
  Laptop,
  Plus,
  Printer,
  Scissors,
  Search,
  Shirt,
  Smartphone,
  Sparkles,
  SprayCan,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import {
  formatTzs,
  serviceCategoryIds,
  type ListingCategory,
} from "@/lib/data";
import type { Business, Listing } from "@/lib/types";

const specialtyIcons: Partial<Record<ListingCategory, LucideIcon>> = {
  phone_repair: Smartphone,
  barber: Scissors,
  tailor: Shirt,
  computer_repair: Laptop,
  electrical: Zap,
  mechanic: Wrench,
  printing: Printer,
  cleaning: SprayCan,
  laundry: Droplets,
  tutoring: GraduationCap,
  beauty: Sparkles,
  accounting: Calculator,
};

export default function ServicesBoard({
  listings,
  providers,
}: {
  listings: Listing[];
  providers: Business[];
}) {
  const { t } = useLanguage();
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const matches = (text: string) => !needle || text.toLowerCase().includes(needle);

  const filtered = listings
    .filter((l) => category === "all" || l.category === category)
    .filter(
      (l) => matches(l.title) || matches(l.description) || matches(l.location ?? ""),
    );

  const visibleProviders = providers.filter(
    (b) => matches(b.name) || matches(b.description ?? "") || matches(b.location ?? ""),
  );

  const counts = new Map<string, number>();
  for (const l of listings) counts.set(l.category, (counts.get(l.category) ?? 0) + 1);

  const cheapest =
    filtered.length > 0
      ? formatTzs(Math.min(...filtered.map((l) => l.price)))
      : null;

  return (
    <div className="space-y-9">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={20}
            className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.services.searchPlaceholder}
            className="h-16 w-full rounded-full border border-black/5 bg-white pl-14 pr-6 text-[15px] shadow-[0_10px_30px_-24px_rgba(16,24,40,0.6)] placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <Link
          href="/post"
          className="inline-flex h-16 shrink-0 items-center justify-center gap-2 rounded-full bg-accent-500 px-8 text-[15px] font-extrabold text-white shadow-[0_14px_30px_-16px_rgba(164,30,34,0.9)] transition hover:bg-accent-400"
        >
          <Plus size={18} /> {t.services.postService}
        </Link>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-700">
          {t.services.pickSpecialty}
        </p>
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`chip ${category === "all" ? "chip-active" : ""}`}
          >
            {t.categories.all}
            {listings.length > 0 && (
              <span className="ml-2 text-xs font-bold opacity-70">
                {listings.length}
              </span>
            )}
          </button>
          {serviceCategoryIds.map((id) => {
            const Icon = specialtyIcons[id];
            const count = counts.get(id) ?? 0;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={`chip flex items-center gap-2 ${category === id ? "chip-active" : ""}`}
              >
                {Icon && <Icon size={15} />}
                {t.categories[id]}
                {count > 0 && (
                  <span className="text-xs font-bold opacity-70">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {listings.length === 0 && visibleProviders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-primary-200 bg-white p-12 text-center">
          <Wrench className="mx-auto text-primary-400" size={28} />
          <p className="mt-4 text-[15px] text-gray-600">{t.services.empty}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/post"
              className="inline-flex items-center gap-2 rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900"
            >
              {t.services.postService} <ArrowRight size={15} />
            </Link>
            <Link
              href="/dashboard/business/new"
              className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-6 py-3 text-sm font-bold text-ink-900 transition hover:bg-paper-100"
            >
              {t.services.openBusiness}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
                {category === "all" ? t.services.ads : t.categories[category as ListingCategory]}
              </h2>
              {cheapest && (
                <p className="text-sm text-gray-500">
                  {fill(t.services.adsCount, { count: filtered.length })} ·{" "}
                  {fill(t.services.lowest, { price: cheapest })}
                </p>
              )}
            </div>

            {filtered.length === 0 ? (
              <p className="rounded-2xl bg-white p-8 text-center text-[15px] text-gray-500">
                {t.market.noMatches}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map((listing) => (
                  <ProductCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}

            <p className="text-sm text-gray-500">{t.services.priceNote}</p>
          </section>

          {visibleProviders.length > 0 && (
            <section className="space-y-5">
              <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
                {t.services.providers}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleProviders.map((business) => (
                  <Link
                    key={business.id}
                    href={`/duka/${business.slug}`}
                    className="rounded-[26px] border border-black/5 bg-white p-6 shadow-[0_14px_34px_-28px_rgba(16,24,40,0.8)] transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <h3 className="text-lg font-extrabold text-ink-900">
                      {business.name}
                    </h3>
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
                      {t.common.viewPage} <ArrowUpRight size={13} />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
