import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/media";
import { notifyOrderStage } from "@/lib/notify";
import type { Order, OrderStatus } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

/** Hatua za mwisho: zilikamilika au zilibatilishwa — hazarudi nyuma. */
const CLOSED: OrderStatus[] = ["completed", "cancelled"];

/**
 * Mlipuko mmoja wa kubadilisha hali ya oda kwa pande husika (mnunuzi au
 * mmiliki wa biashara). RLS bado hutekelezwa kwa session ya mtumiaji,
 * `protect_order_columns()` huzuia safu za pesa, na njia hii ndiyo pekee
 * inayowasha ujumbe wa SMS/barua pepe — hivyo hakuna hatua inayopita
 * kimyakimya.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ message: "Hifadhidata haijaunganishwa." }, { status: 503 });
  }

  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ message: "Oda haijulikani." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Ingia kwanza." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Ombi halinasoma." }, { status: 400 });
  }

  const status = String(body.status ?? "") as OrderStatus;
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ message: "Hatua hiyo haijulikani." }, { status: 400 });
  }

  const { data: row } = await supabase
    .from("orders")
    .select("id, status, payment_status, buyer_id, business:businesses(id, owner_id)")
    .eq("id", id)
    .maybeSingle<Order & { business?: { owner_id?: string } }>();

  if (!row) {
    return NextResponse.json({ message: "Oda haipatikani kwako." }, { status: 404 });
  }

  // RLS huruhusu pande zote mbili kubadilisha oda; hapa tnatofautisha
  // kwa makusudi ili mnunuzi asijipange hali ya "completed" mwenyewe.
  const isSeller = row.business?.owner_id === user.id;
  const isBuyer = row.buyer_id === user.id;

  if (!isSeller && !isBuyer) {
    return NextResponse.json({ message: "Huna ruhusa ya oda hii." }, { status: 403 });
  }
  if (!isSeller && isBuyer && status !== "cancelled") {
    return NextResponse.json(
      { message: "Kama mnunuzi unaweza kubatilisha oda tu." },
      { status: 403 },
    );
  }

  if (row.status === status) {
    return NextResponse.json({ ok: true, skipped: "hatua ileile" });
  }
  if (CLOSED.includes(row.status)) {
    return NextResponse.json(
      { message: `Oda ${row.status} haibadilishwi tena.` },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase.from("orders").update({ status }).eq("id", id);
  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 400 });
  }

  const report = await notifyOrderStage(id, "status");

  return NextResponse.json({ ok: true, notified: report.attempted });
}
