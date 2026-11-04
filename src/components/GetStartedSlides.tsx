"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Check,
  ShoppingBag,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import type { Dict } from "@/lib/translations";

type Slide = Dict["getStarted"]["slides"][number];

/** Picha hizi ni za choni — zinazotumika kwenye utangulizi ni zile zile. */
const ART = [
  { src: "/iaa/campus-main.png", icon: UtensilsCrossed },
  { src: "/iaa/campus-block.png", icon: ShoppingBag },
  { src: "/iaa/iaa-crest.png", icon: Store },
  { src: "/iaa/iaa-logo.png", icon: Bike },
];

export default function GetStartedSlides({ slides }: { slides: Slide[] }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const total = slides.length;

  function go(next: number) {
    setIndex(Math.min(total - 1, Math.max(0, next)));
  }

  // Michakato ya kibodi hufanya kazi ukanda wa utangulizi unapopokelewa
  // focus — hivyo mtu anayevuia kibodi anasogea bila njia ya panya.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement) {
        const scoped = event.target.closest("[data-carousel]");
        if (!scoped) return;
      }
      if (event.key === "ArrowRight") setIndex((i) => Math.min(total - 1, i + 1));
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  const slide = slides[index];
  const art = ART[index] ?? ART[0];
  const Icon = art.icon;
  const isLast = index === total - 1;
  const stepsText = fill(t.getStarted.stepsLabel, {
    current: String(index + 1),
    total: String(total),
  });

  return (
    <div className="space-y-8">
      <section
        data-carousel
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label={t.getStarted.title}
        className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <div className="grid gap-0 md:grid-cols-2">
          <div className="relative min-h-56 overflow-hidden bg-primary-900">
            <Image
              key={art.src}
              src={art.src}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="animate-kenburns object-cover opacity-70"
            />
            <span className="absolute inset-0 bg-gradient-to-tr from-primary-900/80 via-primary-800/40 to-transparent" />
            <span className="animate-pop-in absolute bottom-5 left-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95 text-primary-800 shadow-lg">
              <Icon size={24} aria-hidden />
            </span>
          </div>

          <div key={slide.title} className="space-y-4 p-6 md:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-600">
              {slide.kicker}
            </p>
            <h2 className="animate-rise font-display text-2xl font-extrabold leading-tight text-ink-900">
              {slide.title}
            </h2>
            <p className="animate-rise text-[15px] leading-relaxed text-gray-600" style={{ animationDelay: "90ms" }}>
              {slide.body}
            </p>
            <ul className="animate-rise space-y-2" style={{ animationDelay: "180ms" }}>
              {slide.points.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <Check size={16} className="mt-0.5 shrink-0 text-primary-700" aria-hidden />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
          {stepsText}
        </p>

        <div className="flex items-center gap-2" role="group" aria-label={stepsText}>
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label={t.getStarted.prev}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-ink-900 transition hover:bg-paper-100 disabled:opacity-40"
          >
            <ArrowLeft size={17} />
          </button>

          <div className="flex items-center gap-2">
            {slides.map((item, i) => (
              <button
                key={item.kicker}
                type="button"
                onClick={() => go(i)}
                aria-label={fill(t.getStarted.slideDots, { n: String(i + 1) })}
                aria-current={i === index}
                className={`h-2.5 rounded-full transition-all ${
                  i === index ? "w-7 bg-primary-800" : "w-2.5 bg-gray-200 hover:bg-primary-200"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={isLast}
            aria-label={t.getStarted.next}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-800 text-white transition hover:bg-primary-900 disabled:opacity-40"
          >
            <ArrowRight size={17} />
          </button>
        </div>
      </div>

      <section className="space-y-5 rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
            {t.getStarted.finishTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{t.getStarted.subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-full bg-accent-500 px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-accent-400"
          >
            {t.getStarted.signInCta}
          </Link>
          <Link
            href="/market"
            className="rounded-full border border-primary-200 bg-white px-6 py-3.5 text-sm font-bold text-primary-800 transition hover:bg-primary-50"
          >
            {t.getStarted.exploreCta}
          </Link>
        </div>

        <div className="space-y-2 rounded-2xl bg-paper-100 p-5">
          <p className="text-sm font-extrabold text-ink-900">{t.getStarted.whatYouNeed}</p>
          <ul className="space-y-1.5 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <Check size={15} className="mt-0.5 shrink-0 text-primary-700" aria-hidden />
              {t.getStarted.needEmail}
            </li>
            <li className="flex items-start gap-2">
              <Check size={15} className="mt-0.5 shrink-0 text-primary-700" aria-hidden />
              {t.getStarted.needPhone}
            </li>
            <li className="flex items-start gap-2">
              <Check size={15} className="mt-0.5 shrink-0 text-primary-700" aria-hidden />
              {t.getStarted.needBusiness}
            </li>
          </ul>
        </div>

        <p className="text-xs leading-relaxed text-gray-500">{t.getStarted.noPasswordNote}</p>
      </section>
    </div>
  );
}
