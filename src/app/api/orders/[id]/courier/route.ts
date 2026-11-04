import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/media";
import { userError } from "@/lib/user-error";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mpangilio wa msabishi. Muuzi (mmiliki wa biashara) au msimamizi ndiyo
 * wanaompanga kwenye oda inayopelekwa — hii ndiyo njia pekee ya kazi
 * kufika kwa msabishi. Hakuna pesa inayohamishwa hapa: malipo ya msabishi
 * hukubalianwa na mmiliki wa duka nje ya jukwaa hili.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await getT();

  if (!isSupabaseConfigured) {
    return NextResponse.json({ message: t.api.dbNotConfigured }, { status: 503 });
  }

  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ message: t.api.orderUnrecognised }, { status: 400 });
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

  const rawCourier = body.courierId === null || body.courierId === undefined
    ? ""
    : String(body.courierId);
  if (rawCourier && !UUID.test(rawCourier)) {
    return NextResponse.json({ message: t.api.badId }, { status: 400 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, delivery_method, business:businesses(id, owner_id)")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      status: string;
      delivery_method: string;
      business?: { owner_id?: string };
    }>();

  if (!order) {
    return NextResponse.json({ message: t.api.orderNotFoundForYou }, { status: 404 });
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_admin: boolean }>();

  const isSeller = order.business?.owner_id === user.id;
  const isAdmin = myProfile?.is_admin ?? false;

  if (!isSeller && !isAdmin) {
    return NextResponse.json({ message: t.api.noPermission }, { status: 403 });
  }

  // Oda zinazochukuliwa mwenyewe hazina cha kupanga msabishi.
  if (order.delivery_method !== "delivery") {
    return NextResponse.json({ message: t.api.pickupNoCourier }, { status: 400 });
  }

  // Onyo: msabishi lazima awe ameidhinishwa na msimamizi.
  if (rawCourier) {
    const { data: courier } = await supabase
      .from("profiles")
      .select("id, full_name, courier_status")
      .eq("id", rawCourier)
      .maybeSingle<{ id: string; full_name: string; courier_status?: string }>();

    if (courier?.courier_status !== "approved") {
      return NextResponse.json({ message: t.api.courierNotApproved }, { status: 400 });
    }

    const { error } = await supabase
      .from("orders")
      .update({ courier_id: courier.id })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ message: userError(t, error) }, { status: 400 });
    }
    return NextResponse.json({ ok: true, name: courier.full_name });
  }

  const { error } = await supabase.from("orders").update({ courier_id: null }).eq("id", id);
  if (error) {
    return NextResponse.json({ message: userError(t, error) }, { status: 400 });
  }
  return NextResponse.json({ ok: true, cleared: true });
}
