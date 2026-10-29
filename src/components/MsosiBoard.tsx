"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Search,
  Store,
  UtensilsCrossed,
  Smartphone,
  Bike,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import { formatTzsShort, menuSlotIds } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import type { Business, MenuItem } from "@/lib/types";

const stepIcons = [UtensilsCrossed, Smartphone, Bike];

export default function MsosiBoard({
  businesses,
  menu,
}: {
  businesses: Business[];
  menu: MenuItem[];
}) {
  const { t } = useLanguage();
  const [slot, setSlot] = useState("all");
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const matches = (text: string) => !needle || text.toLowerCase().includes(needle);

  const visibleMenu = menu.filter(
    (item) =>
      (slot === "all" || item.slot === slot) &&
      (matches(item.name) || matches(item.business?.name ?? "")),
  );
  const visibleVendors = businesses.filter(
    (b) => matches(b.name) || matches(b.location ?? ""),
  );

  return (
    <>
      <div className="border-b border-black/5 bg-paper-50">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              aria-label={t.msosi.back}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white text-ink-900 shadow-sm transition hover:bg-paper-100"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 md:text-[28px]">
                {t.msosi.title1}{" "}
                <span className="text-primary-600">{t.msosi.title2}</span>
              </h1>
              <p className="mt-0.5 text-[15px] text-gray-500">{t.msosi.subtitle}</p>
            </div>
          </div>

          <div className="relative mt-6">
            <Search
              size={20}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.msosi.searchPlaceholder}
              className="h-16 w-full rounded-2xl border border-black/5 bg-white pl-14 pr-6 text-[15px] shadow-[0_10px_30px_-24px_rgba(16,24,40,0.6)] placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-14 px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 rounded-[28px] border border-primary-100 bg-white p-6 md:flex-row md:items-center md:justify-between md:p-7">
          <div>
            <h2 className="text-lg font-extrabold text-ink-900">
              {t.msosi.ordersTitle}
            </h2>
            <p className="mt-0.5 text-[15px] text-gray-600">{t.msosi.ordersDesc}</p>
          </div>
          <Link
            href="/orders"
            className="shrink-0 rounded-2xl bg-primary-800 px-7 py-3.5 text-center text-sm font-bold text-white shadow-sm transition hover:bg-primary-900"
          >
            {t.links.myOrders}
          </Link>
        </div>

        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:justify-center sm:px-0">
          {menuSlotIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSlot(id)}
              aria-pressed={slot === id}
              className={`shrink-0 rounded-full border px-5 py-3 text-sm font-bold transition ${
                slot === id
                  ? "border-primary-700 bg-primary-800 text-white shadow-sm"
                  : "border-black/5 bg-white text-ink-900 shadow-[0_12px_28px_-24px_rgba(16,24,40,0.7)] hover:-translate-y-0.5"
              }`}
            >
              {t.foodSlots[id]}
            </button>
          ))}
        </div>

        <section id="menu" className="space-y-6 scroll-mt-28">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">
            {t.msosi.todayMenu}
          </h2>

          {menu.length === 0 ? (
            <EmptyState
              title={t.msosi.emptyTitle}
              desc={t.msosi.emptyDesc}
              cta={t.msosi.emptyCta}
            />
          ) : visibleMenu.length === 0 ? (
            <p className="rounded-2xl bg-white p-8 text-center text-[15px] text-gray-500">
              {t.msosi.noMatches}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleMenu.map((item) => (
                <MenuCard key={item.id} item={item} slug={item.business?.slug} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">
              {t.msosi.vendorsTitle}
            </h2>
            <p className="mt-1 text-[15px] text-gray-500">{t.msosi.vendorsDesc}</p>
          </div>

          {visibleVendors.length === 0 ? (
            <p className="rounded-2xl bg-white p-8 text-center text-[15px] text-gray-500">
              {t.msosi.noVendorsYet}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleVendors.map((b) => (
                <VendorCard key={b.id} business={b} />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-8 rounded-[28px] border border-black/5 bg-white p-8 shadow-[0_18px_40px_-30px_rgba(16,24,40,0.6)] md:flex-row md:items-center md:justify-between md:p-10">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-accent-100 px-4 py-1.5 text-xs font-bold text-accent-600">
              {t.msosi.partnerPill}
            </span>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink-900 md:text-3xl">
              {t.msosi.partnerTitle}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
              {t.msosi.partnerDesc}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-5">
            <span className="flex h-24 w-24 items-center justify-center rounded-[26px] bg-primary-50">
              <Store size={40} className="text-primary-700" />
            </span>
            <Link
              href="/dashboard/business/new"
              className="rounded-2xl bg-accent-500 px-7 py-4 text-[15px] font-extrabold text-white shadow-[0_14px_30px_-16px_rgba(164,30,34,0.9)] transition hover:bg-accent-400"
            >
              {t.msosi.partnerCta}
            </Link>
          </div>
        </section>

        <section className="space-y-7">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">
              {t.msosi.howTitle}
            </h2>
            <p className="mt-1 text-[15px] text-gray-500">{t.msosi.howDesc}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {t.msosi.steps.map((step, i) => {
              const Icon = stepIcons[i] ?? UtensilsCrossed;
              return (
                <div
                  key={step.title}
                  className="relative overflow-hidden rounded-[26px] border border-black/5 bg-white p-7 shadow-[0_14px_34px_-28px_rgba(16,24,40,0.8)]"
                >
                  <span className="absolute right-5 top-3 text-6xl font-extrabold text-gray-100">
                    {i + 1}
                  </span>
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
                    <Icon size={24} className="text-primary-700" />
                  </span>
                  <h3 className="relative mt-6 text-lg font-extrabold text-ink-900">
                    {step.title}
                  </h3>
                  <p className="relative mt-2 text-[15px] leading-relaxed text-gray-500">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}

function EmptyState({
  title,
  desc,
  cta,
}: {
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-primary-200 bg-white p-12 text-center">
      <h3 className="text-xl font-extrabold text-ink-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-gray-500">
        {desc}
      </p>
      <Link
        href="/dashboard/business/new"
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary-800 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-primary-900"
      >
        {cta} <ChevronRight size={16} />
      </Link>
    </div>
  );
}

function MenuCard({ item, slug }: { item: MenuItem; slug?: string }) {
  const { t } = useLanguage();
  const photo = mediaUrl(item.photo_path);
  const href = slug ? `/msosi/${slug}` : "#menu";

  return (
    <article className="overflow-hidden rounded-[26px] border border-black/5 bg-white shadow-[0_14px_34px_-28px_rgba(16,24,40,0.8)] transition hover:-translate-y-0.5">
      <div className="tile relative aspect-[16/10] w-full rounded-none">
        {photo && (
          <Image
            src={photo}
            alt={item.name}
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover"
          />
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-extrabold text-ink-900">{item.name}</h3>
        <p className="mt-1 text-sm text-gray-500">{item.business?.name}</p>
        {item.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
            {item.description}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-lg font-extrabold text-primary-700">
            {formatTzsShort(item.price)}
          </span>
          <Link
            href={href}
            aria-label={fill(t.msosi.orderAria, { name: item.name })}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-700 text-white transition hover:bg-primary-800"
          >
            <Plus size={20} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function VendorCard({ business }: { business: Business }) {
  const logo = mediaUrl(business.logo_path);

  return (
    <Link
      href={`/msosi/${business.slug}`}
      className="flex items-center gap-4 rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_14px_34px_-28px_rgba(16,24,40,0.8)] transition hover:-translate-y-0.5 hover:border-primary-200"
    >
      <span className="tile flex h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
        {logo ? (
          <Image src={logo} alt={business.name} fill sizes="64px" className="object-cover" />
        ) : (
          <Store aria-hidden size={26} className="text-primary-200" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[17px] font-extrabold text-ink-900">
          {business.name}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-gray-500">
          <MapPin size={13} className="shrink-0" />
          {business.location ?? "—"}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-gray-500">
          <Clock size={13} className="shrink-0" />
          {business.opening_hours ?? "—"}
        </span>
      </span>
      <ChevronRight size={20} className="shrink-0 text-primary-700" />
    </Link>
  );
}
