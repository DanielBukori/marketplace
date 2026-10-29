"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Plus, Search } from "lucide-react";
import MarketCarousel from "@/components/MarketCarousel";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/context/LanguageContext";
import { browseCategoryIds, marketCategoryIds } from "@/lib/data";
import type { Listing } from "@/lib/types";

export default function MarketBoard({ listings }: { listings: Listing[] }) {
  const { t } = useLanguage();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const matchesSearch = (l: Listing) =>
    !needle ||
    l.title.toLowerCase().includes(needle) ||
    l.description.toLowerCase().includes(needle);

  const rooms = listings.filter(
    (l) => l.category === "rooms" && matchesSearch(l),
  );
  const filtered = listings
    .filter((l) => matchesSearch(l))
    .filter((l) => category === "all" || l.category === category);

  const showRooms = category === "all" && rooms.length > 0;

  return (
    <>
      <MarketCarousel />

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
            placeholder={t.market.searchPlaceholder}
            className="h-16 w-full rounded-full border border-black/5 bg-white pl-14 pr-6 text-[15px] shadow-[0_10px_30px_-24px_rgba(16,24,40,0.6)] placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <Link
          href="/post"
          className="inline-flex h-16 shrink-0 items-center justify-center gap-2 rounded-full bg-accent-500 px-8 text-[15px] font-extrabold text-white shadow-[0_14px_30px_-16px_rgba(164,30,34,0.9)] transition hover:bg-accent-400"
        >
          <Plus size={18} /> {t.nav.post}
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {marketCategoryIds.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setCategory(id)}
            className={`chip ${category === id ? "chip-active" : ""}`}
          >
            {t.categories[id]}
          </button>
        ))}
      </div>

      <section className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-700">
              {t.market.fresh}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900">
              {t.market.latest}
            </h2>
          </div>
          <Link
            href="/post"
            className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-accent-400"
          >
            <Plus size={16} /> {t.nav.post}
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-primary-200 bg-white p-12 text-center">
            <h3 className="text-xl font-extrabold text-ink-900">
              {t.market.emptyTitle}
            </h3>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-gray-500">
              {t.market.emptyDesc}
            </p>
            <Link
              href="/post"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary-800 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-primary-900"
            >
              {t.market.emptyCta} <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            {showRooms && (
              <div className="space-y-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-ink-900">
                      {t.market.roomsTitle}
                    </h3>
                    <p className="mt-1 text-[15px] text-gray-500">
                      {t.market.roomsDesc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCategory("rooms")}
                    className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-5 py-2.5 text-sm font-bold text-ink-900 shadow-sm transition hover:bg-paper-100"
                  >
                    {t.market.viewAll} <ArrowRight size={16} />
                  </button>
                </div>

                <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                  {rooms.map((room) => (
                    <ProductCard
                      key={room.id}
                      listing={room}
                      widthClass="w-[260px]"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {filtered.map((listing) => (
                <ProductCard
                  key={listing.id}
                  listing={listing}
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="rounded-2xl bg-white p-8 text-center text-[15px] text-gray-500">
                {t.market.noMatches}
              </p>
            )}

            <div className="space-y-3 pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setCategory("all");
                  setQuery("");
                }}
                className="inline-flex items-center gap-2 rounded-full bg-primary-800 px-8 py-4 text-[15px] font-bold text-white shadow-lg transition hover:bg-primary-900"
              >
                {t.market.viewAllProducts} <ArrowRight size={17} />
              </button>
              <p className="text-sm text-gray-500">
                {filtered.length} / {listings.length} {t.market.showing}
              </p>
            </div>
          </>
        )}
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">
          {t.market.browseBy}
        </h2>
        <div className="flex flex-wrap gap-3">
          {browseCategoryIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setCategory(id)}
              className="chip"
            >
              {t.categories[id]}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
