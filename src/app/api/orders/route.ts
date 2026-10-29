import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/media";

const MAX_QUANTITY = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ message: "Hifadhidata haijaunganishwa." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Ingia kwanza kabla ya kuweka oda." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Ombi halinasoma." }, { status: 400 });
  }

  const businessId = String(body.businessId ?? "");
  const rawItems = Array.isArray(body.items) ? body.items : [];

  const items = rawItems
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      const menuItemId = UUID.test(String(item.menuItemId ?? "")) ? String(item.menuItemId) : null;
      const listingId = UUID.test(String(item.listingId ?? "")) ? String(item.listingId) : null;
      const quantity = Math.floor(Number(item.quantity) || 0);
      return {
        menuItemId,
        listingId,
        quantity: Math.max(1, Math.min(MAX_QUANTITY, quantity)),
      };
    })
    .filter((item) => item.menuItemId !== null || item.listingId !== null);

  const deliveryMethod = body.deliveryMethod === "delivery" ? "delivery" : "pickup";
  const contactPhone = String(body.contactPhone ?? "").replace(/[^\d+]/g, "");
  const deliveryAddress = String(body.deliveryAddress ?? "").slice(0, 240);
  const note = String(body.note ?? "").slice(0, 300);

  if (!UUID.test(businessId) || items.length === 0) {
    return NextResponse.json({ message: "Chagua angalayo kipande kimoja." }, { status: 400 });
  }
  if (contactPhone.replace(/\D/g, "").length < 9) {
    return NextResponse.json(
      { message: "Weka namba ya simu inayoweza kupigwa." },
      { status: 400 },
    );
  }
  if (deliveryMethod === "delivery" && deliveryAddress.trim().length < 5) {
    return NextResponse.json(
      { message: "Weka anwani ambayo muuzi atakupigia." },
      { status: 400 },
    );
  }

  // Bei, jina na jumla huhukumiwa na triggers za hifadhidata, hivyo thamani
  // zilizotumwa na kivinjari hazwezi kubadilisha kile kinachoandikwa.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: user.id,
      business_id: businessId,
      status: "pending",
      payment_status: "unpaid",
      delivery_method: deliveryMethod,
      contact_phone: contactPhone,
      delivery_address: deliveryAddress.trim(),
      note: note.trim(),
    })
    .select("id, reference")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ message: orderError?.message ?? "Oda haikawezekana." }, { status: 400 });
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      listing_id: item.listingId,
      quantity: item.quantity,
    })),
  );

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ message: itemsError.message }, { status: 400 });
  }

  return NextResponse.json({ orderId: order.id, reference: order.reference });
}
