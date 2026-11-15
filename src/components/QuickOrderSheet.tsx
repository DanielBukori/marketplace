"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, MapPin, Minus, Plus, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import { formatTzs } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import { reportProblem } from "@/lib/report";
import type { DeliveryZone, MenuItem } from "@/lib/types";

/**
 * Oda ya haraka: mtu abonyeze chakula, aje kiasi, namba (iliyojazwa kutoka
 * akaunti yake), na mahali — oda inawekwa hapo hapo bila kuhamia ukurasa
 * mwingine wenye fomu ndefu.
 */
export default function QuickOrderSheet({
  item,
  businessId,
  businessName,
  deliveryFee,
  pickupPoint,
  zones,
  viewer,
  signedIn,
  loginHref,
  onClose,
}: {
  item: MenuItem;
  businessId: string;
  businessName: string;
  deliveryFee: number;
  pickupPoint: string | null;
  zones: DeliveryZone[] | null;
  viewer: { phone: string; address: string };
  signedIn: boolean;
  loginHref: string;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const photo = mediaUrl(item.photo_path);
  const areaList = zones ?? [];

  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<"delivery" | "pickup">(
    deliveryFee > 0 || areaList.length > 0 ? "delivery" : "pickup",
  );
  const [phone, setPhone] = useState(viewer.phone);
  const [address, setAddress] = useState(viewer.address);
  const [zoneId, setZoneId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fee = method === "delivery" ? deliveryFee : 0;
  const total = item.price * quantity + fee;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!phone.trim()) {
      setError(t.checkout.phoneRequired);
      return;
    }
    if (method === "delivery" && address.trim().length < 5) {
      setError(t.checkout.addressRequired);
      return;
    }
    if (method === "delivery" && areaList.length > 0 && !zoneId) {
      setError(t.checkout.zoneRequired);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          items: [{ menuItemId: item.id, quantity }],
          deliveryMethod: method,
          deliveryZoneId: method === "delivery" ? zoneId : "",
          contactPhone: phone.trim(),
          deliveryAddress: method === "delivery" ? address.trim() : "",
          meetupPoint: "",
          note,
          offerId: null,
          scheduledAt: null,
        }),
      });

      if (response.status === 401) {
        window.location.assign(loginHref);
        return;
      }

      const payload = (await response.json()) as {
        ok?: boolean;
        orderId?: string;
        message?: string;
      };
      const orderId = /^[0-9a-fA-F-]{36}$/.test(String(payload.orderId))
        ? String(payload.orderId)
        : null;

      if (!response.ok || !orderId) {
        if (response.status >= 500) {
          reportProblem("order", `HTTP ${response.status} ${payload.message ?? ""}`.trim());
        }
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
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label={t.storefront.quickClose}
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={fill(t.storefront.quickTitle, { name: item.name })}
        className="animate-pop-in relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-w-lg sm:rounded-[28px] sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="tile relative h-16 w-16 shrink-0 rounded-2xl">
            {photo && (
              <Image src={photo} alt="" fill sizes="64px" className="object-cover" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-600">
              {businessName}
            </p>
            <h2 className="mt-0.5 truncate font-display text-lg font-extrabold text-ink-900">
              {item.name}
            </h2>
            <p className="text-sm font-extrabold text-primary-700">{formatTzs(item.price)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.storefront.quickClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-100 text-gray-600 transition hover:bg-paper-200"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-paper-50 px-4 py-3">
            <span className="text-sm font-bold text-ink-900">{t.storefront.quickQty}</span>
            <span className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label={t.storefront.decrease}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white text-ink-900"
              >
                <Minus size={16} />
              </button>
              <span className="w-6 text-center text-sm font-extrabold text-ink-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(20, value + 1))}
                aria-label={t.storefront.increase}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-700 text-white"
              >
                <Plus size={16} />
              </button>
            </span>
          </div>

          <div className="flex gap-2">
            {(
              [
                { value: "delivery", label: t.checkout.delivery },
                { value: "pickup", label: t.checkout.pickup },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMethod(option.value)}
                aria-pressed={method === option.value}
                className={`flex-1 rounded-2xl border px-3 py-2.5 text-sm font-bold transition ${
                  method === option.value
                    ? "border-primary-800 bg-primary-800 text-white"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {method === "delivery" ? (
            <>
              {areaList.length > 0 && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-ink-900">
                    {t.checkout.zoneTitle}
                  </span>
                  <select
                    value={zoneId}
                    onChange={(event) => setZoneId(event.target.value)}
                    className="field"
                  >
                    <option value="">{t.checkout.zonePlaceholder}</option>
                    {areaList.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.note ? `${zone.name} — ${zone.note}` : zone.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-ink-900">
                  {t.checkout.address}
                </span>
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  autoComplete="street-address"
                  placeholder={t.checkout.addressPlaceholder}
                  className="field"
                />
              </label>
            </>
          ) : (
            <div className="flex items-start gap-2 rounded-2xl border border-primary-100 bg-primary-50/60 px-4 py-3 text-sm">
              <MapPin size={17} className="mt-0.5 shrink-0 text-primary-700" aria-hidden />
              <span>
                <span className="block font-bold text-ink-900">
                  {t.storefront.quickPickupAt}
                </span>
                <span className="mt-0.5 block leading-relaxed text-gray-600">
                  {pickupPoint?.trim() || t.checkout.pickupPointUnknown}
                </span>
              </span>
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-ink-900">
              {t.checkout.phone}
            </span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0712 345 678"
              className="field"
            />
            <span className="mt-1 block text-xs leading-relaxed text-gray-500">
              {t.storefront.quickPhoneHint}
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-ink-900">
              {t.checkout.noteLabel}
            </span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={300}
              placeholder={t.checkout.notePlaceholder}
              className="field"
            />
          </label>

          <div className="rounded-2xl bg-paper-100 px-4 py-3 text-sm">
            <div className="flex items-center justify-between text-gray-600">
              <span>
                {quantity} × {formatTzs(item.price)}
              </span>
              <span className="font-semibold text-ink-900">
                {formatTzs(item.price * quantity)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-gray-600">
              <span>{method === "delivery" ? t.checkout.fee : t.checkout.feePickup}</span>
              <span className="font-semibold text-ink-900">{formatTzs(fee)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-2 text-base font-extrabold text-ink-900">
              <span>{t.checkout.total}</span>
              <span>{formatTzs(total)}</span>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-accent-100 px-4 py-3 text-sm text-accent-600">
              {error}
            </p>
          )}

          {signedIn ? (
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-500 px-6 py-4 text-[15px] font-extrabold text-white transition hover:bg-accent-400 disabled:opacity-60"
            >
              {busy && <Loader2 size={17} className="animate-spin" />}
              {busy ? t.checkout.placing : t.storefront.quickCta}
            </button>
          ) : (
            <Link
              href={loginHref}
              className="block w-full rounded-2xl bg-accent-500 px-6 py-4 text-center text-[15px] font-extrabold text-white transition hover:bg-accent-400"
            >
              {t.storefront.quickSignIn}
            </Link>
          )}
        </form>
      </div>
    </div>
  );
}
