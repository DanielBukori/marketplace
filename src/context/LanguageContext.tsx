"use client";
import { createContext, useContext, type ReactNode } from "react";
import { dictFor } from "@/lib/i18n";
import type { Dict, Language } from "@/lib/translations";

type LanguageContextType = {
  lang: Language;
  t: Dict;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

/**
 * Lugha huamuliwa na seva (cookie `iaa_lang`) na kupitishwa hapa;
 * kibadilishi huunda upya ukurasa mzima, hivyo client na server
 * vina lugha moja daima.
 */
export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Language;
  children: ReactNode;
}) {
  return (
    <LanguageContext.Provider
      value={{ lang: initialLang, t: dictFor(initialLang) }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
