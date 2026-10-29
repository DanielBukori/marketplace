import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/media";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const nextParam = searchParams.get("next") ?? "/dashboard";
  // Ruga za ndani tu: uzuie mshambuliaji kutuma mtumiaji kwenye domeini nyingine.
  // `//host` ni protocol-relative, hivyo ni pamoja na `//` katika kukataa.
  const safeNext =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  const loginUrl = new URL("/login", origin);
  if (safeNext !== "/dashboard") loginUrl.searchParams.set("next", safeNext);

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(loginUrl);
  }

  // Supabase hurudisha `error`/`error_description` (mf. `otp_expired`).
  // Zipeleke `/login` ili mtumiaji aone sababu, badala ya kurudishwa
  // kwenye ukurasa uleule bila maelezo.
  const serverError =
    searchParams.get("error_description") ?? searchParams.get("error");
  if (serverError) {
    loginUrl.searchParams.set("error_description", serverError);
    return NextResponse.redirect(loginUrl);
  }

  const code = searchParams.get("code");
  if (!code) {
    loginUrl.searchParams.set(
      "error_description",
      "the callback arrived without a `code` — open the link from a fresh email",
    );
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    loginUrl.searchParams.set("error_description", error.message);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
