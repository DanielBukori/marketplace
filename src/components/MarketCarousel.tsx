"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import { marketPromoLayout, type PromoTone } from "@/lib/data";

const skins: Record<PromoTone, { shell: string; card: string; cta: string }> = {
  blue: {
    shell: "bg-[radial-gradient(120%_120%_at_80%_20%,#2a6497_0%,#07233c_75%)]",
    card: "bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-sm",
    cta: "bg-white text-primary-800 hover:bg-primary-50",
  },
  crimson: {
    shell: "bg-[radial-gradient(120%_120%_at_80%_20%,#c9454a_0%,#5c1114_75%)]",
    card: "bg-black/25 text-white ring-1 ring-white/15",
    cta: "bg-white text-accent-600 hover:bg-accent-100",
  },
  dark: {
    shell: "bg-[radial-gradient(120%_120%_at_80%_20%,#1c2b41_0%,#0f1b2d_70%)]",
    card: "bg-black/45 text-white ring-1 ring-white/10",
    cta: "bg-accent-500 text-white hover:bg-accent-400",
  },
};

export default function MarketCarousel() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const slides = t.promo.map((copy, i) => ({ ...copy, ...marketPromoLayout[i] }));
  // index ni namba ndani ya orodha hii, hivyo thamani hii haiwezi kubeba maandishi.
  const progress: number = (index % slides.length) * 100;

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % marketPromoLayout.length),
      6000,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-[28px]">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${progress}%)` }}
        >
          {slides.map((slide) => {
            const skin = skins[slide.tone];
            return (
              <div
                key={slide.href}
                className={`relative flex min-h-[340px] w-full shrink-0 items-center px-6 py-12 md:min-h-[420px] md:px-12 ${skin.shell}`}
              >
                <div className={`relative max-w-md rounded-3xl p-8 ${skin.card}`}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                    {slide.eyebrow}
                  </p>
                  <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
                    {slide.title}
                  </h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-white/75">
                    {slide.quote}
                  </p>
                  <Link
                    href={slide.href}
                    className={`mt-7 inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold shadow-lg transition ${skin.cta}`}
                  >
                    {slide.cta} <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex justify-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.href}
            type="button"
            aria-label={fill(t.market.slideAria, { n: i + 1 })}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index
                ? "w-6 bg-primary-800"
                : "w-2 bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
