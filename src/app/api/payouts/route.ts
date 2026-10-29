import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/media";
import { createDisbursement, isSnippeConfigured, type SnippeChannel } from "@/lib/snippe";
import type { Payout } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ruksa za msimamizi pekee; rudi majibu ya kosa ikiwa mtumiaji hana daraja. */
async function adminActor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ message: "Ingia kwanza." }, { status: 401 }) } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_admin: boolean }>();

  if (!profile?.is_admin) {
    return { error: NextResponse.json({ message: "Hati hii ni ya msimamizi." }, { status: 403 }) } as const;
  }

  return { ok: true } as const;
}

/** Kubadilisha namba ya muuzi kwenye foli kabla pesa haijatumwa. */
export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured || !isAdminClientConfigured) {
    return NextResponse.json({ message: "Hifadhidata haijaunganishwa." }, { status: 503 });
  }

  const actor = await adminActor();
  if ("error" in actor) return actor.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Ombi halinasoma." }, { status: 400 });
  }

  const payoutId = String(body.payoutId ?? "");
  const destination = String(body.destination ?? "").replace(/[^0-9+A-Za-z]/g, "").slice(0, 40);

  if (!UUID.test(payoutId) || destination.length < 4) {
    return NextResponse.json({ message: "Weka namba sahihi ya muuzi." }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .from("payouts")
    .update({ destination, failure_reason: null })
    .eq("id", payoutId)
    .in("status", ["queued", "failed"]);

  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ saved: true });
}

/**
 * Kutuma pesa kwa muuzi ni hatua ya msimamizi: fedha zilizo kwenye akaunti
 * ya mfumo hutoka pale pekee, baada ya oda kukamilika.
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ message: "Hifadhidata haijaunganishwa." }, { status: 503 });
  }

  const actor = await adminActor();
  if ("error" in actor) return actor.error;

  if (!isSnippeConfigured || !isAdminClientConfigured) {
    return NextResponse.json(
      { message: "Snippe au fungo la seva halijawekwa; malipo hayawezi kutumwa kwa simu." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Ombi halinasoma." }, { status: 400 });
  }

  const payoutId = String(body.payoutId ?? "");
  if (!UUID.test(payoutId)) {
    return NextResponse.json({ message: "Kitambulisho si sahihi." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("payouts")
    .select("*, order:orders(id, reference, status, payment_status, business_id)")
    .eq("id", payoutId)
    .maybeSingle();

  const payout = row as unknown as
    | (Payout & { order?: { id: string; reference: string; status: string; payment_status: string } | null })
    | null;

  if (!payout) {
    return NextResponse.json({ message: "Foli ya malipo haipatikani." }, { status: 404 });
  }
  if (payout.status === "sent" || payout.status === "processing") {
    return NextResponse.json({ message: "Malipo haya tayari yameshatuma." });
  }
  if (payout.order?.status !== "completed") {
    return NextResponse.json(
      { message: "Oda hii haijakamilika — pesa ya muuzi hutumwa baada ya mnunuzi kupokea." },
      { status: 400 },
    );
  }
  if (payout.order?.payment_status !== "paid") {
    return NextResponse.json(
      { message: "Mfumo hukabidhi pesa tu za oda zilizolipwa kwa Snippe." },
      { status: 400 },
    );
  }

  if (payout.method === "bank") {
    return NextResponse.json(
      { message: "Malipo ya benki hubreshwa nje ya API hii; weka hali mwenyewe." },
      { status: 400 },
    );
  }

  const phone = payout.destination.replace(/[^\d+]/g, "");
  if (phone.replace(/\D/g, "").length < 9) {
    return NextResponse.json(
      { message: "Ongeza namba ya muuzi kwenye foli hii kabla ya kutuma." },
      { status: 400 },
    );
  }

  await admin.from("payouts").update({ status: "processing" }).eq("id", payout.id);

  const result = await createDisbursement({
    amount: Number(payout.amount),
    phone,
    channel: payout.method as SnippeChannel,
    reference: payout.reference,
  });

  if (!result.ok) {
    await admin
      .from("payouts")
      .update({ status: "failed", failure_reason: result.message })
      .eq("id", payout.id);

    return NextResponse.json(
      { message: result.message, status: "failed" },
      { status: 502 },
    );
  }

  await admin
    .from("payouts")
    .update({
      status: "sent",
      provider_transfer_id: result.id,
      settled_at: new Date().toISOString(),
      failure_reason: null,
    })
    .eq("id", payout.id);

  if (payout.order_id) {
    await admin.from("order_events").insert({
      order_id: payout.order_id,
      status: "completed",
      note: `muuzi amelipiwa ${payout.amount}`,
    });
  }

  return NextResponse.json({ status: "sent", reference: payout.reference });
}
