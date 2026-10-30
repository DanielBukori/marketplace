"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, ImageOff } from "lucide-react";
import { mediaUrl } from "@/lib/media";
import { categoryGroup, formatTzs, type ListingCategory } from "@/lib/data";
import { useLanguage } from "@/context/LanguageContext";
import type { Listing } from "@/lib/types";

const conditionTone: Record<Listing["condition"], string> = {
  new: "bg-primary-50 text-primary-800",
  like_new: "bg-sky-50 text-sky-800",
  used: "bg-orange-50 text-orange-800",
};

export default function ProductCard({
  listing,
  widthClass = "w-full",
}: {
  listing: Listing;
  widthClass?: string;
}) {
  const { t } = useLanguage();
  const photo = mediaUrl(listing.photo_paths[0]);
  const isSold = listing.status === "sold" || listing.stock === 0;
  const group = categoryGroup(listing.category);
  /** Vyumba na huduma havina "hali" ya bidhaa iliyotumika — badala yake
   *  tunaonyesha aina yake ili kadi isemeye kitu halisi. */
  const topBadge =
    group === "goods"
      ? {
          text: t.conditions[listing.condition],
          tone: conditionTone[listing.condition],
        }
      : {
          text:
            t.categories[listing.category as ListingCategory] ??
            t.categories.services,
          tone: "bg-white/95 text-ink-900",
        };

  return (
    <article
      className={`${widthClass} shrink-0 rounded-3xl border border-black/5 bg-white p-3 shadow-[0_10px_30px_-22px_rgba(16,24,40,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-22px_rgba(16,24,40,0.45)]`}
    >
      <div className="relative">
        <div className="tile aspect-[4/5] w-full">
          {photo ? (
            <Image
              src={photo}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <ImageOff aria-hidden className="text-gray-300" size={44} />
          )}
        </div>

        <span className="absolute left-3 top-3 rounded-2xl bg-accent-500 px-3 py-1.5 text-center text-xs font-extrabold leading-tight text-white shadow-sm">
          {group === "services" && (
            <span className="block text-[10px] font-bold uppercase tracking-wide opacity-90">
              {t.market.from}
            </span>
          )}
          <span className="block">{formatTzs(listing.price)}</span>
          {group === "rooms" && (
            <span className="block text-[10px] font-bold opacity-90">
              {t.market.perMonth}
            </span>
          )}
        </span>

        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${topBadge.tone}`}
        >
          {topBadge.text}
        </span>

        {isSold && (
          <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/25">
            <span className="-rotate-6 rounded-full bg-red-500 px-4 py-1.5 text-sm font-extrabold tracking-wide text-white shadow-lg">
              {t.market.soldOut}
            </span>
          </span>
        )}
      </div>

      <div className="px-2 pb-1 pt-4">
        <h3 className="truncate text-[17px] font-bold text-ink-900">
          {listing.title}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">
            {listing.location ?? listing.business?.name}
          </span>
        </p>

        {listing.is_negotiable && (
          <p className="mt-2 inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-bold text-primary-800">
            {t.market.negotiable}
          </p>
        )}

        <Link
          href={`/product/${listing.id}`}
          className="mt-4 flex items-center justify-between rounded-2xl bg-paper-100 px-4 py-3 text-sm font-semibold text-ink-900 transition hover:bg-paper-200"
        >
          {t.market.seeDetails}
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}
