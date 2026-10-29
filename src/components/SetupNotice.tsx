"use client";
import { useLanguage } from "@/context/LanguageContext";

export default function SetupNotice() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto my-10 max-w-2xl rounded-2xl border border-accent-100 bg-accent-100/40 p-6 text-sm leading-relaxed text-ink-900">
      <p className="font-bold">{t.setup.title}</p>
      <p className="mt-2">{t.setup.intro}</p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5">
        {t.setup.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
