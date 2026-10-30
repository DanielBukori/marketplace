import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminActor } from "@/lib/admin-actor";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/media";
import { queuePayoutForPaidOrder } from "@/lib/payouts";
import type { SnippeChannel } from "@/lib/snippe";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

const PAYMENTS: PaymentStatus[] = [
  "unpaid",
  "awaiting_payment",
  "paid",
  "failed",
  "refunded",
];

const CHANNELS: SnippeChannel[] = ["mpesa", "airtel", "mixx", "halotel"];

/**
 * Kituo cha huduma kwa wateja: msimamizi hithibitisha malipo yaliyofika,
 * kurekebisha hatua ya oda, na kurejesza oda iliyoharibika. Maudhui haya
 * hayawezi kufanywa na kivinjari — trigger `protect_order_columns` huruhusu
 * seva (service_role) pekee kubadilisha safu za pesa.
 */
export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ message: "Hifadhidata haijaunganishwa." }, { status: 503 });
  }

  const actor = await requireAdminActor();
  if ("error" in actor) return actor.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Ombi halinasoma." }, { status: 400 });
  }

  const orderId = String(body.orderId ?? "");
  const action = String(body.action ?? "");
  const note = String(body.note ?? "").trim().slice(0, 200);

  if (!UUID.test(orderId)) {
    return NextResponse.json({ message: "Kitambulisho cha oda si sahihi." }, { status: 400 });
  }

  if (!isAdminClientConfigured) {
    return NextResponse.json(
      { message: "Fungo la seva halijawekwa; mabadiliko haya hayawezeki." },
      { status: 503 },
    );
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", orderId)
    .maybeSingle();

  const order = row as unknown as Order | null;
  if (!order) {
    return NextResponse.json({ message: "Oda haipatikani." }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  const events: { status: string; note: string }[] = [];

  if (action === "status") {
    const status = String(body.status ?? "") as OrderStatus;
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ message: "Hatua hiyo haijulikani." }, { status: 400 });
    }
    update.status = status;
    events.push({
      status,
      note: note || `msimamizi alibadilisha hatua: ${order.status} → ${status}`,
    });
  } else if (action === "payment") {
    const payment = String(body.paymentStatus ?? "") as PaymentStatus;
    if (!PAYMENTS.includes(payment)) {
      return NextResponse.json({ message: "Hali ya malipo haijulikani." }, { status: 400 });
    }
    update.payment_status = payment;

    if (payment === "paid") {
      // Malipo yaliyothibitishwa mikononi hayajaenda kupitia Snippe, kwa
      // hivyo chanzo handikwa kama pesa taslimu ili ripoti zisibe udanganyifu.
      update.provider = "cash";
      const channel = String(body.channel ?? "");
      if (CHANNELS.includes(channel as SnippeChannel)) {
        update.payment_channel = channel;
      }
    }

    events.push({
      status: order.status,
      note:
        note ||
        `malipo: ${order.payment_status} → ${payment} (imethibitishwa na msimamizi)`,
    });
  } else {
    return NextResponse.json({ message: "Kitendo hakijutikana." }, { status: 400 });
  }

  const { error: updateError } = await admin.from("orders").update(update).eq("id", orderId);
  if (updateError) {
    return NextResponse.json({ message: updateError.message }, { status: 400 });
  }

  if (events.length > 0) {
    await admin.from("order_events").insert(
      events.map((event) => ({
        order_id: orderId,
        status: event.status,
        note: event.note,
      })),
    );
  }

  let payoutQueued = false;

  if (action === "payment" && update.payment_status === "paid") {
    const fresh = { ...order, payment_status: "paid" } as Order;
    if (fresh.status === "completed") {
      const channel = String(update.payment_channel ?? "mpesa") as SnippeChannel;
      payoutQueued = Boolean(await queuePayoutForPaidOrder(admin, fresh, channel));
    }
  }

  if (action === "status" && update.status === "completed" && order.payment_status === "paid") {
    const channel = (order.payment_channel || "mpesa") as SnippeChannel;
    payoutQueued = Boolean(await queuePayoutForPaidOrder(admin, order, channel));
  }

  return NextResponse.json({ saved: true, payoutQueued });
}
