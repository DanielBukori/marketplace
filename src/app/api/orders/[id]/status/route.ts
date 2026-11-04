import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fill } from "@/lib/i18n";
import { getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/media";
import { notifyOrderStage } from "@/lib/notify";
import { userError } from "@/lib/user-error";
import type { Order, OrderStatus } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
];

/** Hatua za mwisho: zilikamilika au zilibatilishwa — hazarudi nyuma. */
const CLOSED: OrderStatus[] = ["completed", "cancelled"];

/**
 * Msabishi anayechukua oda anaweza kusema amechukua ('out_for_delivery')
 * au ameupeleka ('completed'). Hatua hizi mbili tu ndizo anazoruhusiwa,
 * na `protect_order_columns()` inarudia ukweli huo kwenye hifadhidata.
 */
const COURIER_STAGES: OrderStatus[] = ["out_for_delivery", "completed"];

/**
 * Mlipuko mmoja wa kubadilisha hali ya oda kwa pande husika (mnunuzi au
 * mmiliki wa biashara). RLS bado hutekelezwa kwa session ya mtumiaji,
 * `protect_order_columns()` huzuia safu za pesa, na njia hii ndiyo pekee
 * inayowasha ujumbe wa SMS/barua pepe — hivyo hakuna hatua inayopita
 * kimyakimya.
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

  const status = String(body.status ?? "") as OrderStatus;
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ message: t.api.unknownStage }, { status: 400 });
  }

  const { data: row } = await supabase
    .from("orders")
    .select("id, status, payment_status, buyer_id, courier_id, business:businesses(id, owner_id)")
    .eq("id", id)
    .maybeSingle<Order & { business?: { owner_id?: string } }>();

  if (!row) {
    return NextResponse.json({ message: t.api.orderNotFoundForYou }, { status: 404 });
  }

  // RLS huruhusu pande husika kubadilisha oda; hapa tunatofautisha kwa
  // makusudi ili mnunuzi asijipange hali ya "completed" mwenyewe, na
  // msabishi aondoke nje akiwa hakuna tenye baraka ya msimamizi.
  const isSeller = row.business?.owner_id === user.id;
  const isBuyer = row.buyer_id === user.id;

  let isCourier = false;
  if (!isSeller && !isBuyer && row.courier_id === user.id) {
    const { data: me } = await supabase
      .from("profiles")
      .select("courier_status")
      .eq("id", user.id)
      .maybeSingle<{ courier_status?: string }>();
    isCourier = me?.courier_status === "approved";
  }

  if (!isSeller && !isBuyer && !isCourier) {
    return NextResponse.json({ message: t.api.noPermission }, { status: 403 });
  }
  if (isCourier && !isSeller && !isBuyer && !COURIER_STAGES.includes(status)) {
    return NextResponse.json({ message: t.api.courierOnly }, { status: 403 });
  }
  if (!isSeller && isBuyer && status !== "cancelled") {
    return NextResponse.json(
      { message: t.api.buyerCancelOnly },
      { status: 403 },
    );
  }

  if (row.status === status) {
    return NextResponse.json({ ok: true, skipped: "hatua ileile" });
  }
  if (CLOSED.includes(row.status)) {
    // Mnunuzi huona jina la hatua kwa lugha yake, si thamani ya enum
    // kama "completed" — vivyo hivyo na jina linaloonekana kwenye kadi za oda.
    const statusLabel =
      (t.status as Record<string, string>)[row.status] ?? row.status;
    return NextResponse.json(
      { message: fill(t.api.statusFrozen, { status: statusLabel }) },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase.from("orders").update({ status }).eq("id", id);
  if (updateError) {
    return NextResponse.json({ message: userError(t, updateError) }, { status: 400 });
  }

  const report = await notifyOrderStage(id, "status");

  return NextResponse.json({ ok: true, notified: report.attempted });
}
