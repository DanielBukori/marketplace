const SEND_URL = "https://messaging-service.co.tz/api/sms/v2/text/single";

const token = process.env.NEXTSMS_API_TOKEN;
const senderId = process.env.NEXTSMS_SENDER_ID;

/** NextSMS hupokea Sender ID iliyosajiliwa; bila hiyo SMS haiwezi kutumwa. */
export const isNextSmsConfigured = Boolean(token && senderId);

export type SmsResult =
  | { ok: true; messageId: string; price: number }
  | { ok: false; message: string };

/**
 * NextSMS hutumia MSISDN ya kimataifa bila `+` na bila sifuri ya mwanzo
 * (mf. 255712345678). Namba za ndani `07…`/`06…` hubadilishwa kuwa 255.
 */
export function toMsisdn(raw: string): string {
  const digits = String(raw ?? "").replace(/[^\d]/g, "");
  if (digits.startsWith("255")) return digits;
  if (digits.startsWith("0")) return `255${digits.slice(1)}`;
  if (digits.length >= 9) return `255${digits}`;
  return digits;
}

export function isUsableMsisdn(raw: string): boolean {
  const msisdn = toMsisdn(raw);
  return /^255[67]\d{7,8}$/.test(msisdn) || /^\d{8,15}$/.test(msisdn);
}

/** Jibu la NextSMS ni array ya matokeo kwa kila namba; tunatafuta la kwanza. */
function firstEntry(parsed: unknown): Record<string, unknown> {
  if (Array.isArray(parsed)) {
    const first = parsed[0];
    return first && typeof first === "object" ? (first as Record<string, unknown>) : {};
  }
  if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  return {};
}

function readString(entry: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = entry[key];
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return "";
}

export async function sendSms(to: string, text: string): Promise<SmsResult> {
  if (!token || !senderId) {
    return { ok: false, message: "SMS haijawashwa (NEXTSMS_API_TOKEN/NEXTSMS_SENDER_ID)." };
  }

  const msisdn = toMsisdn(to);
  if (!msisdn) return { ok: false, message: "Namba ya simu haipaswi kutumwa." };

  let response: Response;
  try {
    response = await fetch(SEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: senderId, to: [msisdn], text }),
    });
  } catch (error) {
    return { ok: false, message: `Muunganisho umeshindwa: ${(error as Error).message}` };
  }

  const body = await response.text();
  let parsed: unknown = {};
  try {
    parsed = body ? JSON.parse(body) : {};
  } catch {
    parsed = { raw: body };
  }

  const entry = firstEntry(parsed);
  const status = readString(entry, ["status", "state", "message"]);

  if (!response.ok) {
    return {
      ok: false,
      message: `${response.status} ${status || readString(entry, ["error", "detail"]) || "kosa"}`.trim(),
    };
  }

  // Baadhi ya mijito ya NextSMS hujibu `200` lakini iweke `status: "failed"`,
  // kwa hivyo hali ya kujibu lazima isomwe, si HTTP pekee.
  if (/fail|invalid|error|rejected/i.test(status)) {
    return { ok: false, message: status };
  }

  return {
    ok: true,
    messageId: readString(entry, ["messageId", "message_id", "id"]),
    price: Number(readString(entry, ["price", "cost"]) || 0),
  };
}
