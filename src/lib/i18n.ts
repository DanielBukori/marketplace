import { translations, type Dict, type Language } from "@/lib/translations";

export const LANGUAGE_COOKIE = "iaa_lang";

export function resolveLang(value: string | null | undefined): Language {
  return value === "en" ? "en" : "sw";
}

export function dictFor(lang: Language): Dict {
  return translations[lang];
}

/**
 * Inajaza nafasi za {placeholder} kwenye sentensi iliyotafsiriwa.
 * Matokeo yake huwekwa kama maudhui ya maandishi (React yaoyakinga),
 * si kama href, src au HTML.
 */
export function fill(
  template: string,
  vars: Record<string, string | number>,
): string {
  let text = template;
  for (const [key, value] of Object.entries(vars)) {
    text = text.split(`{${key}}`).join(String(value));
  }
  return text;
}

/**
 * Kujenga anwani ya nje kutoka kwenye templeti: kila thamani isiyo ya
 * mwanzo (bidhaa, bei, simu) hupita encodeURIComponent kabla haijaingizwa,
 * ili maandishi ya mtumiazi yasiweze kubadilisha muundo wa anwani.
 */
export function fillUrl(
  template: `https://${string}`,
  vars: Record<string, string | number>,
): string {
  const encoded: Record<string, string> = {};
  for (const [key, value] of Object.entries(vars)) {
    encoded[key] = encodeURIComponent(String(value));
  }
  return fill(template, encoded);
}
