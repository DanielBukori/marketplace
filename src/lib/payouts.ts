import type { SupabaseClient } from "@supabase/supabase-js";
import { snippeFeeRate, type SnippeChannel } from "@/lib/snippe";
import type { Order, Payout } from "@/lib/types";

/** Pesa ambayo muuzi anapokea baada ya toleo la Snippe kutolewa. */
export function payoutSplit(total: number) {
  const fee = Math.round(total * snippeFeeRate);
  return { fee, net: total - fee };
}

/**
 * Huunda foli ya kulipa muuzi mara baada ya pesa kuthibitishwa. Oda moja
 * hupata foli moja tu (kipindi cha `payouts_order_key`), kwa hivyo webhook
 * inayorudiwa haiongezi pesa mara mbili.
 */
export async function queuePayoutForPaidOrder(
  admin: SupabaseClient,
  order: Order,
  channel: SnippeChannel,
): Promise<Payout | null> {
  const { data: business } = await admin
    .from("businesses")
    .select("id, phone, whatsapp")
    .eq("id", order.business_id)
    .maybeSingle<{ id: string; phone: string | null; whatsapp: string | null }>();

  const { fee, net } = payoutSplit(Number(order.total));

  const { data, error } = await admin
    .from("payouts")
    .insert({
      business_id: order.business_id,
      order_id: order.id,
      amount: net,
      fee,
      method: channel,
      destination: business?.phone || business?.whatsapp || "",
      reference: `PO-${order.reference}`,
      status: "queued",
    })
    .select("*")
    .maybeSingle();

  if (error) return null;
  return (data ?? null) as unknown as Payout | null;
}
