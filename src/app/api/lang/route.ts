import { NextResponse, type NextRequest } from "next/server";
import { LANGUAGE_COOKIE, resolveLang } from "@/lib/i18n";

/**
 * Njia ya ndani tu ndiyo inakubalika. "//mfano.com/x" ni mwongozo wa
 * nje (protocol-relative), hivyo inarudishwa kwa nyumbani.
 */
function safePath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

/**
 * Ukurasa mtumiazi yuko, pamoja na vigezo vya anwani kama
 * /checkout?business=choma. Referer hutumika kwa sababu kibadilishi
 * cha lugha hakitegemei JavaScript.
 */
function currentPage(request: NextRequest): string {
  const fromQuery = request.nextUrl.searchParams.get("next");
  if (fromQuery) return safePath(fromQuery);

  const referer = request.headers.get("referer");
  if (!referer) return "/";
  try {
    const url = new URL(referer);
    if (url.origin !== request.nextUrl.origin) return "/";
    return safePath(`${url.pathname}${url.search}`);
  } catch {
    return "/";
  }
}

/**
 * Kubadili lugha kunahitaji server components zipajiwe upya. Njia hii
 * huweka cookie kwenye seva kisha inarudisha mtumiazi kwenye ukurasa
 * aliokuapo, hivyo kibadilishi cha EN/SW hufanya kazi hata ikiwa
 * JavaScript ya kivinjari imevunjika au haijapakia.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const lang = resolveLang(searchParams.get("lang"));
  const response = NextResponse.redirect(
    new URL(currentPage(request), origin),
  );

  response.cookies.set(LANGUAGE_COOKIE, lang, {
    path: "/",
    maxAge: 31_536_000,
    sameSite: "lax",
  });
  return response;
}
