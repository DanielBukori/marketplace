"use client";
import Image from "next/image";
import Link from "next/link";
import { GraduationCap, ShoppingBag, Utensils } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import HeroSlides from "@/components/HeroSlides";
import AdStrip from "@/components/AdStrip";
import type { Ad } from "@/lib/types";

const cardShell =
  "relative overflow-hidden rounded-[32px] p-7 text-white shadow-[0_24px_50px_-24px_rgba(31,41,32,0.5)] transition-transform hover:-translate-y-1 md:p-8";

const cardBadge =
  "absolute right-5 top-5 rounded-full bg-white/25 px-3 py-1 text-[11px] font-semibold backdrop-blur";

const cardCta =
  "flex w-full items-center justify-center rounded-2xl bg-white py-4 text-[15px] font-bold shadow-sm transition hover:bg-gray-50";

export default function HomeHero({ ads = [] }: { ads?: Ad[] }) {
  const { t } = useLanguage();

  return (
    <div className="w-full bg-paper-50 [background-image:radial-gradient(120%_90%_at_50%_0%,#f7f9fc_0%,#eef4fa_55%,#d8e6f3_100%)] px-4 pb-24 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl pb-14 pt-16 text-center md:pt-24">
        <Image
          src="/iaa/iaa-logo.png"
          width={254}
          height={87}
          alt={t.home.logoAria}
          priority
          className="mx-auto h-auto w-[190px]"
        />

        <span className="mt-5 block">
          <span className="inline-block rounded-full bg-primary-100 px-4 py-2 text-xs font-semibold text-primary-800">
            {t.home.badge}
          </span>
        </span>

        <h1 className="mt-7 text-4xl font-extrabold leading-tight tracking-tight text-ink-900 md:text-5xl">
          <span className="text-primary-600">{t.home.title1}</span>{" "}
          {t.home.title2}
        </h1>

        <p className="mt-5 text-lg text-gray-500">{t.home.desc}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-primary-800 shadow-sm">
            {t.home.trust}
            <span className="text-primary-400">·</span>
            {t.home.verified}
          </span>
          <span className="inline-flex max-w-md items-center gap-2 rounded-full bg-accent-500/10 px-4 py-2 text-xs font-semibold text-accent-600">
            <GraduationCap size={14} className="shrink-0" />
            {t.home.studentNote}
          </span>
        </div>
      </section>

      <HeroSlides />

      {ads.length > 0 && (
        <div className="mt-12">
          <AdStrip ads={ads} label={t.ads.stripHome} sponsored={t.ads.sponsored} />
        </div>
      )}

      <section className="relative mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
        <Utensils
          aria-hidden
          className="pointer-events-none absolute -left-20 top-6 hidden text-accent-400/50 lg:block"
          size={70}
        />
        <ShoppingBag
          aria-hidden
          className="pointer-events-none absolute -right-20 top-28 hidden text-primary-200 lg:block"
          size={70}
        />

        <div
          className={cardShell}
          style={{
            background: "linear-gradient(160deg, #c9454a 0%, #a41e22 100%)",
          }}
        >
          <div className={cardBadge}>{t.home.foodBadge}</div>
          <Utensils size={54} className="mb-20" />
          <h2 className="text-2xl font-bold">{t.home.foodTitle}</h2>
          <p className="mb-8 mt-2 text-[15px] leading-relaxed text-white/90">
            {t.home.foodDesc}
          </p>
          <Link href="/msosi" className={cardCta}>
            <span className="text-accent-600">{t.home.foodCta}</span>
          </Link>
        </div>

        <div
          className={cardShell}
          style={{
            background: "linear-gradient(160deg, #2a6497 0%, #10497e 100%)",
          }}
        >
          <div className={cardBadge}>{t.home.verified}</div>
          <ShoppingBag size={54} className="mb-20" />
          <h2 className="text-2xl font-bold">{t.home.sokoniTitle}</h2>
          <p className="mb-8 mt-2 text-[15px] leading-relaxed text-white/90">
            {t.home.sokoniDesc}
          </p>
          <Link href="/market" className={cardCta}>
            <span className="text-primary-700">{t.home.sokoniCta}</span>
          </Link>
        </div>
      </section>

      <p className="mt-14 text-center text-[15px] font-semibold text-primary-900/40">
        {t.brand.name} {t.brand.suffix} <span className="mx-1">·</span>{" "}
        {t.home.tagline} <span className="mx-1">·</span> {t.home.campus}
      </p>
    </div>
  );
}
