"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { formatTzs } from "@/lib/data";
import type { Payout, PayoutStatus } from "@/lib/types";

export default function PayoutBoard({
  payouts,
  queue,
  isAdmin,
  mobileMoneyReady,
}: {
  payouts: Payout[];
  queue: Payout[];
  isAdmin: boolean;
  mobileMoneyReady: boolean;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<Record<string, string>>({});

  async function send(payoutId: string) {
    setBusyId(payoutId);
    setNotice(null);
    try {
      const response = await fetch("/api/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId }),
      });
      const body = (await response.json()) as { message?: string };
      setNotice(body.message ?? t.common.error);
      if (response.ok) router.refresh();
    } catch {
      setNotice(t.common.error);
    } finally {
      setBusyId(null);
    }
  }

  async function saveDestination(payoutId: string, destination: string) {
    setBusyId(payoutId);
    setNotice(null);
    try {
      const response = await fetch("/api/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, destination }),
      });
      const body = (await response.json()) as { message?: string };
      setNotice(body.message ?? t.dashboard.payoutUpdate);
      if (response.ok) router.refresh();
    } catch {
      setNotice(t.common.error);
    } finally {
      setBusyId(null);
    }
  }

  const statusPill = (status: PayoutStatus) =>
    `inline-block rounded-full px-3 py-1 text-xs font-bold ${
      status === "sent"
        ? "bg-primary-100 text-primary-800"
        : status === "failed"
          ? "bg-accent-100 text-accent-600"
          : "bg-paper-100 text-gray-600"
    }`;

  return (
    <div className="space-y-8">
      {notice && (
        <p className="rounded-2xl bg-primary-50 px-5 py-4 text-sm font-semibold text-primary-800">
          {notice}
        </p>
      )}

      {!mobileMoneyReady && payouts.length > 0 && (
        <p className="rounded-2xl border border-dashed border-primary-200 bg-white px-5 py-4 text-sm text-gray-600">
          {t.orders.payUnavailable}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
          {t.dashboard.payouts}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-gray-500">
          {t.dashboard.payoutExplainer}
        </p>

        {payouts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-primary-200 bg-white p-10 text-center">
            <p className="text-[15px] text-gray-600">{t.dashboard.noPayouts}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {payouts.map((payout) => (
              <li
                key={payout.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
              >
                <div>
                  <p className="text-[15px] font-extrabold text-ink-900">
                    {formatTzs(payout.amount)} · {t.channels[payout.method as keyof typeof t.channels] ?? payout.method}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {payout.order ? `${t.dashboard.payoutFor} ${payout.order.reference}` : payout.reference}
                    {payout.destination && ` · ${payout.destination}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className={statusPill(payout.status)}>{t.payoutStatus[payout.status]}</span>
                  <p className="mt-1.5 text-xs text-gray-500">
                    {t.checkout.total} {formatTzs(payout.order?.total ?? 0)} · {t.money.providerFee}{" "}
                    {formatTzs(payout.fee)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin && (
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
            {t.dashboard.payoutQueue}
          </h2>

          {queue.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-primary-200 bg-white p-10 text-center">
              <p className="text-[15px] text-gray-600">{t.dashboard.noQueue}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {queue.map((payout) => (
                <li
                  key={payout.id}
                  className="space-y-3 rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[15px] font-extrabold text-ink-900">
                        {payout.business?.name ?? payout.reference}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {payout.order ? `${t.dashboard.payoutFor} ${payout.order.reference}` : "—"} ·{" "}
                        {new Date(payout.created_at).toLocaleString("sw-TZ")}
                      </p>
                      {payout.failure_reason && (
                        <p className="mt-1 text-xs text-accent-600">{payout.failure_reason}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-primary-700">
                        {formatTzs(payout.amount)}
                      </p>
                      <span className={statusPill(payout.status)}>
                        {t.payoutStatus[payout.status]}
                      </span>
                    </div>
                  </div>

                  {payout.status !== "processing" && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-black/5 pt-3">
                      <input
                        value={destinations[payout.id] ?? payout.destination}
                        onChange={(event) =>
                          setDestinations((current) => ({
                            ...current,
                            [payout.id]: event.target.value,
                          }))
                        }
                        placeholder={t.dashboard.payoutDestination}
                        className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={busyId === payout.id}
                        onClick={() =>
                          saveDestination(payout.id, destinations[payout.id] ?? payout.destination)
                        }
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-ink-900 transition hover:border-primary-300 disabled:opacity-50"
                      >
                        {t.dashboard.payoutUpdate}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === payout.id || !mobileMoneyReady}
                        onClick={() => send(payout.id)}
                        className="rounded-xl bg-accent-500 px-5 py-2 text-sm font-extrabold text-white transition hover:bg-accent-400 disabled:opacity-50"
                      >
                        {busyId === payout.id ? t.common.loading : t.dashboard.payoutSend}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
