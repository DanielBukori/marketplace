import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/media";
import { userError } from "@/lib/user-error";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Muuzi huamua maeneo ya chuo ambazo biashara yake inayapelekea.
 * Orodha tupu ina maana ya kutumikia kila eneo hai — hii ndiyo sababu
 * `business_zones` hutumika tu ikiwa muuzi ameichagua kwa makusudi.
 * RLS inaruhusu kuandika kwa mmiliki wa biashara au msimamizi pekee.
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

  const businessId = String(body.businessId ?? "");
  if (!UUID.test(businessId)) {
    return NextResponse.json({ message: t.api.badId }, { status: 400 });
  }

  // Swali hili hufanyiwa kazi na RLS: jina halirudi ikiwa mtu si mmiliki.
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .maybeSingle<{ id: string }>();

  if (!business) {
    return NextResponse.json({ message: t.api.noPermission }, { status: 403 });
  }

  const rawIds = Array.isArray(body.zoneIds) ? body.zoneIds : [];
  const zoneIds = [...new Set(rawIds.map((id) => String(id)))].filter((id) => UUID.test(id));

  // Ongeza mpya kwanza, kisha ondoa zile zisizochaguliwa. Kama eneo moja
  // halipo tena, ombi hushindwa kabla ya kufuta orodha ya zamani — muuzi
  // haachiwi bila maeneo kwa sababu ya kosa la muda.
  if (zoneIds.length > 0) {
    const { error: insertError } = await supabase.from("business_zones").upsert(
      zoneIds.map((zone_id) => ({ business_id: businessId, zone_id })),
      { onConflict: "business_id,zone_id", ignoreDuplicates: true },
    );

    if (insertError) {
      return NextResponse.json({ message: userError(t, insertError) }, { status: 400 });
    }

    const { error: pruneError } = await supabase
      .from("business_zones")
      .delete()
      .eq("business_id", businessId)
      .not("zone_id", "in", `(${zoneIds.join(",")})`);

    if (pruneError) {
      return NextResponse.json({ message: userError(t, pruneError) }, { status: 400 });
    }
  } else {
    const { error: clearError } = await supabase
      .from("business_zones")
      .delete()
      .eq("business_id", businessId);

    if (clearError) {
      return NextResponse.json({ message: userError(t, clearError) }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, count: zoneIds.length });
}
