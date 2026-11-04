import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/media";
import { userError } from "@/lib/user-error";

/**
 * Wasifu wa mtumiaji mwenyewe. RLS ya `profiles` inaruhusu kubadilisha
 * mstari wa yake tu, na trigger `protect_profile_columns` inazuia mtu
 * kujipa `is_admin` au kuidhinisha usabishi wake — hapa huandikwa jina,
 * simu na hall pekee.
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

  const fullName = String(body.fullName ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  const phone = String(body.phone ?? "").replace(/[^\d+]/g, "").slice(0, 20);
  const hall = String(body.hall ?? "").trim().slice(0, 60);

  // Picha ya wasifu hupakiwa kwenye folda ya mtumiaji mwenyewe kwenye
  // bucket ya 'media'; hapa tunahifadhi njaha tu, na tu ikiwa ni yake.
  const rawAvatar = String(body.avatarPath ?? "").trim();
  const avatarPath = rawAvatar.startsWith(`${user.id}/`) ? rawAvatar.slice(0, 300) : null;

  if (fullName.length < 2) {
    return NextResponse.json({ message: t.profile.needName }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || null,
      hall: hall || null,
      ...(body.avatarPath === undefined ? {} : { avatar_path: avatarPath }),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ message: userError(t, error) }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
