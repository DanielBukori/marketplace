"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, UtensilsCrossed } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import { formatTzs } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import StarRating from "@/components/StarRating";
import type { MenuItem } from "@/lib/types";

/**
 * Mlisho wa chakula: vipande vyote vilivyo orodheshwa na mgahawa halisi,
 * katika gridi moja. Kadi inaonyesha jina la mgahawa, bei yake halisi na
 * kiungo cha kuagiza — hakuna kitu kilichozaa.
 */
export default function FeedBoard({ menu }: { menu: MenuItem[] }) {
  const { t } = useLanguage();
  const [term, setTerm] = useState("");
  const [slot, setSlot] = useState("");

  const slotLabel = (value: string) =>
    t.foodSlots[value as keyof typeof t.foodSlots] ?? value;

  const slots = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of menu) counts.set(item.slot, (counts.get(item.slot) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([value]) => value);
  }, [menu]);

  const results = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return menu.filter((item) => {
      if (slot && item.slot !== slot) return false;
      if (!needle) return true;
      return (
        item.name.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle) ||
        (item.business?.name ?? "").toLowerCase().includes(needle)
      );
    });
  }, [menu, slot, term]);

  if (menu.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-primary-200 bg-white p-12 text-center">
        <p className="text-[15px] leading-relaxed text-gray-600">{t.feed.empty}</p>
        <Link
          href="/dashboard/business/new"
          className="mt-5 inline-flex rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900"
        >
          {t.roles.addBusinessTile}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 basis-64">
          <span className="sr-only">{t.feed.searchPlaceholder}</span>
          <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            aria-hidden
          />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t.feed.searchPlaceholder}
            className="field pl-11"
          />
        </label>
        <p className="text-sm font-semibold text-gray-600">
          {fill(t.feed.count, { count: String(results.length) })}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSlot("")}
          aria-pressed={slot === ""}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            slot === ""
              ? "bg-primary-800 text-white"
              : "border border-gray-200 bg-white text-gray-600 hover:border-primary-200"
          }`}
        >
          {t.feed.allSlots}
        </button>
        {slots.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSlot(value)}
            aria-pressed={slot === value}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              slot === value
                ? "bg-primary-800 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:border-primary-200"
            }`}
          >
            {slotLabel(value)}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-primary-200 bg-white px-6 py-10 text-center text-sm text-gray-600">
          {t.feed.noResults}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((item) => {
            const photo = mediaUrl(item.photo_path);
            const slug = item.business?.slug;
            return (
              <li
                key={item.id}
                className="flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm"
              >
                <span className="tile relative block h-44 w-full">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-paper-100">
                      <UtensilsCrossed size={22} className="text-gray-500" aria-hidden />
                    </span>
                  )}
                </span>

                <div className="flex flex-1 flex-col gap-2 p-5">
                  <p className="text-[15px] font-extrabold text-ink-900">{item.name}</p>
                  {item.description && (
                    <p className="line-clamp-2 text-sm leading-relaxed text-gray-500">
                      {item.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="chip rounded-full bg-paper-100 px-3 py-1 font-bold">
                      {slotLabel(item.slot)}
                    </span>
                    {item.rating_count > 0 && (
                      <span className="flex items-center gap-1.5">
                        <StarRating value={item.rating_avg} size={13} />
                        <span>{item.rating_count}</span>
                      </span>
                    )}
                  </div>

                  <p className="mt-auto flex items-baseline justify-between gap-3 pt-2">
                    <span className="text-lg font-extrabold text-primary-700">
                      {formatTzs(item.price)}
                    </span>
                    <span className="min-w-0 truncate text-xs text-gray-500">
                      {fill(t.feed.bySeller, { name: item.business?.name ?? "" })}
                    </span>
                  </p>

                  <div className="flex gap-2 pt-1">
                    <Link
                      href={`/checkout?business=${encodeURIComponent(slug ?? "")}&items=${encodeURIComponent(`${item.id}:1`)}`}
                      className="flex-1 rounded-xl bg-accent-500 px-4 py-2.5 text-center text-sm font-extrabold text-white transition hover:bg-accent-400"
                    >
                      {t.feed.orderNow}
                    </Link>
                    {slug && (
                      <Link
                        href={`/duka/${slug}`}
                        aria-label={fill(t.feed.openStore, { name: item.business?.name ?? "" })}
                        className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-ink-900 transition hover:bg-paper-100"
                      >
                        {t.common.viewPage}
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
