"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bike, CheckCircle2, Phone, MapPin, Package } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { formatTzs } from "@/lib/data";
import type { Order, OrderStatus } from "@/lib/types";

/**
 * Beti la msabishi. Kazi hupangwa na muuzi — hapa msabishi anatumilisha
 * hatua mbili tu: amechukua, na amefika.
 */
export default function CourierBoard({ orders }: { orders: Order[] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function advance(order: Order, status: OrderStatus) {
    setBusyId(order.id);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) router.refresh();
      else {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? t.common.error);
      }
    } catch {
      setError(t.common.error);
    } finally {
      setBusyId(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-primary-200 bg-white p-12 text-center">
        <p className="text-[15px] text-gray-600">{t.courier.noWork}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-gray-500">{t.courier.statusHint}</p>

      {error && (
        <p role="alert" className="rounded-xl bg-accent-100 px-4 py-3 text-sm text-accent-600">
          {error}
        </p>
      )}

      {orders.map((order) => {
        const ready = order.status === "ready";
        const onRoute = order.status === "out_for_delivery";

        return (
          <article
            key={order.id}
            className="space-y-4 rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[17px] font-extrabold text-ink-900">
                  {order.business?.name}
                </p>
                <p className="mt-0.5 font-mono text-xs text-gray-500">
                  {order.reference} ·{" "}
                  {new Date(order.created_at).toLocaleString(t.localeDate)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-primary-700">
                  {formatTzs(order.total)}
                </p>
                <span className="inline-block rounded-full bg-paper-100 px-3 py-1 text-xs font-bold text-gray-600">
                  {t.status[order.status]}
                </span>
              </div>
            </div>

            <ul className="space-y-1 text-sm text-gray-600">
              {(order.items ?? []).map((item) => (
                <li key={item.id} className="flex justify-between gap-4">
                  <span>
                    {item.quantity} × {item.name}
                  </span>
                  <span className="shrink-0 font-semibold text-ink-900">
                    {formatTzs(item.line_total)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
              <p className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-primary-700" aria-hidden />
                <span>
                  <span className="block text-xs font-bold uppercase tracking-wide text-gray-500">
                    {t.courier.zoneLabel}
                  </span>
                  {order.delivery_zone_name || "—"}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <Phone size={15} className="mt-0.5 shrink-0 text-primary-700" aria-hidden />
                <span>
                  <span className="block text-xs font-bold uppercase tracking-wide text-gray-500">
                    {t.courier.buyerContact}
                  </span>
                  {order.buyer?.full_name ?? "—"} · {order.contact_phone || "—"}
                </span>
              </p>
              <p className="flex items-start gap-2 sm:col-span-2">
                <Package size={15} className="mt-0.5 shrink-0 text-primary-700" aria-hidden />
                <span>
                  <span className="block text-xs font-bold uppercase tracking-wide text-gray-500">
                    {t.courier.addressLabel}
                  </span>
                  {order.delivery_address || "—"}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-4">
              <p className="text-xs text-gray-500">
                {order.courier_assigned_at
                  ? `${t.courier.assignedOn}: ${new Date(order.courier_assigned_at).toLocaleString(t.localeDate)}`
                  : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/orders/${order.id}`}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-ink-900 transition hover:bg-paper-100"
                >
                  {t.courier.openOrder}
                </Link>
                {ready && (
                  <button
                    type="button"
                    onClick={() => advance(order, "out_for_delivery")}
                    disabled={busyId === order.id}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-900 disabled:opacity-50"
                  >
                    <Bike size={16} aria-hidden /> {t.courier.pickedUp}
                  </button>
                )}
                {onRoute && (
                  <button
                    type="button"
                    onClick={() => advance(order, "completed")}
                    disabled={busyId === order.id}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-accent-400 disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} aria-hidden /> {t.courier.delivered}
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
