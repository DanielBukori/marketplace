"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { formatTzs } from "@/lib/data";
import PhotoUploader from "@/components/PhotoUploader";
import type { AdPlan, Business } from "@/lib/types";

/** Bei ya mwisho huwekwa na msimamizi; hii ni kadirio tu la mpango. */
export function quotePrice(plan: AdPlan, days: number): number {
  let remaining = days;
  let total = 0;

  if (plan.price_per_month > 0) {
    const months = Math.floor(remaining / 30);
    total += months * plan.price_per_month;
    remaining -= months * 30;
  }
  if (plan.price_per_week > 0) {
    const weeks = Math.floor(remaining / 7);
    total += weeks * plan.price_per_week;
    remaining -= weeks * 7;
  }
  total += remaining * plan.price_per_day;

  return Math.round(total);
}

const TIERS = [
  { days: 1, key: "day" },
  { days: 7, key: "week" },
  { days: 30, key: "month" },
] as const;

export default function AdComposer({
  userId,
  businesses,
  plans,
}: {
  userId: string;
  businesses: Business[];
  plans: AdPlan[];
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [days, setDays] = useState(1);
  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [imagePath, setImagePath] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const plan = plans.find((option) => option.id === planId) ?? null;
  const cap = plan?.max_days ?? 365;
  const estimate = useMemo(
    () => (plan ? quotePrice(plan, days) : 0),
    [plan, days],
  );

  async function submit() {
    setNotice(null);

    if (!plan || !businessId) {
      setNotice(t.ads.pickPlan);
      return;
    }
    if (title.trim().length < 2) {
      setNotice(t.ads.needTitle);
      return;
    }
    if (imagePath.length === 0) {
      setNotice(t.ads.needImage);
      return;
    }

    setBusy(true);
    try {
      const { error } = await createClient().from("ads").insert({
        plan_id: plan.id,
        business_id: businessId,
        title: title.trim().slice(0, 60),
        image_path: imagePath[0],
        target_url: targetUrl.trim().slice(0, 200),
        days,
        price: estimate,
        status: "submitted",
        created_by: userId,
      });

      if (error) setNotice(error.message);
      else {
        setTitle("");
        setTargetUrl("");
        setImagePath([]);
        setNotice(t.ads.submitted);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-5 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold tracking-tight text-ink-900">
          {t.ads.formTitle}
        </h2>

        {businesses.length === 0 ? (
          <p className="text-sm text-gray-500">{t.ads.needBusiness}</p>
        ) : plans.length === 0 ? (
          <p className="text-sm text-gray-500">{t.ads.noPlans}</p>
        ) : (
          <>
            {businesses.length > 1 && (
              <label className="block">
                <span className="text-sm font-bold text-ink-900">{t.ads.business}</span>
                <select
                  value={businessId}
                  onChange={(event) => setBusinessId(event.target.value)}
                  className="field mt-1.5 w-full"
                >
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((option) => {
                const isSelected = option.id === planId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setPlanId(option.id);
                      setDays(Math.min(days, option.max_days));
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-primary-600 bg-primary-50 shadow-sm"
                        : "border-black/5 bg-white hover:border-primary-400"
                    }`}
                  >
                    <p className="text-sm font-extrabold text-ink-900">{option.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-gray-500">
                      {t.ads.placement[option.placement]}
                    </p>
                    <ul className="mt-3 space-y-1 text-xs text-gray-600">
                      <li>
                        {t.ads.perDay}: {formatTzs(option.price_per_day)}
                      </li>
                      <li>
                        {t.ads.perWeek}: {formatTzs(option.price_per_week)}
                      </li>
                      <li>
                        {t.ads.perMonth}: {formatTzs(option.price_per_month)}
                      </li>
                    </ul>
                  </button>
                );
              })}
            </div>

            <div>
              <span className="text-sm font-bold text-ink-900">{t.ads.duration}</span>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {TIERS.map((tier) => (
                  <button
                    key={tier.key}
                    type="button"
                    disabled={!plan || tier.days > cap}
                    onClick={() => setDays(tier.days)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition disabled:opacity-40 ${
                      days === tier.days
                        ? "bg-primary-800 text-white"
                        : "border border-gray-200 bg-white text-ink-900 hover:border-primary-400"
                    }`}
                  >
                    {t.ads.tiers[tier.key]}
                  </button>
                ))}
                <label className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
                  <span className="text-xs font-bold text-gray-500">{t.ads.custom}</span>
                  <input
                    type="number"
                    min={1}
                    max={cap}
                    value={days}
                    onChange={(event) => {
                      const next = Number(event.target.value) || 1;
                      setDays(Math.min(Math.max(next, 1), cap));
                    }}
                    className="w-16 bg-transparent text-sm font-bold text-ink-900 outline-none"
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {t.ads.capNote.replace("{max}", String(cap))}
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-bold text-ink-900">{t.ads.headline}</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={60}
                placeholder={t.ads.titlePlaceholder}
                className="field mt-1.5 w-full"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-ink-900">
                {t.ads.target} <span className="font-medium text-gray-400">{t.common.optional}</span>
              </span>
              <input
                value={targetUrl}
                onChange={(event) => setTargetUrl(event.target.value)}
                maxLength={200}
                placeholder="/duka/kula-bora"
                className="field mt-1.5 w-full"
              />
            </label>

            <div>
              <span className="text-sm font-bold text-ink-900">{t.ads.image}</span>
              <div className="mt-2">
                <PhotoUploader
                  userId={userId}
                  paths={imagePath}
                  onChange={(next) => setImagePath(next.slice(-1))}
                  max={1}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper-50 p-4">
              <p className="text-sm text-gray-600">
                {t.ads.estimate}:{" "}
                <span className="text-base font-extrabold text-ink-900">
                  {formatTzs(estimate)}
                </span>
              </p>
              <p className="max-w-xs text-xs text-gray-500">{t.ads.priceNote}</p>
            </div>

            {notice && (
              <p className="rounded-2xl bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800">
                {notice}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-7 py-3 text-sm font-extrabold text-white transition hover:bg-accent-400 disabled:opacity-60"
            >
              <Megaphone size={16} /> {busy ? t.common.loading : t.ads.submit}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
