import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/media";
import { userError } from "@/lib/user-error";

/**
 * Kuomba kazi ya usabishi. Hapa mtu huweka maombi yake tu — trigger ya
 * profaili inakataa kujipa 'approved'. Msimamizi huona maombi hayo kwenye
 * kituo cha usimamizi na ndiye anayaruhusu.
 */
export async function POST(request: NextRequest) {
  const t = await getT();

  if (!isSupabaseConfigured) {
    return NextResponse.json({ message: t.api.dbNotConfigured }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: t.api.signInFirst }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: t.api.badRequest }, { status: 400 });
  }

  const action = String(body.action ?? "");
  const status = action === "withdraw" ? "none" : action === "request" ? "pending" : null;
  if (!status) {
    return NextResponse.json({ message: t.api.unknownAction }, { status: 400 });
  }

  const { data: mine } = await supabase
    .from("profiles")
    .select("courier_status, phone")
    .eq("id", user.id)
    .maybeSingle<{ courier_status?: string; phone?: string | null }>();

  if (!mine || mine.courier_status === undefined) {
    // Migration bado haijatumika: taja ukweli badala ya kuondoa matumaini.
    return NextResponse.json({ message: t.api.dbNotConfigured }, { status: 503 });
  }
  if (mine.courier_status === "approved") {
    return NextResponse.json({ message: t.courier.approved }, { status: 400 });
  }

  // Bila namba ya simu msabishi hawezi kufikia mnunuzi — hii ni ada ya kazi,
  // si kuzuia mtu.
  if (action === "request" && !String(mine.phone ?? "").replace(/\D/g, "")) {
    return NextResponse.json({ message: t.api.needPhone }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ courier_status: status })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ message: userError(t, error) }, { status: 400 });
  }

  return NextResponse.json({ ok: true, status });
}
