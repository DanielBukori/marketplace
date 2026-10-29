import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/media";
import { createCollection, isSnippeConfigured, type SnippeChannel } from "@/lib/snippe";
import type { Business, Order } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const channels: SnippeChannel[] = ["mpesa", "airtel", "mixx", "halotel"];

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ message: "Hifadhidata haijaunganishwa." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Ingia kwanza kabla ya kulipa." }, { status: 401 });
  }

  if (!isSnippeConfigured || !isAdminClientConfigured) {
    return NextResponse.json(
      {
        message:
          "Malipo ya simu hayijaunganishwa bado. Lipa mikononi kwa muuzi wakati unapochukua oda.",
      },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Ombi halinasoma." }, { status: 400 });
  }

  const orderId = String(body.orderId ?? "");
  const channel = channels.includes(body.channel as SnippeChannel)
    ? (body.channel as SnippeChannel)
    : null;

  if (!UUID.test(orderId) || !channel) {
    return NextResponse.json({ message: "Chagua njia ya malipo." }, { status: 400 });
  }

  // Oda isomwe kwa seva: RLS ingemwonyesha mnunuzi yake pekee, lakini
  // tunahitaji kuhakikisha muuzi bali haijafungwa kabla ya kumpigia USSD.
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("orders")
    .select("*, business:businesses(id, name, slug, is_active)")
    .eq("id", orderId)
    .maybeSingle();

  const order = row as unknown as
    | (Order & { business?: Pick<Business, "id" | "name" | "slug" | "is_active"> })
    | null;

  if (!order) {
    return NextResponse.json({ message: "Oda haipatikani." }, { status: 404 });
  }
  if (order.buyer_id !== user.id) {
    return NextResponse.json({ message: "Oda hii si yako." }, { status: 403 });
  }
  if (order.business && order.business.is_active === false) {
    return NextResponse.json({ message: "Biashara hii imefungwa." }, { status: 400 });
  }
  if (order.status === "cancelled") {
    return NextResponse.json({ message: "Oda hii imeghairiwa." }, { status: 400 });
  }
  if (order.payment_status === "paid") {
    return NextResponse.json({
      paymentStatus: "paid",
      message: "Oda hii tayari imelipwa.",
    });
  }

  const amount = Number(order.total);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ message: "Jumla ya oda si sahihi." }, { status: 400 });
  }

  const phone = String(body.phone ?? order.contact_phone ?? "").replace(/[^\d+]/g, "");
  if (phone.replace(/\D/g, "").length < 9) {
    return NextResponse.json(
      { message: "Hakuna namba ya simu sahihi kwenye oda hii." },
      { status: 400 },
    );
  }

  const result = await createCollection({
    amount,
    phone,
    channel,
    reference: order.reference,
    description: `IAA Marketplace — ${order.business?.name ?? "oda"}`,
    customerEmail: user.email ?? undefined,
  });

  if (!result.ok) {
    await admin
      .from("orders")
      .update({ payment_status: "failed", provider: "snippe", payment_channel: channel })
      .eq("id", order.id);

    return NextResponse.json(
      { message: result.message, paymentStatus: "failed" },
      { status: 502 },
    );
  }

  await admin
    .from("orders")
    .update({
      provider: "snippe",
      provider_payment_id: result.id,
      payment_channel: channel,
      payment_status: "awaiting_payment",
    })
    .eq("id", order.id);

  return NextResponse.json({
    paymentStatus: "awaiting_payment",
    message: "Tumekutumia ombi la malipo kwenye simu yako. Kamilisha USSD push.",
  });
}
