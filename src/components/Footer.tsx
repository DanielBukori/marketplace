"use client";
import Link from "next/link";
import { Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  const columns = [
    {
      title: t.footer.colMarketplace,
      links: [
        { label: t.links.usedItems, href: "/market" },
        { label: t.links.roomsGhetto, href: "/market" },
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
