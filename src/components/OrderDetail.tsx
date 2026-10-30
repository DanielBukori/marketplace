"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImageOff } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import ReviewComposer from "@/components/ReviewComposer";
import { mediaUrl } from "@/lib/media";
import { formatTzs } from "@/lib/data";
import type { Order, OrderStatus } from "@/lib/types";

type Channel = "mpesa" | "airtel" | "mixx" | "halotel";

const channels: Channel[] = ["mpesa", "airtel", "mixx", "halotel"];

export default function OrderDetail({
  order,
  isBuyer,
  justPlaced,
  mobileMoneyReady,
}: {
  order: Order;
  isBuyer: boolean;
  justPlaced: boolean;
  mobileMoneyReady: boolean;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>("mpesa");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const canPay =
    isBuyer &&
    order.status !== "cancelled" &&
    ["unpaid", "awaiting_payment", "failed"].includes(order.payment_status);

  const statusLabel = (value: string) =>
    (t.status as Record<string, string>)[value] ?? value;

  async function pay() {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, channel }),
      });
      const body = (await response.json()) as { message?: string };
      setNotice(body.message ?? t.common.error);
      if (response.ok) router.refresh();
    } catch {
      setNotice(t.common.error);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" as OrderStatus })
      .eq("id", order.id);

    if (error) setNotice(error.message);
    else router.refresh();
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      {justPlaced && (
        <p className="flex items-center gap-2 rounded-2xl bg-primary-50 px-5 py-4 text-sm font-semibold text-primary-800">
          <CheckCircle2 size={17} /> {t.orders.placedBanner}
        </p>
      )}

      <article className="space-y-5 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">
              {order.business?.name}
            </h1>
            <p className="mt-1 font-mono text-xs text-gray-500">
              {t.orders.reference}: {order.reference}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <span className="block rounded-full bg-paper-100 px-3 py-1 text-xs font-bold text-gray-600">
              {t.status[order.status]}
            </span>
            <span
              className={`block rounded-full px-3 py-1 text-xs font-bold ${
                order.payment_status === "paid"
                  ? "bg-primary-100 text-primary-800"
                  : order.payment_status === "failed"
                    ? "bg-accent-100 text-accent-600"
                    : "bg-paper-100 text-gray-600"
              }`}
            >
              {t.status[order.payment_status]}
            </span>
          </div>
        </div>

        <ul className="space-y-3 border-t border-black/5 pt-4">
          {(order.items ?? []).map((item) => {
            const src = mediaUrl(item.photo_path);
            return (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-paper-100">
                  {src ? (
                    <Image src={src} alt="" fill className="object-cover" sizes="48px" />
                  ) : (
                    <ImageOff
                      size={18}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-300"
                    />
                  )}
                </span>
                <span className="flex-1 text-ink-900">
                  {item.quantity} × {item.name}
                </span>
                <span className="font-semibold text-ink-900">
                  {formatTzs(item.line_total)}
                </span>
              </li>
            );
          })}
        </ul>

        <dl className="space-y-1.5 border-t border-black/5 pt-4 text-sm">
          <Row label={t.checkout.itemTotal} value={formatTzs(order.items_total)} />
          {Number(order.discount) > 0 && (
            <Row
              label={
                order.offer_label
                  ? `${t.checkout.offerRowLabel} · ${order.offer_label}`
                  : t.checkout.offerRowLabel
              }
              value={`−${formatTzs(Number(order.discount))}`}
            />
          )}
          {order.delivery_fee > 0 && (
            <Row label={t.checkout.fee} value={formatTzs(order.delivery_fee)} />
          )}
          <div className="flex items-center justify-between pt-1 text-[17px] font-extrabold text-ink-900">
            <dt>{t.checkout.total}</dt>
            <dd>{formatTzs(order.total)}</dd>
          </div>
        </dl>

        <div className="space-y-1 rounded-2xl bg-paper-50 p-4 text-sm text-gray-600">
          <p>
            {t.orders.contact}: {order.contact_phone || "—"}
          </p>
          <p>
            {order.delivery_method === "delivery"
              ? `${t.orders.address}: ${order.delivery_address || "—"}`
              : t.orders.pickup}
          </p>
          {order.meetup_point && (
            <p>
              {t.orders.meetupLabel}: {order.meetup_point}
            </p>
          )}
          {order.note && <p>{t.orders.note}: {order.note}</p>}
          {order.kind === "food" && (
            <p>
              {t.orders.whenLabel}:{" "}
              {order.scheduled_at
                ? new Date(order.scheduled_at).toLocaleString(t.localeDate)
                : t.orders.whenAsap}
            </p>
          )}
          <p>
            {t.orders.placedOn}: {new Date(order.created_at).toLocaleString(t.localeDate)}
          </p>
        </div>

        {order.business?.slug && (
          <Link
            href={`/duka/${order.business.slug}`}
            className="inline-block text-sm font-bold text-primary-700 hover:text-primary-900"
          >
            {t.orders.viewStore}
          </Link>
        )}
      </article>

      {canPay && (
        <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold tracking-tight text-ink-900">
            {t.orders.payTitle}
          </h2>

          {mobileMoneyReady ? (
            <>
              <div className="flex flex-wrap gap-2">
                {channels.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setChannel(option)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      channel === option
                        ? "bg-primary-800 text-white"
                        : "border border-gray-200 bg-white text-ink-900 hover:border-primary-400"
                    }`}
                  >
                    {t.channels[option]}
                  </button>
                ))}
              </div>

              <p className="text-sm leading-relaxed text-gray-500">
                {t.orders.payHint.replace("{phone}", order.contact_phone || "—")}
              </p>

              <button
                type="button"
                onClick={pay}
                disabled={busy}
                className="inline-flex rounded-full bg-accent-500 px-7 py-3 text-sm font-extrabold text-white transition hover:bg-accent-400 disabled:opacity-60"
              >
                {busy ? t.common.loading : t.orders.payNow}
              </button>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-gray-500">
              {t.orders.payUnavailable}
            </p>
          )}
        </section>
      )}

      {notice && (
        <p className="rounded-2xl bg-primary-50 px-5 py-4 text-sm font-semibold text-primary-800">
          {notice}
        </p>
      )}

      {isBuyer && order.status === "pending" && (
        <button
          type="button"
          onClick={cancel}
          disabled={busy}
          className="rounded-full border border-accent-400 px-6 py-3 text-sm font-bold text-accent-600 transition hover:bg-accent-100 disabled:opacity-50"
        >
          {t.orders.cancel}
        </button>
      )}

      {isBuyer && order.status === "completed" && (
        <section className="space-y-4">
          <h2 className="text-lg font-extrabold tracking-tight text-ink-900">
            {t.reviews.sectionTitle}
          </h2>
          {order.has_review ? (
            <p className="rounded-2xl bg-primary-50 px-5 py-4 text-sm font-semibold text-primary-800">
              {t.reviews.already}
            </p>
          ) : (
            <ReviewComposer
              orderId={order.id}
              businessId={order.business_id}
              lines={(order.items ?? [])
                .filter((item) => item.menu_item_id)
                .map((item) => ({
                  menuItemId: item.menu_item_id,
                  name: item.name,
                }))}
            />
          )}
        </section>
      )}

      {(order.events?.length ?? 0) > 0 && (
        <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold tracking-tight text-ink-900">
            {t.orders.timelineTitle}
          </h2>
          <ol className="space-y-3">
            {(order.events ?? []).map((event) => (
              <li key={event.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                <div>
                  <p className="font-semibold text-ink-900">
                    {statusLabel(event.status)}
                  </p>
                  {event.note && <p className="text-gray-500">{event.note}</p>}
                  <p className="text-xs text-gray-400">
                    {new Date(event.created_at).toLocaleString(t.localeDate)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-semibold text-ink-900">{value}</dd>
    </div>
  );
}
