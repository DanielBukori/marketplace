"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, Clock, MapPin, Minus, Plus } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import { formatTzs } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import BusinessLogo from "@/components/BusinessLogo";
import type { Business, Listing, MenuItem } from "@/lib/types";

export default function Storefront({
  business,
  menu,
  listings,
}: {
  business: Business;
  menu: MenuItem[];
  listings: Listing[];
}) {
  const { t } = useLanguage();
  const [cart, setCart] = useState<Record<string, number>>({});

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const item = menu.find((m) => m.id === id);
          return item ? { item, qty } : null;
        })
        .filter((line): line is { item: MenuItem; qty: number } => line !== null),
    [cart, menu],
  );

  const itemsTotal = lines.reduce((sum, l) => sum + l.item.price * l.qty, 0);
  const fee = business.delivery_fee;
  const total = itemsTotal + (lines.length > 0 ? fee : 0);
  const cover = mediaUrl(business.cover_path);

  function step(id: string, delta: number) {
    setCart((current) => {
      const next = (current[id] ?? 0) + delta;
      const copy = { ...current };
      if (next <= 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  }

  const checkoutHref = `/checkout?${new URLSearchParams({
    business: business.slug,
    items: lines.map((l) => `${l.item.id}:${l.qty}`).join(","),
  }).toString()}`;

  const grouped = menu.reduce<Record<string, MenuItem[]>>((acc, item) => {
    acc[item.slot] = acc[item.slot] ?? [];
    acc[item.slot].push(item);
    return acc;
  }, {});

  const slotNames = new Map<string, string>(Object.entries(t.foodSlots));
  const itemCount: number = lines.reduce((sum, l) => sum + l.qty, 0);

  return (
    <div className="pb-32">
      <div className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/msosi"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-700"
          >
            <ArrowLeft size={16} /> {t.storefront.backToVendors}
          </Link>

          {cover && (
            <div className="relative mt-6 h-40 w-full overflow-hidden rounded-[26px] sm:h-52">
              <Image
                src={cover}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="mt-6 flex items-start gap-5">
            <BusinessLogo
              name={business.name}
              logoPath={business.logo_path}
              className="h-20 w-20"
              sizes="80px"
              textClass="text-xl"
            />

            <div>
              <h1 className="flex flex-wrap items-center gap-2 text-3xl font-extrabold tracking-tight text-ink-900">
                {business.name}
                {business.is_verified && (
                  <span
                    title={t.product.sellerVerified}
                    className="flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary-700"
                  >
                    <BadgeCheck aria-hidden size={14} />
                    {t.msosi.verifiedShort}
                  </span>
                )}
              </h1>
              <div className="mt-2 space-y-1 text-[15px] text-gray-500">
                {business.location && (
                  <p className="flex items-center gap-2">
                    <MapPin size={15} /> {business.location}
                  </p>
                )}
                {business.opening_hours && (
                  <p className="flex items-center gap-2">
                    <Clock size={15} /> {business.opening_hours}
                  </p>
                )}
                {business.delivery_fee > 0 && (
                  <p>
                    {fill(t.storefront.deliveryFee, {
                      fee: formatTzs(business.delivery_fee),
                    })}
                  </p>
                )}
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-600">
                {t.product.sellerAbout}
              </p>
              <p className="mt-1 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-gray-600">
                {business.description || t.product.sellerNoAbout}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-12 px-4 pt-10 sm:px-6 lg:px-8">
        {menu.length === 0 && listings.length === 0 && (
          <p className="rounded-3xl border border-dashed border-primary-200 bg-white p-12 text-center text-[15px] text-gray-500">
            {fill(t.storefront.empty, { name: business.name })}
          </p>
        )}

        {Object.entries(grouped).map(([slot, items]) => (
          <section key={slot} className="space-y-4">
            <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
              {slotNames.get(slot) ?? slot}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((item) => {
                const photo = mediaUrl(item.photo_path);
                const qty = cart[item.id] ?? 0;

                return (
                  <article
                    key={item.id}
                    className="flex gap-4 rounded-3xl border border-black/5 bg-white p-4 shadow-sm"
                  >
                    <div className="tile relative h-20 w-20 shrink-0 rounded-2xl">
                      {photo && (
                        <Image
                          src={photo}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink-900">{item.name}</p>
                      {item.description && (
                        <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="font-extrabold text-primary-700">
                          {formatTzs(item.price)}
                        </span>

                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={() => step(item.id, 1)}
                            aria-label={fill(t.storefront.addAria, { name: item.name })}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-700 text-white transition hover:bg-primary-800"
                          >
                            <Plus size={18} />
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => step(item.id, -1)}
                              aria-label={t.storefront.decrease}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-white text-ink-900 transition hover:bg-paper-100"
                            >
                              <Minus size={18} />
                            </button>
                            <span className="w-6 text-center font-bold text-ink-900">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => step(item.id, 1)}
                              aria-label={t.storefront.increase}
                              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-700 text-white transition hover:bg-primary-800"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        {listings.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
              {t.storefront.goods}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => {
                const photo = mediaUrl(listing.photo_paths[0]);
                return (
                  <Link
                    key={listing.id}
                    href={`/product/${listing.id}`}
                    className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="tile relative block aspect-[4/3] w-full rounded-none">
                      {photo && (
                        <Image
                          src={photo}
                          alt={listing.title}
                          fill
                          sizes="(max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="block p-4">
                      <span className="block truncate font-bold text-ink-900">
                        {listing.title}
                      </span>
                      <span className="mt-1 block text-sm font-extrabold text-primary-700">
                        {formatTzs(listing.price)}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {lines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-sm text-gray-500">
                {fill(t.storefront.itemsCount, { count: itemCount })}
              </p>
              <p className="text-lg font-extrabold text-ink-900">
                {formatTzs(total)}
                {fee > 0 && (
                  <span className="ml-2 text-xs font-medium text-gray-500">
                    ({fill(t.storefront.feeIncluded, { fee: formatTzs(fee) })})
                  </span>
                )}
              </p>
            </div>
            <Link
              href={checkoutHref}
              className="rounded-2xl bg-accent-500 px-7 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-accent-400"
            >
              {t.storefront.order}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
