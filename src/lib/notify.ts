import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { dictFor } from "@/lib/i18n";
import { formatTzs } from "@/lib/data";
import { sendEmail, isBrevoConfigured, isUsableEmail } from "@/lib/brevo";
import { sendSms, isNextSmsConfigured, isUsableMsisdn, toMsisdn } from "@/lib/nextsms";
import type { Order, OrderItem } from "@/lib/types";

export type NotifyStage = "created" | "status" | "paid" | "failed" | "refunded";

const TZ = "Africa/Dar_es_Salaam";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Snapshot = {
  id: string;
  reference: string;
  status: string;
  payment_status: string;
  items_total: number;
  discount: number;
  offer_label: string;
  delivery_fee: number;
  total: number;
  delivery_method: "pickup" | "delivery";
  delivery_address: string;
  meetup_point: string;
  note: string;
  scheduled_at: string | null;
  payment_channel: string;
  businessName: string;
  businessVerified: boolean;
  businessLocation: string;
  sellerPhones: string[];
  buyerName: string;
  buyerPhones: string[];
  buyerEmail: string;
  items: Pick<OrderItem, "name" | "unit_price" | "quantity">[];
};

export type NotifyReport = {
  attempted: boolean;
  sms: { to: string; role: string; ok: boolean; message: string }[];
  email: { to: string; ok: boolean; message: string } | null;
  logged: boolean;
};

/** Saa ya Dar_es_Salaam — mnunuzi na muuzi waone muda uleule. */
function formatWhen(iso: string): string {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "";
  return new Intl.DateTimeFormat("sw-TZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(when);
}

async function loadSnapshot(orderId: string): Promise<Snapshot | null> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("orders")
    .select(
      "*, business:businesses(id, name, slug, phone, whatsapp, location, is_verified), buyer:profiles(id, full_name, phone)",
    )
    .eq("id", orderId)
    .maybeSingle();

  const order = data as unknown as (Order & {
    business?: {
      phone?: string | null;
      whatsapp?: string | null;
      location?: string | null;
      is_verified?: boolean;
    };
    buyer?: { full_name?: string | null; phone?: string | null };
  }) | null;

  if (!order) return null;

  const [itemsResult, settingsResult] = await Promise.all([
    admin
      .from("order_items")
      .select("name, unit_price, quantity")
      .eq("order_id", order.id)
      .order("id"),
    admin.from("app_settings").select("key, value").in("key", ["support_phone"]),
  ]);

  // Barua pepe ya mnunuzi iko kwenye `auth.users`, si `profiles`, kwa hivyo
  // husomwa kwa fungo la service_role — upande wa seva pekee.
  const { data: authUser } = await admin.auth.admin.getUserById(order.buyer_id);

  const supportPhone = String(
    (settingsResult.data ?? []).find((row: { key: string; value: string }) => row.key === "support_phone")
      ?.value ?? "",
  );

  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    payment_status: order.payment_status,
    items_total: Number(order.items_total),
    discount: Number(order.discount ?? 0),
    offer_label: order.offer_label ?? "",
    delivery_fee: Number(order.delivery_fee),
    total: Number(order.total),
    delivery_method: order.delivery_method,
    delivery_address: order.delivery_address,
    meetup_point: order.meetup_point ?? "",
    note: order.note ?? "",
    scheduled_at: order.scheduled_at,
    payment_channel: order.payment_channel ?? "",
    businessName: order.business?.name ?? "Muuzi",
    businessVerified: Boolean(order.business?.is_verified),
    businessLocation: order.business?.location ?? "",
    sellerPhones: [order.business?.phone, order.business?.whatsapp, supportPhone].filter(
      Boolean,
    ) as string[],
    buyerName: order.buyer?.full_name || authUser?.user?.email?.split("@")[0] || "mteja",
    buyerPhones: [order.contact_phone, order.buyer?.phone].filter(Boolean) as string[],
    buyerEmail: authUser?.user?.email ?? "",
    items: (itemsResult.data ?? []) as Snapshot["items"],
  };
}

function money(n: number): string {
  return formatTzs(Math.round(n));
}

function itemsBrief(snap: Snapshot): string {
  return snap.items.map((item) => `${item.quantity}x ${item.name}`).join(", ");
}

function methodLine(snap: Snapshot, audience: "buyer" | "seller" = "buyer"): string {
  const t = dictFor("sw");
  if (audience === "buyer") {
    return snap.delivery_method === "delivery"
      ? `${t.checkout.delivery}: ${snap.delivery_address || "anwani uliyotoa"}`
      : `${t.checkout.pickup}: ${snap.meetup_point || snap.businessLocation || snap.businessName}`;
  }
  return snap.delivery_method === "delivery"
    ? `Kupelekwa: ${snap.delivery_address || "anwani aliyotoa"}`
    : `Kuchukua: ${snap.meetup_point || snap.businessLocation || snap.businessName}`;
}

function timeLine(snap: Snapshot): string {
  const when = snap.scheduled_at ? formatWhen(snap.scheduled_at) : "";
  return when ? `Muda: ${when}` : "Muda: haraka iwezekanavyo";
}

function payWord(snap: Snapshot): string {
  return snap.payment_status === "paid" ? "imelipwa" : "haijalipwa";
}

function join(...parts: (string | false)[]): string {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Kichwa cha kila hatua kwa upande wowote. Maneno ya hali husomwa kwenye
 * kamusi ileile ya UI (`status`) ili SMS, barua pepe na ukurasa vyaongee lugha moja.
 */
function headlines(
  snap: Snapshot,
  stage: NotifyStage,
): { buyer: string; seller: string } {
  const t = dictFor("sw");
  const statusLabel = t.status[snap.status as keyof typeof t.status] ?? snap.status;

  if (stage === "created") {
    return {
      buyer: `Karibu IAA Marketplace! Oda ${snap.reference} kutoka ${snap.businessName} imepokelewa.`,
      seller: `Oda mpya ${snap.reference} kutoka ${snap.buyerName}: ${itemsBrief(snap)}.`,
    };
  }

  if (stage === "paid") {
    const channel = snap.payment_channel ? ` (${snap.payment_channel})` : "";
    return {
      buyer: `Oda ${snap.reference}: malipo ${money(snap.total)} yamepokelewa${channel}.`,
      seller: `Oda ${snap.reference} imelipwa ${money(snap.total)}${channel}. Anza kuandaa.`,
    };
  }

  if (stage === "failed") {
    return {
      buyer: `Oda ${snap.reference}: malipo hayakufaulu.`,
      seller: `Malipo ya oda ${snap.reference} hayakufaulu — ${snap.buyerName} atajaribu tena.`,
    };
  }

  if (stage === "refunded") {
    return {
      buyer: `Oda ${snap.reference}: ${money(snap.total)} imerejeshwa.`,
      seller: `Oda ${snap.reference}: pesa ${money(snap.total)} imerejeshwa kwa mnunuzi.`,
    };
  }

  const buyerExtra =
    snap.status === "ready"
      ? snap.delivery_method === "pickup"
        ? "Njoo ukichukue."
        : "Muuzi atakupigia kabla ya kuikupeleka."
      : snap.status === "completed"
        ? "Asante! Andika maoni kwenye oda ili wengine waamini zaidi."
        : snap.status === "cancelled"
          ? "Usilipe chochote. Pesa iliyolipwa itarejeshwa."
          : "";

  return {
    buyer: join(
      `Oda ${snap.reference} (${snap.businessName}) — hali mpya: ${statusLabel}.`,
      buyerExtra,
    ),
    seller: `Oda ${snap.reference} — hali: ${statusLabel} (imethibitishwa kwenye mfumo).`,
  };
}

/** SMS ya mnunuzi: fupi, lakini ikiwa na jumla, njia na muda. */
export function buildBuyerSms(snap: Snapshot, stage: NotifyStage): string {
  const { buyer } = headlines(snap, stage);
  const isMoneyStage = stage === "created" || stage === "status";

  return join(
    buyer,
    stage === "created" ? `Vipande: ${itemsBrief(snap)}.` : false,
    isMoneyStage
      ? join(
          `Jumla ${money(snap.total)}`,
          snap.delivery_fee > 0 ? `(delivery ${money(snap.delivery_fee)})` : false,
          `— ${payWord(snap)}.`,
        )
      : false,
    methodLine(snap),
    timeLine(snap),
    stage === "created" && snap.payment_status === "unpaid"
      ? `Lipa kwenye ${SITE_URL}/orders`
      : false,
  );
}

/** SMS ya muuzi: kile anachopaswa kufanya, na kiungo cha dashibodi. */
export function buildSellerSms(snap: Snapshot, stage: NotifyStage): string {
  const { seller } = headlines(snap, stage);
  const isMoneyStage = stage === "created" || stage === "status";

  return join(
    seller,
    isMoneyStage ? `Jumla ${money(snap.total)} — ${payWord(snap)}.` : false,
    methodLine(snap, "seller"),
    timeLine(snap),
    stage === "created" && snap.note ? `Mnunuzi alisema: ${snap.note}` : false,
    `Tazama: ${SITE_URL}/dashboard/orders`,
  );
}

/** Barua pepe kamili — plain text, haihitaji picha wala HTML. */
export function buildEmail(snap: Snapshot, stage: NotifyStage): { subject: string; text: string } {
  const t = dictFor("sw");
  const { buyer } = headlines(snap, stage);
  const statusLabel = t.status[snap.status as keyof typeof t.status] ?? snap.status;
  const payLabel = t.status[snap.payment_status as keyof typeof t.status] ?? snap.payment_status;

  const lines: string[] = [
    `Habari ${snap.buyerName},`,
    "",
    buyer,
    "",
    `Namba ya oda: ${snap.reference}`,
    `Biashara: ${snap.businessName}${snap.businessVerified ? " (Verified)" : ""}`,
    `Hali ya oda: ${statusLabel}`,
    `Hali ya malipo: ${payLabel}`,
    "",
    "Vipande:",
    ...snap.items.map(
      (item) =>
        `- ${item.quantity} x ${item.name} — ${money(Number(item.unit_price))} kila kimoja = ${money(
          Number(item.unit_price) * item.quantity,
        )}`,
    ),
    "",
    `Jumla ya vipande: ${money(snap.items_total)}`,
  ];

  if (snap.discount > 0) {
    lines.push(`Punguzo${snap.offer_label ? ` (${snap.offer_label})` : ""}: -${money(snap.discount)}`);
  }
  if (snap.delivery_fee > 0) {
    lines.push(`Gharama ya delivery: ${money(snap.delivery_fee)}`);
  }

  const method = methodLine(snap);

  lines.push(`JUMLA YOTE: ${money(snap.total)}`, "", method, timeLine(snap));

  // Kwa pickup, mahali pa kukutiana tayari kumoja kwenye mstari wa njia —
  // usikirudie mara mbili.
  if (snap.meetup_point && !method.includes(snap.meetup_point)) {
    lines.push(`Mahali pa kukutiana: ${snap.meetup_point}`);
  }
  if (snap.note) lines.push(`Ujumbe wako kwa muuzi: ${snap.note}`);

  lines.push(
    "",
    snap.payment_status === "unpaid"
      ? `Lipa na ufuatilie oda yako: ${SITE_URL}/orders/${snap.id}`
      : `Ufuatilie oda yako: ${SITE_URL}/orders/${snap.id}`,
    "",
    "Ujumbe huu umetumwa na IAA Marketplace (Institute of Accountancy Arusha).",
  );

  return {
    subject: `Oda ${snap.reference} · ${money(snap.total)} · ${snap.businessName}`,
    text: lines.join("\n"),
  };
}

function summarize(sms: NotifyReport["sms"], email: NotifyReport["email"]): string {
  const bits: string[] = [];
  for (const message of sms) {
    bits.push(
      `SMS ${message.role} ${message.ok ? "imetumwa" : `imeshindwa (${message.message})`}`,
    );
  }
  if (email) {
    bits.push(email.ok ? "barua pepe imetumwa" : `barua pepe imeshindwa (${email.message})`);
  }
  return `ujumbe: ${bits.join(", ")}`;
}

/**
 * Hutuma ujumbe kwa mnunuzi (SMS + barua pepe) na muuzi (SMS). Kosa la
 * mtoaji halipaswi kuangusha oda; matokeo huandikwa kwenye `order_events`
 * ili uhalisia uonekane badala ya kudhani ujumbe ulifikia.
 */
export async function notifyOrderStage(
  orderId: string,
  stage: NotifyStage,
): Promise<NotifyReport> {
  const report: NotifyReport = { attempted: false, sms: [], email: null, logged: false };

  if (!isAdminClientConfigured) return report;

  let snap: Snapshot | null = null;
  try {
    snap = await loadSnapshot(orderId);
  } catch (error) {
    console.error("notify: haiwezi kusoma oda", (error as Error).message);
    return report;
  }
  if (!snap) return report;

  if (isNextSmsConfigured) {
    const jobs: { phone: string; role: string; text: string }[] = [];
    const buyerTo = snap.buyerPhones.filter(isUsableMsisdn).map(toMsisdn)[0];
    if (buyerTo) jobs.push({ phone: buyerTo, role: "mnunuzi", text: buildBuyerSms(snap, stage) });

    const sellerTo = snap.sellerPhones.filter(isUsableMsisdn).map(toMsisdn)[0];
    if (sellerTo && sellerTo !== buyerTo) {
      jobs.push({ phone: sellerTo, role: "muuzi", text: buildSellerSms(snap, stage) });
    }

    for (const job of jobs) {
      const result = await sendSms(job.phone, job.text);
      report.sms.push({
        to: job.phone,
        role: job.role,
        ok: result.ok,
        message: result.ok ? String(result.messageId) : result.message,
      });
    }
  }

  if (isBrevoConfigured && snap.buyerEmail && isUsableEmail(snap.buyerEmail)) {
    const { subject, text } = buildEmail(snap, stage);
    const result = await sendEmail({
      to: snap.buyerEmail,
      toName: snap.buyerName,
      subject,
      text,
    });
    report.email = {
      to: snap.buyerEmail,
      ok: result.ok,
      message: result.ok ? result.messageId : result.message,
    };
  }

  report.attempted = report.sms.length > 0 || report.email !== null;

  if (report.attempted) {
    try {
      const admin = createAdminClient();
      await admin.from("order_events").insert({
        order_id: snap.id,
        status: snap.status,
        note: summarize(report.sms, report.email).slice(0, 400),
      });
      report.logged = true;
    } catch (error) {
      console.error("notify: matokeo hayakuandikwa kwenye order_events", (error as Error).message);
    }
  }

  return report;
}
