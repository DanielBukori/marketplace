"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

const FLAG = "iaa-splash-seen";
/** Lazima iendane na `--animate-splash-close`: 1.5s kusubiri + 0.6s kufunga. */
const CLOSE_MS = 2100;

/**
 * Utangulizi wa jina na nembo. Kufungwa kwake hufanyika kwa CSS pekee
 * (`animate-splash-close` hufika ukomo wa `visibility: hidden`), kwa hivyo
 * hata bila JavaScript ukurasa haufunikwa milele; JavaScript huandika tu
 * alama ya "imeshapesa" ili kupakia mara ya pili katika kipindi hicho
 * isirudie utangulizi.
 */
export default function SplashScreen() {
  const { t } = useLanguage();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    let seen: string | null;
    try {
      seen = sessionStorage.getItem(FLAG);
    } catch {
      // Kipindi cha faragha hakiruhusu sessionStorage; aache utangulizi
      // uonekane — ni mara moja tu kwa kupakia ukurasa.
      return;
    }
    if (seen) {
      node.style.display = "none";
      return;
    }

    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(FLAG, "1");
      } catch {
        // Alama imeshindwa kuandikwa; utangulizi utarudiwa kila kupakia.
      }
    }, CLOSE_MS);

    return () => window.clearTimeout(timer);
  }, []);

  function skip() {
    const node = rootRef.current;
    if (node) node.style.display = "none";
    try {
      sessionStorage.setItem(FLAG, "1");
    } catch {
      // Hakuna kit cha kufanya — ukurasa tayari unavyowazi.
    }
  }

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      className="iaa-splash animate-splash-close fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-primary-900 px-6 text-center"
    >
      <Image
        src="/iaa/iaa-crest.png"
        width={200}
        height={193}
        alt=""
        priority
        className="animate-pop-in h-24 w-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
      />

      <div className="space-y-2">
        <p
          className="animate-rise font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          style={{ animationDelay: "120ms" }}
        >
          {t.splash.name}
        </p>
        <p
          className="animate-rise mx-auto max-w-md text-[15px] leading-relaxed text-primary-100"
          style={{ animationDelay: "260ms" }}
        >
          {t.splash.tagline}
        </p>
        <p
          className="animate-rise text-xs font-semibold uppercase tracking-[0.18em] text-primary-200"
          style={{ animationDelay: "420ms" }}
        >
          {t.splash.waiting}
        </p>
      </div>

      <button
        type="button"
        onClick={skip}
        className="animate-rise rounded-full border border-white/25 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"
        style={{ animationDelay: "520ms" }}
      >
        {t.splash.skip}
      </button>
    </div>
  );
}
