const SEND_URL = "https://api.brevo.com/v3/smtp/email";

const apiKey = process.env.BREVO_API_KEY;
const fromEmail = process.env.NOTIFY_EMAIL_FROM;
const fromName = process.env.NOTIFY_EMAIL_NAME ?? "IAA Marketplace";

/** Barua pepe za oda hutumwa kupitia Brevo; bila fungo hizi zimazimwa. */
export const isBrevoConfigured = Boolean(apiKey && fromEmail);

export type EmailResult = { ok: true; messageId: string } | { ok: false; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isUsableEmail(raw: string): boolean {
  return EMAIL.test(String(raw ?? "").trim());
}

/**
 * `textContent` hutumika badala ya HTML — ujumbe wa oda husomwa kwenye simu,
 * na hakuna picha au viungo vinavyohitajika ili mnunuzi athibitishe oda yake.
 */
export async function sendEmail(input: {
  to: string;
  toName?: string;
  subject: string;
  text: string;
}): Promise<EmailResult> {
  if (!apiKey || !fromEmail) {
    return { ok: false, message: "Barua pepe haijawashwa (BREVO_API_KEY/NOTIFY_EMAIL_FROM)." };
  }
  if (!isUsableEmail(input.to)) {
    return { ok: false, message: "Anwani ya barua pepe haikubaliki." };
  }

  let response: Response;
  try {
    response = await fetch(SEND_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: input.to.trim(), name: input.toName || undefined }],
        subject: input.subject,
        textContent: input.text,
      }),
    });
  } catch (error) {
    return { ok: false, message: `Muunganisho umeshindwa: ${(error as Error).message}` };
  }

  const body = await response.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = body ? (JSON.parse(body) as Record<string, unknown>) : {};
  } catch {
    parsed = { message: body.slice(0, 180) };
  }

  if (!response.ok) {
    const detail = String(parsed.message ?? parsed.code ?? `HTTP ${response.status}`);
    return { ok: false, message: `${response.status} ${detail}`.trim() };
  }

  return { ok: true, messageId: String(parsed.messageId ?? "") };
}
