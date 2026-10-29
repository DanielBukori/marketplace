import { cookies } from "next/headers";
import { LANGUAGE_COOKIE, dictFor, resolveLang } from "@/lib/i18n";
import type { Dict, Language } from "@/lib/translations";

/**
 * Lugha huundwa kwenye cookie (si localStorage) ili server components
 * pia zisome katika lugha hiyo hiyo na kivinjari.
 */
export async function getLang(): Promise<Language> {
  return resolveLang((await cookies()).get(LANGUAGE_COOKIE)?.value);
}

export async function getT(): Promise<Dict> {
  return dictFor(await getLang());
}
