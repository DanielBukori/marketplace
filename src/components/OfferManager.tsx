"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2, Percent, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { fill } from "@/lib/i18n";
import { formatTzs } from "@/lib/data";
import type { Offer, OfferScope } from "@/lib/types";

const SCOPES: OfferScope[] = ["items", "delivery", "all"];

/**
 * Muuzi anaweka punguzo lake mwenyewe — asilimia, kikomo cha chini na
 * muda wa mwisho. Kiasi halisi kinahesabiwa na hifadhidata wakati wa oda,
 * kwa hivyo kubadilisha ofu hapa hakubadilishi oda zilizopita.
 */
export default function OfferManager({
  businessId,
  businessName,
  offers,
}: {
  businessId: string;
  businessName: string;
  offers: Offer[];
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [percent, setPercent] = useState("10");
  const [scope, setScope] = useState<OfferScope>("items");
  const [minTotal, setMinTotal] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addOffer(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const rate = Math.floor(Number(percent));
    if (!Number.isFinite(rate) || rate < 1 || rate > 90) {
      setError(t.offer.badPercent);
      return;
    }

    const minimum = Number(minTotal || 0);
    if (!Number.isFinite(minimum) || minimum < 0) {
      setError(t.offer.badMin);
      return;
    }

    const start = startsAt ? Date.parse(startsAt) : Date.now();
    const end = endsAt ? Date.parse(endsAt) : null;
    if (Number.isNaN(start)) {
      setError(t.offer.badStart);
      return;
    }
    if (end !== null && (Number.isNaN(end) || end <= start)) {
      setError(t.offer.badEnd);
      return;
    }

    setBusy(true);
    const { error: insertError } = await createClient().from("offers").insert({
      business_id: businessId,
      label: label.trim(),
      percent_off: rate,
      scope,
      min_items_total: minimum,
      starts_at: new Date(start).toISOString(),
      ends_at: end === null ? null : new Date(end).toISOString(),
      is_active: true,
    });
    setBusy(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setLabel("");
    setPercent("10");
    setMinTotal("");
    setStartsAt("");
    setEndsAt("");
    router.refresh();
  }

  async function patch(id: string, changes: Partial<Offer>) {
    setError(null);
    const { error: updateError } = await createClient()
      .from("offers")
      .update(changes)
      .eq("id", id);
    if (updateError) setError(updateError.message);
    else router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm(t.offer.removeConfirm)) return;
    setError(null);
    const { error: deleteError } = await createClient()
      .from("offers")
      .delete()
      .eq("id", id);
    if (deleteError) setError(deleteError.message);
    else router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={addOffer}
        className="space-y-5 rounded-3xl border border-black/5 bg-white p-6 shadow-sm"
      >
        <div>
          <h2 className="text-lg font-extrabold text-ink-900">{t.offer.addTitle}</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {fill(t.offer.addDesc, { name: businessName })}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.offer.label}>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              minLength={2}
              maxLength={40}
              placeholder={t.offer.labelPlaceholder}
              className="field"
            />
          </Field>
          <Field label={t.offer.percent}>
            <input
              type="number"
              min="1"
              max="90"
              step="1"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              required
              className="field"
            />
          </Field>
        </div>

        <Field label={t.offer.scopeLabel}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {SCOPES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setScope(value)}
                aria-pressed={scope === value}
                className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                  scope === value
                    ? "border-primary-800 bg-primary-800 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-primary-200"
                }`}
              >
                {t.offerScope[value]}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label={t.offer.min}>
            <input
              type="number"
              min="0"
              step="100"
              value={minTotal}
              onChange={(e) => setMinTotal(e.target.value)}
              placeholder="0"
              className="field"
            />
          </Field>
          <Field label={t.offer.starts}>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="field"
            />
          </Field>
          <Field label={t.offer.ends}>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="field"
            />
          </Field>
        </div>

        {error && (
          <p className="rounded-xl bg-accent-100 px-4 py-3 text-sm text-accent-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary-800 px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-primary-900 disabled:opacity-60"
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          {t.offer.add}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold text-ink-900">
          {fill(t.offer.current, { count: offers.length })}
        </h2>

        {offers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-primary-200 bg-white p-8 text-center text-[15px] text-gray-500">
            {t.offer.empty}
          </p>
        ) : (
          offers.map((offer) => (
            <article
              key={offer.id}
              className="flex flex-wrap items-center gap-4 rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-100 font-extrabold text-accent-600">
                {offer.percent_off}
                <Percent size={12} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink-900">{offer.label}</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {t.offerScope[offer.scope]}
                  {Number(offer.min_items_total) > 0 &&
                    ` · ${fill(t.offer.minNote, { min: formatTzs(Number(offer.min_items_total)) })}`}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {new Date(offer.starts_at).toLocaleString(t.localeDate)}
                  {offer.ends_at
                    ? ` → ${new Date(offer.ends_at).toLocaleString(t.localeDate)}`
                    : ` → ${t.offer.openEnded}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => patch(offer.id, { is_active: !offer.is_active })}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    offer.is_active
                      ? "bg-primary-100 text-primary-800 hover:bg-primary-200"
                      : "border border-black/5 bg-white text-gray-500 hover:bg-paper-100"
                  }`}
                >
                  {offer.is_active ? t.offer.on : t.dashboard.off}
                </button>
                <button
                  type="button"
                  onClick={() => remove(offer.id)}
                  aria-label={t.offer.removeAria}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent-400 text-accent-600 transition hover:bg-accent-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-ink-900">{label}</span>
      {children}
    </label>
  );
}
