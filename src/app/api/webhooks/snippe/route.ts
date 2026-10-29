import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { queuePayoutForPaidOrder } from "@/lib/payouts";
import type { SnippeChannel } from "@/lib/snippe";
import type { Order } from "@/lib/types";

export const runtime = "nodejs";

const signatureHeaderNames = ["x-snippe-signature", "snippe-signature", "x-signature"];

const channelNames: SnippeChannel[] = ["mpesa", "airtel", "mixx", "halotel"];

/** Snippe saini kwa HMAC-SHA256 ya mwili mbichi; fungo lipo seva pekee. */
function hasValidSignature(request: NextRequest, raw: string): boolean {
  const secret = process.env.SNIPPE_WEBHOOK_SECRET;
  if (!secret) return false;

  const header = signatureHeaderNames
    .map((name) => request.headers.get(name))
    .find((value) => Boolean(value));
  if (!header) return false;

  const provided = header.replace(/^sha256=/i, "").trim().toLowerCase();
  const expected = createHmac("sha256", secret).update(raw, "utf8").digest("hex");

  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

function field(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return "";
}

function resolveChannel(value: string): SnippeChannel | "" {
  const text = value.toLowerCase();
  if (text.includes("airtel")) return "airtel";
  if (text.includes("tigo") || text.includes("mpesa") || text.includes("voda")) return "mpesa";
  if (text.includes("mix")) return "mixx";
  if (text.includes("halo")) return "halotel";
  const match = channelNames.find((channel) => text.includes(channel));
  return match ?? "";
}

export async function POST(request: NextRequest) {
  const raw = await request.text();

  if (!process.env.SNIPPE_WEBHOOK_SECRET) {
    // Bila fungo la saini, tukubali ombi lolote ni kuiga malipo — tukane.
    return NextResponse.json({ message: "SNIPPE_WEBHOOK_SECRET haijawekwa." }, { status: 503 });
  }
  if (!hasValidSignature(request, raw)) {
    return NextResponse.json({ message: "Saini si sahihi." }, { status: 401 });
  }
  if (!isAdminClientConfigured) {
    return NextResponse.json({ message: "SUPABASE_SERVICE_ROLE_KEY haijawekwa." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Mwili si JSON." }, { status: 400 });
  }

  // Snippe inaweza kutuma taarifa ndani ya `data`, `payment` au `object`.
  const nested = [
    body,
    (body.data ?? {}) as Record<string, unknown>,
    (body.payment ?? {}) as Record<string, unknown>,
    (body.object ?? {}) as Record<string, unknown>,
  ];

  const read = (keys: string[]) => {
    for (const source of nested) {
      const value = field(source, keys);
      if (value) return value;
    }
    return "";
  };

  const reference = read(["reference", "order_reference", "external_reference"]).toUpperCase();
  const signal = `${read(["type", "event", "action"])} ${read(["status", "state", "result"])}`.toLowerCase();
  const providerPaymentId = read(["id", "payment_id", "transaction_id"]);

  if (!reference) {
    return NextResponse.json({ received: true, ignored: "hakuna reference" });
  }

  const isPaid = /(paid|success|successful|settled|captured)/.test(signal);
  const isRefunded = /refund/.test(signal);
  const isFailed = /(fail|declin|expired|timeout|cancel|revers)/.test(signal);
  if (!isPaid && !isRefunded && !isFailed) {
    return NextResponse.json({ received: true, ignored: `hali ${signal.trim() || "haitambuliki"}` });
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("orders")
    .select("*, business:businesses(id, name, slug)")
    .eq("reference", reference)
    .maybeSingle();

  const order = row as unknown as Order | null;
  if (!order) {
    return NextResponse.json({ received: true, ignored: `oda ${reference} haipatikani` });
  }

  const paymentStatus = isPaid ? "paid" : isRefunded ? "refunded" : "failed";

  // Oda iliyolipwa haibadilishwi tena — hubaya hutokea Snippe inapounda
  // ombi mara kwa mara, lakini pesa huhamishwa mara moja tu.
  if ((isPaid || isRefunded) && order.payment_status === "paid" && paymentStatus !== "failed") {
    return NextResponse.json({ received: true, skipped: "tayari imelipwa" });
  }

  const { error: updateError } = await admin
    .from("orders")
    .update({
      payment_status: paymentStatus,
      provider: "snippe",
      provider_payment_id: providerPaymentId || order.provider_payment_id,
    })
    .eq("id", order.id);

  if (updateError) {
    console.error("snippe webhook: oda haibadlishwi", updateError.message);
    return NextResponse.json({ message: "Hifadhidata imekataa." }, { status: 500 });
  }

  if (isPaid) {
    const channel =
      resolveChannel(read(["channel", "provider", "network", "method"])) ||
      resolveChannel(order.payment_channel);
    const queued = await queuePayoutForPaidOrder(admin, order, channel || "mpesa");

    // Bila foli, pesa ya muuzi haionekani popote — achia alama kwenye historia.
    if (!queued) {
      await admin.from("order_events").insert({
        order_id: order.id,
        status: order.status,
        note: "malipo yamepokelewa; foli ya kulipa muuzi haikuundwa",
      });
    }
  }

  return NextResponse.json({ received: true });
}
