"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import { formatTzs } from "@/lib/data";
import type { Business } from "@/lib/types";

export default function ReviewBoard({ businesses }: { businesses: Business[] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const kindNames: Record<Business["kind"], string> = {
    food: t.business.kindFood,
    goods: t.business.kindGoods,
    service: t.business.kindService,
  };

  async function patch(id: string, changes: Partial<Business>) {
    setBusyId(id);
    setError(null);
    const { error: updateError } = await createClient()
      .from("businesses")
      .update(changes)
      .eq("id", id);

    setBusyId(null);
    if (updateError) setError(updateError.message);
    else router.refresh();
  }

  if (businesses.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-primary-200 bg-white p-12 text-center">
        <p className="text-[15px] text-gray-600">{t.admin.noBusiness}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl bg-accent-100 px-4 py-3 text-sm text-accent-600">{error}</p>
      )}

      {businesses.map((business) => (
        <article
          key={business.id}
          className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
        >
          <div className="min-w-0">
            <p className="text-[17px] font-extrabold text-ink-900">{business.name}</p>
            <p className="mt-1 text-sm text-gray-500">
              {kindNames[business.kind]} · {business.location ?? t.admin.notSpecified} ·{" "}
              {business.delivery_fee > 0
                ? fill(t.storefront.deliveryFee, { fee: formatTzs(business.delivery_fee) })
                : t.admin.noDelivery}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              /{business.slug} ·{" "}
              {fill(t.admin.created, {
                date: new Date(business.created_at).toLocaleDateString(t.localeDate),
              })}
            </p>
            {business.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
                {business.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/msosi/${encodeURIComponent(business.slug)}`}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-ink-900 transition hover:border-primary-400"
            >
              {t.common.viewPage}
            </Link>
            <button
              type="button"
              disabled={busyId === business.id}
              onClick={() => patch(business.id, { is_verified: !business.is_verified })}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${
                business.is_verified
                  ? "border border-gray-200 text-ink-900 hover:border-accent-400"
                  : "bg-accent-500 text-white hover:bg-accent-400"
              }`}
            >
              {business.is_verified ? t.admin.verifyRemove : t.admin.verifyAdd}
            </button>
            <button
              type="button"
              disabled={busyId === business.id}
              onClick={() => patch(business.id, { is_active: !business.is_active })}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-ink-900 transition hover:border-primary-400 disabled:opacity-50"
            >
              {business.is_active ? t.admin.turnOff : t.admin.turnOn}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
