"use client";

import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">
        {t.error.title}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
        {t.error.desc}
      </p>
      <p className="mx-auto mt-5 max-w-xl break-words rounded-2xl bg-white px-5 py-4 text-left text-sm text-gray-600 shadow-sm">
        {error.message || t.error.noMessage}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-7 inline-flex rounded-full bg-primary-800 px-7 py-3 text-sm font-bold text-white transition hover:bg-primary-900"
      >
        {t.common.retry}
      </button>
    </div>
  );
}
