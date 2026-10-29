"use client";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Hizi ni viungo (links) vya kawaida, si vitufe: kivinjari hunyakua
 * nyumbani bila kuhitaji JavaScript, hivyo lugha hubadilika hata kama
 * programu haijapakia kabisa.
 */
export default function LangToggle() {
  const { lang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className="flex shrink-0 items-center gap-1 rounded-full border border-primary-100 bg-white p-1 shadow-sm"
    >
      {(["en", "sw"] as const).map((code) => (
        <a
          key={code}
          href={`/api/lang?lang=${code}`}
          aria-current={lang === code ? "true" : undefined}
          className={`rounded-full px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide transition ${
            lang === code
              ? "bg-primary-800 text-white shadow-sm"
              : "text-gray-500 hover:text-primary-800"
          }`}
        >
          {code}
        </a>
      ))}
    </div>
  );
}
