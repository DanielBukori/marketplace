const BASE_URL = "https://api.snippe.sh";

export type SnippeChannel = "airtel" | "mpesa" | "mixx" | "halotel";

export type CollectionResult =
  | { ok: true; id: string; status: string; raw: unknown }
  | { ok: false; message: string };

const apiKey = process.env.SNIPPE_API_KEY;

export const isSnippeConfigured = Boolean(apiKey);

async function post(path: string, payload: unknown) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let parsed: unknown = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }

  return { status: response.status, parsed };
}

/** Snippe mara nyingi hifunga jibu ndani ya `data` au `payment`. */
function pick(parsed: unknown, keys: string[]): string {
  const body = (parsed ?? {}) as Record<string, unknown>;
  for (const source of [body, body.data, body.payment]) {
    if (!source || typeof source !== "object") continue;
    const record = source as Record<string, unknown>;
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" || typeof value === "number") return String(value);
    }
  }
  return "";
}

/**
 * Kuukusanya pesa kwa USSD push. Jina kamili la uwanja wa simu na channel
 * linapaswa kuthibitishwa na dokumenti za dashboard ya Snippe.
 */
export async function createCollection(input: {
  amount: number;
  phone: string;
  channel: SnippeChannel;
  reference: string;
  description: string;
  customerEmail?: string;
}): Promise<CollectionResult> {
  if (!apiKey) return { ok: false, message: "Snippe haijaunganishwa." };

  const { status, parsed } = await post("/v1/payments", {
    amount: Math.round(input.amount),
    currency: "TZS",
    type: "collection",
    channel: input.channel,
    phone: input.phone,
    email: input.customerEmail,
    reference: input.reference,
    description: input.description,
  });

  const id = pick(parsed, ["id"]);

  if (status >= 200 && status < 300 && id) {
    return { ok: true, id, status: pick(parsed, ["status"]) || "pending", raw: parsed };
  }

  return {
    ok: false,
    message: pick(parsed, ["message", "error"]) || `Snippe imerudisha ${status}.`,
  };
}

/** Kulipa muuzi (mobile money au benki) — fedha hutoka kwa mfumo kwenda kwake. */
export async function createDisbursement(input: {
  amount: number;
  phone: string;
  channel: SnippeChannel;
  reference: string;
}): Promise<CollectionResult> {
  if (!apiKey) return { ok: false, message: "Snippe haijaunganishwa." };

  const { status, parsed } = await post("/v1/disbursements", {
    amount: Math.round(input.amount),
    currency: "TZS",
    channel: input.channel,
    phone: input.phone,
    reference: input.reference,
  });

  const id = pick(parsed, ["id"]);

  if (status >= 200 && status < 300 && id) {
    return { ok: true, id, status: pick(parsed, ["status"]) || "pending", raw: parsed };
  }

  return {
    ok: false,
    message: pick(parsed, ["message", "error"]) || `Snippe imerudisha ${status}.`,
  };
}

export const snippeFeeRate = 0.025;
