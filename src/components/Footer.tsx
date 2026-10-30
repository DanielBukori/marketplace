"use client";
import type { CSSProperties } from "react";
import Link from "next/link";
import { Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import BrandIcon, { brandHex, platformLabel } from "@/components/BrandIcon";
import type { SocialLink } from "@/lib/types";

export default function Footer({
  links = [],
  support = {},
}: {
  links?: SocialLink[];
  support?: Record<string, string>;
}) {
  const { t } = useLanguage();

  const contacts = [
    support.support_phone
      ? { label: t.footer.callUs, value: support.support_phone, href: `tel:${support.support_phone}` }
      : null,
    support.support_whatsapp
      ? {
          label: t.footer.whatsappUs,
          value: support.support_whatsapp,
          href: `https://wa.me/${support.support_whatsapp.replace(/[^0-9]/g, "")}`,
        }
      : null,
    support.support_email
      ? { label: t.footer.emailUs, value: support.support_email, href: `mailto:${support.support_email}` }
      : null,
  ].filter((c): c is { label: string; value: string; href: string } => c !== null);

  const columns = [
    {
      title: t.footer.colMarketplace,
      links: [
        { label: t.links.usedItems, href: "/market" },
        { label: t.links.roomsGhetto, href: "/vyumba" },
        { label: t.links.postAd, href: "/post" },
      ],
    },
    {
      title: t.footer.colSellers,
      links: [
        { label: t.links.myBusiness, href: "/dashboard" },
        { label: t.links.sellFood, href: "/dashboard/business/new" },
        { label: t.links.myOrders, href: "/orders" },
      ],
    },
    {
      title: t.footer.colFood,
      links: [
        { label: t.links.cafeteriaMenus, href: "/msosi" },
        { label: t.links.orderFood, href: "/msosi" },
        { label: t.links.serviceMall, href: "/services" },
        { label: t.links.news, href: "/news" },
      ],
    },
  ];

  return (
    <footer className="border-t border-black/5 bg-paper-100">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div className="max-w-sm">
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-ink-900">
            {t.brand.name} <span className="text-primary-600">{t.brand.suffix}</span>
          </Link>
          <p className="mt-4 text-[15px] leading-relaxed text-gray-500">
            {t.footer.blurb}
          </p>
          <a
            href="https://iaa.ac.tz"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-900"
          >
            <Globe size={17} /> iaa.ac.tz
          </a>

          {contacts.length > 0 && (
            <ul className="mt-6 space-y-2 text-sm">
              {contacts.map((c) => (
                <li key={c.href} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold text-ink-900">{c.label}:</span>
                  <a
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="text-gray-500 transition hover:text-primary-700"
                  >
                    {c.value}
                  </a>
                </li>
              ))}
              {support.service_hours && (
                <li className="text-gray-400">{support.service_hours}</li>
              )}
            </ul>
          )}

          {links.length > 0 && (
            <div className="mt-7">
              <h5 className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                {t.footer.followUs}
              </h5>
              <ul className="mt-3 flex flex-wrap gap-2.5">
                {links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer me nofollow"
                      aria-label={link.label || platformLabel(link.platform)}
                      title={link.label || platformLabel(link.platform)}
                      style={{ "--brand": brandHex(link.platform) } as CSSProperties}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/5 bg-white text-gray-500 transition duration-200 hover:-translate-y-0.5 hover:bg-(--brand) hover:text-white hover:shadow-lg hover:shadow-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand) active:translate-y-0 sm:h-12 sm:w-12"
                    >
                      <BrandIcon platform={link.platform} size={21} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-[0.14em] text-ink-900">
              {column.title}
            </h4>
            <ul className="space-y-4 text-[15px] text-gray-500">
              {column.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="transition hover:text-primary-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 pb-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} {t.brand.name} {t.brand.suffix}.{" "}
          {t.footer.rights}
        </p>

        <div className="flex flex-wrap items-center gap-7 text-sm text-gray-500">
          <Link href="/privacy" className="hover:text-ink-900">
            {t.footer.privacy}
          </Link>
          <Link href="/terms" className="hover:text-ink-900">
            {t.footer.terms}
          </Link>
        </div>
      </div>
    </footer>
  );
}
