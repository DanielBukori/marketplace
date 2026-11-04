import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminActor } from "@/lib/admin-actor";
import { getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/media";
import { userError } from "@/lib/user-error";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Uidhinishaji wa wajumbe. Mtu hawezi kujiweka msabishi mwenyewe:
 * trigger `protect_profile_columns` huruhusu mwenyewe kuweka maombi
 * ('pending') tu, na hapa msimamizi ndiye anayabadilisha kuwa 'approved',
 * 'rejected' au kurudisha 'none'.
 */
export async function POST(request: NextRequest) {
  const t = await getT();

  if (!isSupabaseConfigured) {
    return NextResponse.json({ message: t.api.dbNotConfigured }, { status: 503 });
  }

  const actor = await requireAdminActor(t);
  if ("error" in actor) return actor.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: t.api.badRequest }, { status: 400 });
  }

  const profileId = String(body.profileId ?? "");
  const action = String(body.action ?? "");
  if (!UUID.test(profileId)) {
    return NextResponse.json({ message: t.api.badId }, { status: 400 });
  }

  const statusByAction: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    revoke: "none",
  };
  const status = statusByAction[action];
  if (!status) {
    return NextResponse.json({ message: t.api.unknownAction }, { status: 400 });
  }

  const supabase = await createClient();

  // Jina linatafutwa kwanza ili ujumbe wa uthibitisho useme ukweli,
  // na ili mtu asiye na profaili arejeshwe bila kuundwa rekodi mpya.
  const { data: target } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", profileId)
    .maybeSingle<{ id: string; full_name: string }>();

  if (!target) {
    return NextResponse.json({ message: t.api.orderNotFound }, { status: 404 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      courier_status: status,
      courier_approved_by: action === "approve" ? actor.userId : null,
      courier_approved_at: action === "approve" ? new Date().toISOString() : null,
    })
    .eq("id", profileId);

  if (error) {
    return NextResponse.json({ message: userError(t, error) }, { status: 400 });
  }

  return NextResponse.json({ ok: true, name: target.full_name, status });
}
