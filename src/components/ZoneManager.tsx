"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import type { DeliveryZone } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Orodha ya maeneo ya chuo. Msimamizi ndiye anayeitunza; mnunuzi huchagua
 * kutoka hapa kwenye checkout, muuzi huamua tu gharama ya upelekezaji.
 */
export default function ZoneManager({ zones }: { zones: DeliveryZone[] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [sortOrder, setSortOrder] = useState(String(zones.length));
  const [editing, setEditing] = useState<DeliveryZone | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; bad: boolean } | null>(null);

  async function send(body: Record<string, unknown>, successText: string) {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setNotice({ text: payload.message ?? t.common.error, bad: true });
        return;
      }
      setNotice({ text: successText, bad: false });
      router.refresh();
    } catch {
      setNotice({ text: t.common.error, bad: true });
    } finally {
      setBusy(false);
    }
  }

  function startEdit(zone: DeliveryZone) {
    setEditing(zone);
    setName(zone.name);
    setNote(zone.note ?? "");
    setSortOrder(String(zone.sort_order));
    setNotice(null);
  }

  function stopEdit() {
    setEditing(null);
    setName("");
    setNote("");
    setSortOrder(String(zones.length));
  }

  async function submit() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNotice({ text: t.zones.needName, bad: true });
      return;
    }
    const payload = {
      name: trimmed,
      note: note.trim(),
      sortOrder: Number(sortOrder) || 0,
      isActive: editing ? editing.is_active : true,
    };
    if (editing && UUID.test(editing.id)) {
      await send({ ...payload, action: "update", id: editing.id }, fill(t.zones.updated, { name: trimmed }));
      stopEdit();
    } else {
      await send({ ...payload, action: "create" }, fill(t.zones.created, { name: trimmed }));
      stopEdit();
    }
  }

  async function toggleActive(zone: DeliveryZone) {
    await send(
      {
        action: "update",
        id: zone.id,
        name: zone.name,
        note: zone.note ?? "",
        sortOrder: zone.sort_order,
        isActive: !zone.is_active,
      },
      zone.is_active ? t.zones.inactive : t.zones.active,
    );
  }

  async function remove(zone: DeliveryZone) {
    if (!confirm(t.zones.deleteConfirm)) return;
    if (editing?.id === zone.id) stopEdit();
    await send({ action: "delete", id: zone.id }, fill(t.zones.removed, { name: zone.name }));
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold tracking-tight text-ink-900">
          {editing ? fill(t.zones.editing, { name: editing.name }) : t.zones.add}
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className="text-sm font-bold text-ink-900">{t.zones.name}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              placeholder={t.zones.namePlaceholder}
              className="field mt-1.5 w-full"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-ink-900">{t.zones.order}</span>
            <input
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              className="field mt-1.5 w-full"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-bold text-ink-900">
            {t.zones.note} <span className="font-medium text-gray-600">{t.common.optional}</span>
          </span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={160}
            placeholder={t.zones.notePlaceholder}
            className="field mt-1.5 w-full"
          />
        </label>

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

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900 disabled:opacity-60"
          >
            {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
            {t.zones.save}
          </button>
          {editing && (
            <button
              type="button"
              onClick={stopEdit}
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-bold text-gray-600 transition hover:bg-paper-100"
            >
              {t.zones.cancel}
            </button>
          )}
        </div>
      </section>

      <section className="space-y-3">
        {zones.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-primary-200 bg-white px-6 py-8 text-center text-sm text-gray-500">
            {t.zones.empty}
          </p>
        ) : (
          <ul className="space-y-2">
            {zones.map((zone) => (
              <li
                key={zone.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-ink-900">{zone.name}</p>
                  {zone.note && <p className="mt-1 text-xs text-gray-500">{zone.note}</p>}
                  <p className="mt-1 text-xs text-gray-500">
                    {t.zones.order}: {zone.sort_order}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    zone.is_active
                      ? "bg-primary-100 text-primary-800"
                      : "bg-paper-100 text-gray-500"
                  }`}
                >
                  {zone.is_active ? t.zones.active : t.zones.inactive}
                </span>

                <button
                  type="button"
                  onClick={() => toggleActive(zone)}
                  disabled={busy}
                  className="rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-ink-900 transition hover:border-primary-400 disabled:opacity-50"
                >
                  {zone.is_active ? t.admin.turnOff : t.admin.turnOn}
                </button>

                <button
                  type="button"
                  onClick={() => startEdit(zone)}
                  aria-label={fill(t.zones.editing, { name: zone.name })}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-ink-900 transition hover:border-primary-400"
                >
                  <Pencil size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => remove(zone)}
                  disabled={busy}
                  aria-label={t.zones.deleteConfirm}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-accent-400 text-accent-600 transition hover:bg-accent-100 disabled:opacity-50"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
