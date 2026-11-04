"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { CourierStatus } from "@/lib/types";

/**
 * Kuomba usabishi. Mtu huweka maombi tu; msimamizi ndiye anayeidhinisha,
 * kwa hivyo hakuna kitufe cha "nijie mise" hapa.
 */
export default function CourierRequest({
  status,
  hasPhone,
}: {
  status: CourierStatus;
  hasPhone: boolean;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const note =
    status === "approved"
      ? t.courier.approved
      : status === "pending"
        ? t.courier.pending
        : status === "rejected"
          ? t.courier.rejected
          : t.courier.none;

  async function send(action: "request" | "withdraw") {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/courier/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (response.ok) {
        router.refresh();
        setMessage(action === "request" ? t.courier.requested : t.courier.rejected);
        return;
      }
      setMessage(body.message ?? t.common.error);
    } catch {
      setMessage(t.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
      <p className="text-[15px] leading-relaxed text-gray-600">{note}</p>

      {message && (
        <p role="status" className="rounded-xl bg-paper-100 px-4 py-3 text-sm text-ink-900">
          {message}
        </p>
      )}

      {status === "pending" ? (
        <button
          type="button"
          onClick={() => send("withdraw")}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-600 transition hover:bg-paper-100 disabled:opacity-60"
        >
          {busy && <Loader2 size={15} className="animate-spin" aria-hidden />}
          {t.courier.withdraw}
        </button>
      ) : status === "approved" ? (
        <p className="text-sm font-bold text-primary-800">{t.courier.approved}</p>
      ) : (
        <button
          type="button"
          onClick={() => send("request")}
          disabled={busy || !hasPhone}
          title={hasPhone ? undefined : t.api.needPhone}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-900 disabled:opacity-60"
        >
          {busy && <Loader2 size={15} className="animate-spin" aria-hidden />}
          {busy ? t.courier.requesting : t.courier.request}
        </button>
      )}

      {!hasPhone && status !== "approved" && (
        <p className="text-xs leading-relaxed text-gray-500">{t.api.needPhone}</p>
      )}
    </section>
  );
}
