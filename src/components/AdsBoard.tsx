"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Check, ImageOff, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { mediaUrl } from "@/lib/media";
import { formatTzs } from "@/lib/data";
import type { Ad, AdStatus } from "@/lib/types";

/**
 * Ubao wa matangazo: muuzi huona yake, msimamizi huongeza kitendo cha
 * kuidhinisha, kuweka bei ya mwisho, kuthibitisha malipo au kukataa.
 */
export default function AdsBoard({
  ads,
  canModerate,
  userId,
}: {
  ads: Ad[];
  canModerate: boolean;
  userId: string;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function patch(ad: Ad, changes: Record<string, unknown>, message: string) {
    setBusy(true);
    setNotice(null);
    const { error } = await createClient()
      .from("ads")
      .update(changes)
      .eq("id", ad.id);

    if (error) setNotice(error.message);
    else {
      setNotice(message);
      router.refresh();
    }
    setBusy(false);
  }

  function approve(ad: Ad) {
    const start = new Date();
    const end = new Date(start.getTime() + ad.days * 24 * 60 * 60 * 1000);
    const price = Number(prices[ad.id] ?? ad.price) || 0;

    void patch(
      ad,
      {
        status: "live",
        price,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        approved_by: userId,
        review_note: notes[ad.id] ?? "",
      },
      t.ads.liveNow,
    );
  }

  function reject(ad: Ad) {
    void patch(
      ad,
      { status: "rejected", review_note: notes[ad.id] ?? "" },
      t.ads.rejected,
    );
  }

  function confirmPayment(ad: Ad) {
    void patch(ad, { paid_at: new Date().toISOString() }, t.ads.paidSaved);
  }

  function expire(ad: Ad) {
    void patch(ad, { status: "expired" }, t.ads.expiredNow);
  }

  function cancel(ad: Ad) {
    void patch(ad, { status: "cancelled" }, t.ads.cancelledNow);
  }

  if (ads.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-primary-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
        {canModerate ? t.ads.emptyAdmin : t.ads.emptyMine}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {notice && (
        <p className="rounded-2xl bg-primary-50 px-5 py-4 text-sm font-semibold text-primary-800">
          {notice}
        </p>
      )}

      <ul className="space-y-3">
        {ads.map((ad) => {
          const src = mediaUrl(ad.image_path);
          return (
            <li
              key={ad.id}
              className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start gap-4">
                <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-paper-100">
                  {src ? (
                    <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <ImageOff
                      size={20}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-300"
                    />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-extrabold text-ink-900">{ad.title}</p>
                    <StatusPill status={ad.status} label={t.adStatus[ad.status]} />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {ad.business?.name ?? "—"} · {ad.days}{" "}
                    {ad.days === 1 ? t.ads.dayUnit : t.ads.daysUnit} ·{" "}
                    {formatTzs(ad.price)}
                  </p>
                  {ad.plan && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      {t.ads.placement[ad.plan.placement]} · {ad.plan.name}
                    </p>
                  )}
                  {ad.starts_at && ad.ends_at && (
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(ad.starts_at).toLocaleString(t.localeDate)} →{" "}
                      {new Date(ad.ends_at).toLocaleString(t.localeDate)}
                    </p>
                  )}
                  {ad.paid_at ? (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-primary-700">
                      <BadgeCheck size={14} /> {t.ads.paidOn}{" "}
                      {new Date(ad.paid_at).toLocaleString(t.localeDate)}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-accent-600">{t.ads.awaitingPayment}</p>
                  )}
                  {ad.review_note && (
                    <p className="mt-2 rounded-xl bg-paper-50 px-3 py-2 text-xs text-gray-600">
                      {t.ads.note}: {ad.review_note}
                    </p>
                  )}
                  {ad.target_url && (
                    <Link
                      href={ad.target_url}
                      className="mt-2 inline-block text-xs font-bold text-primary-700 hover:text-primary-900"
                    >
                      {ad.target_url}
                    </Link>
                  )}
                </div>
              </div>

              {canModerate ? (
                <div className="mt-4 space-y-3 border-t border-black/5 pt-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
                        {t.ads.finalPrice}
                      </span>
                      <input
                        value={prices[ad.id] ?? String(ad.price)}
                        onChange={(event) =>
                          setPrices((current) => ({
                            ...current,
                            [ad.id]: event.target.value.replace(/[^\d.]/g, "").slice(0, 10),
                          }))
                        }
                        inputMode="numeric"
                        className="field mt-1.5 w-36"
                      />
                    </label>
                    <label className="min-w-0 flex-1">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
                        {t.ads.note}
                      </span>
                      <input
                        value={notes[ad.id] ?? ""}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [ad.id]: event.target.value.slice(0, 200),
                          }))
                        }
                        placeholder={t.ads.notePlaceholder}
                        className="field mt-1.5 w-full"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Action
                      busy={busy}
                      tone="primary"
                      onClick={() => approve(ad)}
                      icon={<Check size={14} />}
                    >
                      {t.ads.approveLive}
                    </Action>
                    <Action busy={busy} tone="outline" onClick={() => confirmPayment(ad)}>
                      {t.ads.confirmPaid}
                    </Action>
                    <Action busy={busy} tone="outline" onClick={() => reject(ad)}>
                      {t.ads.reject}
                    </Action>
                    {ad.status === "live" && (
                      <Action busy={busy} tone="outline" onClick={() => expire(ad)}>
                        {t.ads.markExpired}
                      </Action>
                    )}
                  </div>
                </div>
              ) : ad.status === "submitted" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => cancel(ad)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition hover:border-accent-400 hover:text-accent-600 disabled:opacity-50"
                >
                  <X size={14} /> {t.ads.cancelSubmission}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusPill({ status, label }: { status: AdStatus; label: string }) {
  const tone =
    status === "live"
      ? "bg-primary-100 text-primary-800"
      : status === "rejected" || status === "cancelled"
        ? "bg-accent-100 text-accent-600"
        : "bg-paper-100 text-gray-600";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{label}</span>
  );
}

function Action({
  busy,
  tone,
  icon,
  children,
  onClick,
}: {
  busy: boolean;
  tone: "primary" | "outline";
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold transition disabled:opacity-50 ${
        tone === "primary"
          ? "bg-primary-800 text-white hover:bg-primary-900"
          : "border border-gray-200 bg-white text-ink-900 hover:border-primary-400"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
