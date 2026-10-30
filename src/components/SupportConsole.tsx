"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, LoaderCircle, PhoneCall, Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { formatTzs } from "@/lib/data";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

const PAYMENTS: PaymentStatus[] = [
  "unpaid",
  "awaiting_payment",
  "paid",
  "failed",
  "refunded",
];

export default function SupportConsole({
  orders,
  filter,
  search,
}: {
  orders: Order[];
  filter: string;
  search: string;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const filters: { key: string; label: string }[] = [
    { key: "all", label: t.support.fAll },
    { key: "open", label: t.support.fOpen },
    { key: "paid", label: t.support.fPaid },
    { key: "unpaid", label: t.support.fUnpaid },
    { key: "completed", label: t.status.completed },
    { key: "cancelled", label: t.status.cancelled },
  ];

  function hrefFor(key: string) {
    const params = new URLSearchParams();
    if (key !== "all") params.set("filter", key);
    if (search) params.set("q", search);
    const query = params.toString();
    return `/dashboard/admin/support${query ? `?${query}` : ""}`;
  }

  async function apply(order: Order, action: "status" | "payment", value: string) {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          action,
          status: action === "status" ? value : undefined,
          paymentStatus: action === "payment" ? value : undefined,
          note: notes[order.id] ?? "",
        }),
      });
      const body = (await response.json()) as {
        message?: string;
        payoutQueued?: boolean;
      };

      if (!response.ok) {
        setNotice(body.message ?? t.common.error);
      } else {
        setNotice(
          body.payoutQueued ? t.support.savedWithPayout : t.support.saved,
        );
        setNotes((current) => ({ ...current, [order.id]: "" }));
        router.refresh();
      }
    } catch {
      setNotice(t.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <form
        action="/dashboard/admin/support"
        method="get"
        className="flex flex-wrap items-center gap-2"
      >
        {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        <div className="field relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            name="q"
            defaultValue={search}
            placeholder={t.support.searchPlaceholder}
            className="w-full pl-11"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-primary-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-900"
        >
          {t.support.search}
        </button>
      </form>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {filters.map((option) => (
          <Link
            key={option.key}
            href={hrefFor(option.key)}
            className={`chip shrink-0 ${option.key === filter ? "chip-active" : ""}`}
          >
            {option.label}
          </Link>
        ))}
      </div>

      {notice && (
        <p className="rounded-2xl bg-primary-50 px-5 py-4 text-sm font-semibold text-primary-800">
          {notice}
        </p>
      )}

      {orders.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-primary-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
          {t.support.empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const isOpen = openId === order.id;
            return (
              <li
                key={order.id}
                className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-start gap-3 p-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs text-gray-500">
                      {order.reference}
                    </p>
                    <p className="mt-1 truncate text-[15px] font-extrabold text-ink-900">
                      {order.business?.name ?? "—"}
                    </p>
                    <p className="mt-1 truncate text-sm text-gray-500">
                      {order.buyer?.full_name || t.support.noName} ·{" "}
                      {formatTzs(order.total)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 text-right">
                    <span className="rounded-full bg-paper-100 px-3 py-1 text-xs font-bold text-gray-600">
                      {t.status[order.status]}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        order.payment_status === "paid"
                          ? "bg-primary-100 text-primary-800"
                          : order.payment_status === "failed"
                            ? "bg-accent-100 text-accent-600"
                            : "bg-paper-100 text-gray-600"
                      }`}
                    >
                      {t.status[order.payment_status]}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : order.id)}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-primary-900"
                    >
                      {isOpen ? (
                        <>
                          <ChevronUp size={14} /> {t.support.collapse}
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} /> {t.support.fix}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="space-y-5 border-t border-black/5 bg-paper-50 p-5">
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <Detail label={t.orders.contact} value={order.contact_phone || "—"} />
                      <Detail
                        label={
                          order.delivery_method === "delivery"
                            ? t.orders.address
                            : t.orders.pickup
                        }
                        value={
                          order.delivery_method === "delivery"
                            ? order.delivery_address || "—"
                            : order.meetup_point || "—"
                        }
                      />
                      <Detail
                        label={t.orders.placedOn}
                        value={new Date(order.created_at).toLocaleString(t.localeDate)}
                      />
                      <Detail
                        label={t.orders.whenLabel}
                        value={
                          order.scheduled_at
                            ? new Date(order.scheduled_at).toLocaleString(t.localeDate)
                            : t.support.noSchedule
                        }
                      />
                    </dl>

                    <div className="flex flex-wrap gap-2">
                      {order.contact_phone && (
                        <a
                          href={`tel:${order.contact_phone.replace(/[^0-9+]/g, "")}`}
                          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold text-ink-900 transition hover:border-primary-400"
                        >
                          <PhoneCall size={14} /> {t.support.callBuyer}
                        </a>
                      )}
                      <Link
                        href={`/orders/${order.id}`}
                        className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold text-ink-900 transition hover:border-primary-400"
                      >
                        {t.orders.detail}
                      </Link>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor={`note-${order.id}`}
                        className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500"
                      >
                        {t.support.noteLabel}
                      </label>
                      <textarea
                        id={`note-${order.id}`}
                        rows={2}
                        maxLength={200}
                        value={notes[order.id] ?? ""}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [order.id]: event.target.value,
                          }))
                        }
                        placeholder={t.support.notePlaceholder}
                        className="field w-full"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <ActionGroup
                        title={t.support.statusTitle}
                        options={STATUSES.map((value) => ({
                          value,
                          label: t.status[value],
                        }))}
                        current={order.status}
                        busy={busy}
                        onApply={(value) => void apply(order, "status", value)}
                      />
                      <ActionGroup
                        title={t.support.paymentTitle}
                        options={PAYMENTS.map((value) => ({
                          value,
                          label: t.status[value],
                        }))}
                        current={order.payment_status}
                        busy={busy}
                        onApply={(value) => void apply(order, "payment", value)}
                      />
                    </div>

                    <p className="text-xs leading-relaxed text-gray-500">
                      {t.support.integrity}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-ink-900">{value}</dd>
    </div>
  );
}

function ActionGroup({
  title,
  options,
  current,
  busy,
  onApply,
}: {
  title: string;
  options: { value: string; label: string }[];
  current: string;
  busy: boolean;
  onApply: (value: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">
        {title}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const isCurrent = option.value === current;
          return (
            <button
              key={option.value}
              type="button"
              disabled={busy || isCurrent}
              onClick={() => onApply(option.value)}
              title={isCurrent ? t.support.currently : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                isCurrent
                  ? "bg-primary-800 text-white"
                  : "border border-gray-200 bg-white text-ink-900 hover:border-primary-400 disabled:opacity-50"
              }`}
            >
              {busy && !isCurrent ? <LoaderCircle size={12} /> : null}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
