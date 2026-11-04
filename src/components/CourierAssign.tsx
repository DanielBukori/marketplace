"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import type { Profile } from "@/lib/types";

/**
 * Mpangilio wa msabishi. Muuzi ndiye anayemchagua — mfumo hauwezi kumpanga
 * mtu, na malipo ya msabishi hufanyika nje ya jukwaa hili.
 */
export default function CourierAssign({
  orderId,
  couriers,
  currentId,
}: {
  orderId: string;
  couriers: Profile[];
  currentId: string | null;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function assign(courierId: string | null) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/courier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courierId }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
        name?: string;
        cleared?: boolean;
      };
      if (!response.ok) {
        setMessage(body.message ?? t.common.error);
        return;
      }
      setMessage(
        body.cleared
          ? t.courier.assignCleared
          : fill(t.courier.assignSaved, { name: body.name ?? "" }),
      );
      router.refresh();
    } catch {
      setMessage(t.common.error);
    } finally {
      setBusy(false);
    }
  }

  if (couriers.length === 0) {
    return (
      <p className="text-xs leading-relaxed text-gray-500">{t.courier.noCouriers}</p>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
          {t.courier.assignTitle}
        </span>
        <select
          value={currentId ?? ""}
          disabled={busy}
          onChange={(event) => assign(event.target.value || null)}
          aria-label={t.courier.assignTitle}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-ink-900 focus:border-primary-500 focus:outline-none disabled:opacity-60"
        >
          <option value="">{t.courier.assignSelfOption}</option>
          {couriers.map((courier) => (
            <option key={courier.id} value={courier.id}>
              {courier.full_name}
            </option>
          ))}
        </select>
      </label>

      {busy && (
        <p className="flex items-center gap-2 text-xs text-gray-500">
          <LoaderCircle size={13} className="animate-spin" /> {t.courier.assignPick}
        </p>
      )}
      {message && (
        <p role="status" className="text-xs font-semibold text-primary-800">
          {message}
        </p>
      )}
      <p className="text-xs leading-relaxed text-gray-500">{t.courier.moneyNote}</p>
    </div>
  );
}
