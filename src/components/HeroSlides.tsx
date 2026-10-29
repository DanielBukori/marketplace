"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, X, ZoomIn } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { homeSlides, type HomeSlide } from "@/lib/home-slides";
import type { Dict } from "@/lib/translations";

const DURATION_MS = 6500;

/**
 * `prefers-reduced-motion` hutafutwa kupitia useSyncExternalStore: ni hali ya
 * nje ya React (media query), kwa hivyo seva ndiyo chanzo cha kweli — si
 * state inayoweza kuwa ya zamani. Seva hujibu `false` (picha zinaenda) na
 * kivinjari hubadilisha papema kinapoonekana.
 */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onStoreChange);
      return () => query.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

type SlideCopy = Dict["home"]["slides"][number];

/**
 * Slaidi moja: picha ya uani (au paneli ya chapa ikiwa hakuna picha) juu ya
 * kivuli meusi, na maandishi yake. Kubofya slaidi hufungua dirisha kubwa.
 */
function Slide({
  slide,
  copy,
  index,
  active,
  reducedMotion,
  alt,
  ctaLabel,
}: {
  slide: HomeSlide;
  copy: SlideCopy;
  index: number;
  active: boolean;
  reducedMotion: boolean;
  alt: string;
  ctaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-hidden={!active}
      aria-label={`${index + 1} / ${homeSlides.length}: ${copy.title}`}
      className={`absolute inset-0 transition-opacity duration-700 ${
        active ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {slide.src ? (
        <div className="tile absolute inset-0 rounded-none">
          <Image
            src={slide.src}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 1024px, 100vw"
            className={`object-cover ${active && !reducedMotion ? "animate-kenburns" : ""}`}
            priority={index === 0}
          />
        </div>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(120%_140%_at_15%_10%,#1d5f9e_0%,#10497e_45%,#07233c_100%)]"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-ink-900/92 via-ink-900/45 to-ink-900/5"
      />

      <div
        className={`absolute inset-x-0 bottom-0 p-6 pb-16 md:p-9 md:pb-20 ${
          active && !reducedMotion ? "animate-rise" : ""
        }`}
      >
        <p className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
          {copy.eyebrow}
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-2xl font-extrabold leading-tight text-white md:text-3xl">
          {copy.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80 md:text-[15px]">
          {copy.caption}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={slide.href}
            tabIndex={active ? 0 : -1}
            className="rounded-full bg-white px-4 py-2 text-[13px] font-bold text-primary-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-primary-50"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HeroSlides() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const [zoomed, setZoomed] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const slides = t.home.slides;

  useEffect(() => {
    if (!playing || hovered || zoomed || reducedMotion) return;
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % homeSlides.length),
      DURATION_MS,
    );
    return () => window.clearInterval(timer);
  }, [playing, hovered, zoomed, reducedMotion]);

  // Dirisha kubwa: Esc hulifunga, mishale hubadilisha slaidi.
  useEffect(() => {
    if (!zoomed) return;
    closeRef.current?.focus();
    const step = (delta: number) =>
      setIndex((i) => (i + delta + homeSlides.length) % homeSlides.length);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(false);
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  const go = (delta: number) =>
    setIndex((i) => (i + delta + homeSlides.length) % homeSlides.length);

  const current = homeSlides[index];
  const currentCopy = slides[index] ?? slides[0];

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t.home.slideAria}
      className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] border border-primary-100/80 bg-ink-900 shadow-[0_30px_70px_-40px_rgba(7,35,60,0.75)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[5/6] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
        {homeSlides.map((slide, i) => (
          <Slide
            key={slide.id}
            slide={slide}
            copy={slides[i] ?? slides[0]}
            index={i}
            active={i === index}
            reducedMotion={reducedMotion}
            alt={slide.altKey ? t.home[slide.altKey] : (slides[i] ?? slides[0]).title}
            ctaLabel={t.home[slide.labelKey]}
          />
        ))}

        {current.src && (
          <button
            type="button"
            onClick={() => setZoomed(true)}
            aria-label={t.home.slideOpen}
            className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur transition hover:bg-white/25 md:right-7 md:top-7"
          >
            <ZoomIn size={13} /> {t.home.slideOpenShort}
          </button>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-5 pb-4 md:px-8">
        <div className="flex items-center gap-2">
          {homeSlides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={(slides[i] ?? slides[0]).title}
              aria-current={i === index ? "true" : undefined}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-8 bg-white" : "w-4 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? t.home.slidePause : t.home.slidePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t.home.slidePrev}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t.home.slideNext}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={currentCopy.title}
          onClick={(event) => {
            if (event.target === event.currentTarget) setZoomed(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/80 p-4 backdrop-blur-sm"
        >
          <div className="animate-pop-in w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-ink-900 sm:aspect-[16/9]">
              {current.src ? (
                <Image
                  src={current.src}
                  alt={current.altKey ? t.home[current.altKey] : currentCopy.title}
                  fill
                  sizes="(min-width: 768px) 768px, 100vw"
                  className="object-contain"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_15%_10%,#1d5f9e_0%,#10497e_45%,#07233c_100%)]" />
              )}
            </div>
            <div className="space-y-2 p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-600">
                {currentCopy.eyebrow}
              </p>
              <h2 className="font-display text-xl font-extrabold text-ink-900">
                {currentCopy.title}
              </h2>
              <p className="text-[15px] leading-relaxed text-gray-600">
                {currentCopy.caption}
              </p>
              {current.credit && (
                <p className="text-xs text-gray-400">{t.home.photoNote}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={current.href}
                  onClick={() => setZoomed(false)}
                  className="rounded-full bg-primary-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-800"
                >
                  {t.home[current.labelKey]}
                </Link>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setZoomed(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-primary-200 hover:text-primary-700"
                >
                  <X size={15} /> {t.home.slideClose}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
