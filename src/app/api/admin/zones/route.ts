import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminActor } from "@/lib/admin-actor";
import { getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/media";
import { userError } from "@/lib/user-error";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Maeneo ya upelekezaji — orodha ya msimamizi pekee. Mnunuzi huchagua
 * kutoka hapa kwa dropdown; muuzi huamua tu gharama yake ya delivery.
 * RLS ya `delivery_zones` inaruhusu kuandika kwa `is_admin_user()` tu,
 * kwa hivyo msimamizi huandika kwa session yake mwenye, bila fungo la seva.
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

  const action = String(body.action ?? "");
  const supabase = await createClient();

  if (action === "create" || action === "update") {
    const name = String(body.name ?? "").trim().slice(0, 60);
    const note = String(body.note ?? "").trim().slice(0, 160);
    const sortOrder = Math.floor(Number(body.sortOrder) || 0);
    const isActive = body.isActive !== false;

    if (name.length < 2) {
      return NextResponse.json({ message: t.zones.needName }, { status: 400 });
    }

    const payload = {
      name,
      note,
      sort_order: sortOrder,
      is_active: isActive,
    };

    if (action === "create") {
      const { error } = await supabase
        .from("delivery_zones")
        .insert({ ...payload, created_by: actor.userId });
      if (error) {
        return NextResponse.json({ message: userError(t, error) }, { status: 400 });
      }
      return NextResponse.json({ ok: true, name });
    }

    const id = String(body.id ?? "");
    if (!UUID.test(id)) {
      return NextResponse.json({ message: t.api.badId }, { status: 400 });
    }

    const { error } = await supabase.from("delivery_zones").update(payload).eq("id", id);
    if (error) {
      return NextResponse.json({ message: userError(t, error) }, { status: 400 });
    }
    return NextResponse.json({ ok: true, name });
  }

  if (action === "delete") {
    const id = String(body.id ?? "");
    if (!UUID.test(id)) {
      return NextResponse.json({ message: t.api.badId }, { status: 400 });
    }

    // Oda zilizoondoa eneo zinaachwa salama: `delivery_zone_id` hufanywa
    // NULL lakini jina lililotunzwa kwenye oda hubaki kwa historia.
    const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ message: userError(t, error) }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ message: t.api.unknownAction }, { status: 400 });
}
