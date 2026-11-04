"use client";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import type { DeliveryZone } from "@/lib/types";

/**
 * Maeneo ambayo duka hili linapelekea. Muuzi huchagua kutoka orodha ya
 * msimamizi; kutochagua chochote kunaacha duka likitumikia kila eneo hai.
 */
export default function BusinessZonesPicker({
  businessId,
  zones,
  selected,
}: {
  businessId: string;
  zones: DeliveryZone[];
  selected: string[];
}) {
  const { t } = useLanguage();
  const [picked, setPicked] = useState<Set<string>>(new Set(selected));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; bad: boolean } | null>(null);

  function toggle(id: string) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setNotice(null);
  }

  async function save() {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/business/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, zoneIds: [...picked] }),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setNotice({ text: body.message ?? t.common.error, bad: true });
        return;
      }
      setNotice({ text: t.zones.mineSaved, bad: false });
    } catch {
      setNotice({ text: t.common.error, bad: true });
    } finally {
      setBusy(false);
    }
  }

  if (zones.length === 0) {
    return (
      <section className="space-y-3 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold tracking-tight text-ink-900">{t.zones.mineTitle}</h2>
        <p className="text-sm text-gray-500">{t.zones.mineEmpty}</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-extrabold tracking-tight text-ink-900">{t.zones.mineTitle}</h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">{t.zones.mineDesc}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {zones.map((zone) => {
          const isChecked = picked.has(zone.id);
          return (
            <label
              key={zone.id}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border bg-white p-3 transition ${
                isChecked
                  ? "border-primary-800 ring-2 ring-primary-100"
                  : "border-black/5 hover:border-primary-200"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(zone.id)}
                className="mt-1 h-4 w-4 accent-[#10497e]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink-900">{zone.name}</span>
                {zone.note && <span className="block text-xs text-gray-500">{zone.note}</span>}
              </span>
            </label>
          );
        })}
      </div>

      <p className="text-xs text-gray-500">
        {picked.size > 0
          ? fill(t.zones.mineSelected, { count: String(picked.size) })
          : t.zones.mineNone}
      </p>

      {notice && (
        <p
          role={notice.bad ? "alert" : "status"}
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            notice.bad ? "bg-accent-100 text-accent-600" : "bg-primary-50 text-primary-800"
          }`}
        >
          {notice.text}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900 disabled:opacity-60"
      >
        {busy && <LoaderCircle size={16} className="animate-spin" />}
        {t.zones.save}
      </button>
    </section>
  );
}
