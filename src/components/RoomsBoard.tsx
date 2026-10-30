"use client";
import Link from "next/link";
import { useState } from "react";
import { BedDouble, Home, Plus, Search } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import type { Listing } from "@/lib/types";

export default function RoomsBoard({ listings }: { listings: Listing[] }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const filtered = listings.filter(
    (l) =>
      !needle ||
      l.title.toLowerCase().includes(needle) ||
      l.description.toLowerCase().includes(needle) ||
      (l.location ?? "").toLowerCase().includes(needle),
  );

  return (
    <div className="space-y-8">
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
            placeholder={t.rooms.searchPlaceholder}
            className="h-16 w-full rounded-full border border-black/5 bg-white pl-14 pr-6 text-[15px] shadow-[0_10px_30px_-24px_rgba(16,24,40,0.6)] placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <Link
          href="/post"
          className="inline-flex h-16 shrink-0 items-center justify-center gap-2 rounded-full bg-accent-500 px-8 text-[15px] font-extrabold text-white shadow-[0_14px_30px_-16px_rgba(164,30,34,0.9)] transition hover:bg-accent-400"
        >
          <Plus size={18} /> {t.rooms.emptyCta}
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-primary-200 bg-white p-12 text-center">
          <BedDouble className="mx-auto text-primary-400" size={30} />
          <p className="mt-4 text-[15px] text-gray-600">{t.rooms.empty}</p>
          <Link
            href="/post"
            className="mt-5 inline-flex rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900"
          >
            {t.rooms.emptyCta}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {filtered.map((listing) => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="rounded-2xl bg-white p-8 text-center text-[15px] text-gray-500">
              {t.market.noMatches}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-sm text-gray-500">
            <Home size={15} className="text-primary-700" />
            <span>{fill(t.rooms.count, { count: filtered.length })}</span>
            <span aria-hidden>·</span>
            <span>{t.rooms.hint}</span>
          </div>
        </>
      )}
    </div>
  );
}
