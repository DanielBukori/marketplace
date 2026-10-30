"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { formatTzs } from "@/lib/data";
import type { AdPlacement, AdPlan } from "@/lib/types";

const PLACEMENTS: AdPlacement[] = ["home", "msosi", "market"];

function emptyDraft() {
  return {
    name: "",
    description: "",
    placement: "msosi" as AdPlacement,
    perDay: "",
    perWeek: "",
    perMonth: "",
    maxDays: "7",
  };
}

export default function AdPlansManager({ plans }: { plans: AdPlan[] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [draft, setDraft] = useState(emptyDraft());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const numbers = [draft.perDay, draft.perWeek, draft.perMonth].map(Number);
  const invalid = numbers.some((value) => Number.isNaN(value) || value < 0);

  function set<K extends keyof ReturnType<typeof emptyDraft>>(
    key: K,
    value: ReturnType<typeof emptyDraft>[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function add() {
    setNotice(null);
    if (draft.name.trim().length < 2) {
      setNotice(t.adPlan.needName);
      return;
    }
    if (invalid) {
      setNotice(t.adPlan.needPrices);
      return;
    }

    setBusy(true);
    const { error } = await createClient().from("ad_plans").insert({
      name: draft.name.trim().slice(0, 50),
      description: draft.description.trim().slice(0, 200),
      placement: draft.placement,
      price_per_day: Number(draft.perDay) || 0,
      price_per_week: Number(draft.perWeek) || 0,
      price_per_month: Number(draft.perMonth) || 0,
      max_days: Math.min(Math.max(Number(draft.maxDays) || 1, 1), 365),
      is_active: true,
      sort_order: plans.length,
    });

    if (error) setNotice(error.message);
    else {
      setDraft(emptyDraft());
      setNotice(t.adPlan.saved);
      router.refresh();
    }
    setBusy(false);
  }

  async function toggle(plan: AdPlan) {
    setBusy(true);
    const { error } = await createClient()
      .from("ad_plans")
      .update({ is_active: !plan.is_active })
      .eq("id", plan.id);

    if (error) setNotice(error.message);
    else router.refresh();
    setBusy(false);
  }

  async function remove(plan: AdPlan) {
    if (!confirm(t.adPlan.removeConfirm)) return;
    setBusy(true);
    const { error } = await createClient()
      .from("ad_plans")
      .delete()
      .eq("id", plan.id);

    if (error) setNotice(error.message);
    else router.refresh();
    setBusy(false);
  }

  const priceFields = [
    { key: "perDay", label: t.ads.perDay },
    { key: "perWeek", label: t.ads.perWeek },
    { key: "perMonth", label: t.ads.perMonth },
  ] as const;

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold tracking-tight text-ink-900">
          {t.adPlan.formTitle}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-ink-900">{t.adPlan.name}</span>
            <input
              value={draft.name}
              onChange={(event) => set("name", event.target.value)}
              maxLength={50}
              placeholder={t.adPlan.namePlaceholder}
              className="field mt-1.5 w-full"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-ink-900">{t.adPlan.placement}</span>
            <select
              value={draft.placement}
              onChange={(event) => set("placement", event.target.value as AdPlacement)}
              className="field mt-1.5 w-full"
            >
              {PLACEMENTS.map((option) => (
                <option key={option} value={option}>
                  {t.ads.placement[option]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-bold text-ink-900">
            {t.adPlan.description}{" "}
            <span className="font-medium text-gray-400">{t.common.optional}</span>
          </span>
          <input
            value={draft.description}
            onChange={(event) => set("description", event.target.value)}
            maxLength={200}
            className="field mt-1.5 w-full"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-4">
          {priceFields.map((field) => (
            <label key={field.key} className="block">
              <span className="text-sm font-bold text-ink-900">{field.label}</span>
              <input
                value={draft[field.key]}
                onChange={(event) =>
                  set(field.key, event.target.value.replace(/[^\d.]/g, "").slice(0, 10))
                }
                inputMode="numeric"
                placeholder="0"
                className="field mt-1.5 w-full"
              />
            </label>
          ))}

          <label className="block">
            <span className="text-sm font-bold text-ink-900">{t.adPlan.maxDays}</span>
            <input
              value={draft.maxDays}
              onChange={(event) =>
                set("maxDays", event.target.value.replace(/\D/g, "").slice(0, 3))
              }
              inputMode="numeric"
              className="field mt-1.5 w-full"
            />
          </label>
        </div>

        {notice && (
          <p className="rounded-2xl bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800">
            {notice}
          </p>
        )}

        <button
          type="button"
          onClick={add}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900 disabled:opacity-60"
        >
          {busy ? <LoaderCircle size={16} /> : <Plus size={16} />}
          {t.adPlan.add}
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold tracking-tight text-ink-900">
          {t.adPlan.listTitle}
        </h2>

        {plans.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-primary-200 bg-white px-6 py-8 text-center text-sm text-gray-500">
            {t.adPlan.empty}
          </p>
        ) : (
          <ul className="space-y-2">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-ink-900">
                    {plan.name}
                    <span className="ml-2 rounded-full bg-paper-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      {t.ads.placement[plan.placement]}
                    </span>
                  </p>
                  {plan.description && (
                    <p className="mt-1 text-xs text-gray-500">{plan.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {t.ads.perDay} {formatTzs(plan.price_per_day)} · {t.ads.perWeek}{" "}
                    {formatTzs(plan.price_per_week)} · {t.ads.perMonth}{" "}
                    {formatTzs(plan.price_per_month)} · {t.adPlan.upTo}{" "}
                    {plan.max_days} {t.ads.daysUnit}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    plan.is_active
                      ? "bg-primary-100 text-primary-800"
                      : "bg-paper-100 text-gray-500"
                  }`}
                >
                  {plan.is_active ? t.social.visible : t.social.hidden}
                </span>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggle(plan)}
                  className="rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-ink-900 transition hover:border-primary-400 disabled:opacity-50"
                >
                  {plan.is_active ? t.admin.turnOff : t.admin.turnOn}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(plan)}
                  aria-label={t.adPlan.remove}
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
