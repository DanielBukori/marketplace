"use client";
import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-50">
        <Construction size={34} className="text-primary-700" />
      </span>
      <h1 className="mt-7 text-3xl font-extrabold tracking-tight text-ink-900">
        Ukurasa haujajengwa bado
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
        Sehemu hii itaungana na database (Supabase). Kwa sasa unaweza kutembelea
        sokoni au kuagiza msosi.
      </p>

      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link
          href="/market"
          className="rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900"
        >
          {t.nav.marketplace}
        </Link>
        <Link
          href="/msosi"
          className="rounded-full bg-accent-500 px-6 py-3 text-sm font-extrabold text-ink-900 transition hover:bg-accent-400"
        >
          {t.nav.food}
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-bold text-ink-900 transition hover:bg-paper-100"
        >
          <ArrowLeft size={16} /> {t.msosi.back}
        </Link>
      </div>
    </div>
  );
}
