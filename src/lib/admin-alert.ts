import { isBrevoConfigured, sendEmail } from "./brevo";

export type ProblemReport = {
  where: string;
  message: string;
  page?: string;
  detail?: string;
};

const TO = process.env.ADMIN_ALERT_EMAIL || process.env.NOTIFY_EMAIL_FROM || "";

/**
 * Makosa ya kiufundi (API, database, SMTP) huenda kwa msimamizi pekee.
 * Mtumiaji huonyeshwa ujumbe mfupi wa Kiswahili; maelezo kamili hayatoki
 * kwenye screen wala kwenye console ya kivinjari chake.
 */
export async function alertAdmin(report: ProblemReport): Promise<void> {
  const lines = [
    `Sehemu: ${report.where}`,
    `Ukurasa: ${report.page || "-"}`,
    `Muda: ${new Date().toISOString()}`,
    "",
    report.message,
  ];
  if (report.detail) lines.push("", report.detail);

  console.error("[tatizo]", lines.join(" | "));

  if (!TO || !isBrevoConfigured) return;

  const result = await sendEmail({
    to: TO,
    subject: `IAA Marketplace: tatizo kwenye ${report.where}`,
    text: lines.join("\n"),
  });
  if (!result.ok) console.error("[admin-alert] imeshindwa:", result.message);
}
