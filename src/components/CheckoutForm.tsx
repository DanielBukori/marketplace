"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { formatTzs } from "@/lib/data";
import { mediaUrl } from "@/lib/media";

export type CheckoutLine = {
  key: string;
  menuItemId?: string;
  listingId?: string;
  name: string;
  price: number;
  quantity: number;
  photoPath: string | null;
};

export default function CheckoutForm({
  lines,
  businessId,
  deliveryFee,
  contact,
}: {
  lines: CheckoutLine[];
  businessId: string;
  deliveryFee: number;
  contact: { email: string; phone: string };
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">(
    deliveryFee > 0 ? "delivery" : "pickup",
  );
  const [phone, setPhone] = useState(contact.phone);
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemsTotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const fee = deliveryMethod === "delivery" ? deliveryFee : 0;
  const total = itemsTotal + fee;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          items: lines.map((line) => ({
            menuItemId: line.menuItemId,
            listingId: line.listingId,
            quantity: line.quantity,
          })),
          deliveryMethod,
          contactPhone: phone,
          deliveryAddress: address,
          note,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        orderId?: string;
        message?: string;
      };
      const orderId = /^[0-9a-fA-F-]{36}$/.test(String(payload.orderId))
        ? String(payload.orderId)
        : null;

      if (!response.ok || !orderId) {
        setError(payload.message ?? t.checkout.notPlaced);
        return;
      }

      router.push(`/orders/${orderId}?placed=1`);
      router.refresh();
    } catch {
      setError(t.checkout.offline);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
      <section className="space-y-3">
        {lines.map((line) => (
          <div key={line.key} className="flex items-center gap-4">
            <span className="tile relative h-14 w-14 shrink-0 rounded-xl">
              {line.photoPath && (
                <Image src={mediaUrl(line.photoPath) ?? ""} alt="" fill sizes="56px" className="object-cover" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold text-ink-900">{line.name}</span>
              <span className="text-sm text-gray-500">
                {line.quantity} × {formatTzs(line.price)}
              </span>
            </span>
            <span className="font-extrabold text-ink-900">
              {formatTzs(line.price * line.quantity)}
            </span>
          </div>
        ))}
      </section>

      <div className="space-y-1 rounded-2xl bg-paper-100 p-4 text-sm">
        <Row label={t.checkout.itemTotal} value={formatTzs(itemsTotal)} />
        <Row
          label={
            deliveryMethod === "delivery"
              ? t.checkout.fee
              : t.checkout.feePickup
          }
          value={formatTzs(fee)}
        />
        <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-2 text-base font-extrabold text-ink-900">
          <span>{t.checkout.total}</span>
          <span>{formatTzs(total)}</span>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-ink-900">{t.checkout.deliveryMethod}</legend>
        <div className="flex gap-3">
          {(
            [
              { value: "pickup", label: t.checkout.pickup },
              { value: "delivery", label: t.checkout.delivery },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDeliveryMethod(option.value)}
              className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                deliveryMethod === option.value
                  ? "border-primary-800 bg-primary-800 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-primary-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-ink-900">{t.checkout.phone}</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          inputMode="tel"
          placeholder="2557..."
          className="field"
        />
      </label>

      {deliveryMethod === "delivery" && (
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-ink-900">{t.checkout.address}</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            placeholder={t.checkout.addressPlaceholder}
            className="field"
          />
        </label>
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-ink-900">
          {t.checkout.noteLabel}
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder={t.checkout.notePlaceholder}
          className="field resize-y"
        />
      </label>

      {error && (
        <p className="rounded-xl bg-accent-100 px-4 py-3 text-sm text-accent-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy || lines.length === 0}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-500 px-6 py-4 text-[15px] font-extrabold text-white transition hover:bg-accent-400 disabled:opacity-60"
      >
        {busy && <Loader2 size={17} className="animate-spin" />}
        {busy ? t.checkout.placing : t.checkout.placeOrder}
      </button>

      <p className="text-xs leading-relaxed text-gray-400">{t.checkout.firstOrderNote}</p>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-gray-600">
      <span>{label}</span>
      <span className="font-semibold text-ink-900">{value}</span>
    </div>
  );
}
