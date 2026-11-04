"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { formatTzs } from "@/lib/data";
import CourierAssign from "@/components/CourierAssign";
import type { Order, OrderStatus, Profile } from "@/lib/types";

const flow: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
];

/** Oda zilizofika mwisho hazipangiwi msabishi upya. */
const CLOSED: OrderStatus[] = ["completed", "cancelled"];

export default function OrdersInbox({
  orders,
  canManage,
  couriers = [],
}: {
  orders: Order[];
  canManage: boolean;
  couriers?: Profile[];
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Hali hubadilishwa na seva ili mnunuzi apokee SMS/barua pepe ya hatua hiyo. */
  async function setStatus(id: string, status: OrderStatus) {
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${id}/status`, {
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
        <p className="text-[15px] text-gray-600">{t.orders.noOrders}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-xl bg-accent-100 px-4 py-3 text-sm text-accent-600">
          {error}
        </p>
      )}

      {orders.map((order) => (
        <article
          key={order.id}
          className="space-y-4 rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[17px] font-extrabold text-ink-900">
                {order.business?.name}
              </p>
              <p className="mt-0.5 font-mono text-xs text-gray-500">
                {order.reference} ·{" "}
                {new Date(order.created_at).toLocaleString(t.localeDate)}
              </p>
              {!canManage && (
                <Link
                  href={`/orders/${order.id}`}
                  className="mt-1 inline-block text-xs font-bold text-primary-700 hover:text-primary-900"
                >
                  {t.orders.detail}
                </Link>
              )}
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-primary-700">
                {formatTzs(order.total)}
              </p>
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-4 text-sm">
            <p className="text-gray-500">
              {order.delivery_method === "delivery"
                ? `${t.orders.address}: ${order.delivery_address}`
                : t.orders.pickup}
              {order.contact_phone && ` · ${order.contact_phone}`}
            </p>
            {order.delivery_zone_name && (
              <p className="text-gray-500">
                {t.courier.zoneLabel}: {order.delivery_zone_name}
              </p>
            )}
            {order.kind === "food" && (
              <p className="text-gray-500">
                {t.orders.whenLabel}:{" "}
                {order.scheduled_at
                  ? new Date(order.scheduled_at).toLocaleString(t.localeDate)
                  : t.orders.whenAsap}
              </p>
            )}

            {canManage ? (
              <select
                value={order.status}
                disabled={busyId === order.id}
                onChange={(e) => setStatus(order.id, e.target.value as OrderStatus)}
                aria-label={t.orders.statusAria}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-ink-900 focus:border-primary-500 focus:outline-none"
              >
                {flow.map((status) => (
                  <option key={status} value={status}>
                    {t.status[status]}
                  </option>
                ))}
              </select>
            ) : order.status === "pending" ? (
              <button
                type="button"
                onClick={() => setStatus(order.id, "cancelled")}
                disabled={busyId === order.id}
                className="rounded-xl border border-accent-400 px-4 py-2 text-sm font-bold text-accent-600 transition hover:bg-accent-100 disabled:opacity-50"
              >
                {t.orders.cancel}
              </button>
            ) : (
              <span className="font-bold text-primary-800">{t.status[order.status]}</span>
            )}
          </div>

          {canManage &&
            order.delivery_method === "delivery" &&
            !CLOSED.includes(order.status) && (
              <div className="border-t border-black/5 pt-4">
                <CourierAssign
                  orderId={order.id}
                  couriers={couriers}
                  currentId={order.courier_id ?? null}
                />
              </div>
            )}
        </article>
      ))}
    </div>
  );
}
