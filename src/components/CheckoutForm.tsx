"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Loader2, Minus, Percent, Plus, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import { formatTzs } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import type { MenuItem, Offer } from "@/lib/types";

const MAX_LEAD_MS = 14 * 24 * 60 * 60 * 1000;

export type CheckoutLine = {
  key: string;
  menuItemId?: string;
  listingId?: string;
  name: string;
  price: number;
  quantity: number;
  photoPath: string | null;
};

/**
 * Punguzo huhesabiwa upya na hifadhidata wakati oda inahifadhiwa; hesabu hii
 * ya kivinjari ni onyesho la papo hapo pekee, kwa hivyo inafuata kanuni
 * moja ya `sync_order_total()` ili mnunuzi asione nambari tofauti.
 */
function discountOf(offer: Offer, itemsTotal: number, fee: number) {
  if (itemsTotal < Number(offer.min_items_total)) return 0;
  const base =
    offer.scope === "delivery" ? fee : offer.scope === "all" ? itemsTotal + fee : itemsTotal;
  return Math.round(((base * offer.percent_off) / 100) * 100) / 100;
}

export default function CheckoutForm({
  lines,
  extras,
  offers,
  businessId,
  deliveryFee,
  contact,
}: {
  lines: CheckoutLine[];
  extras: MenuItem[];
  offers: Offer[];
  businessId: string;
  deliveryFee: number;
  contact: { email: string; phone: string };
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const slotLabel = (slot: string) =>
    t.foodSlots[slot as keyof typeof t.foodSlots] ?? slot;
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">(
    deliveryFee > 0 ? "delivery" : "pickup",
  );
  const [phone, setPhone] = useState(contact.phone);
  const [address, setAddress] = useState("");
  const [meetup, setMeetup] = useState("");
  const [note, setNote] = useState("");
  const [when, setWhen] = useState<"asap" | "scheduled">("asap");
  const [scheduledAt, setScheduledAt] = useState("");
  const [whenError, setWhenError] = useState<string | null>(null);
  const [extraQty, setExtraQty] = useState<Record<string, number>>({});
  const [offerId, setOfferId] = useState<string>(offers[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kipande kilichoongezwa hapa kinajiunga na oda hiyo hiyo, kwa hivyo
  // bei yake hukamatwa tena na hifadhidata wakati wa kuhifadhi.
  const extraLines = useMemo<CheckoutLine[]>(
    () =>
      extras
        .filter((item) => (extraQty[item.id] ?? 0) > 0)
        .map((item) => ({
          key: item.id,
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: extraQty[item.id] ?? 0,
          photoPath: item.photo_path,
        })),
    [extraQty, extras],
  );

  const allLines = [...lines, ...extraLines];
  const itemsTotal = allLines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const fee = deliveryMethod === "delivery" ? deliveryFee : 0;

  const chosen = offers.find((offer) => offer.id === offerId) ?? null;
  const discount = chosen ? discountOf(chosen, itemsTotal, fee) : 0;
  const total = Math.max(0, itemsTotal - discount + fee);
  const offerLocked = chosen !== null && itemsTotal < Number(chosen.min_items_total);

  // Chakula ndicho kinachohitaji kuchagua saa; bidhaa zinakusanywa tu.
  const isFood = allLines.some((line) => Boolean(line.menuItemId));
  const scheduledMs = scheduledAt ? Date.parse(scheduledAt) : null;
  const scheduledOk = scheduledMs !== null && !Number.isNaN(scheduledMs);

  // Ulinganisho wa saa hufanyika wakati wa kubadilisha, si wakati wa
  // kuchora, kwa sababu `Date.now()` si safi kwa React.
  function pickTime(value: string) {
    setScheduledAt(value);
    setWhenError(null);
    if (!value) return;
    const ms = Date.parse(value);
    if (Number.isNaN(ms)) {
      setWhenError(t.checkout.whenInvalid);
      return;
    }
    const now = Date.now();
    if (ms < now - 60_000) setWhenError(t.checkout.whenTooEarly);
    else if (ms > now + MAX_LEAD_MS) setWhenError(t.checkout.whenTooLate);
  }

  function stepExtra(id: string, delta: number) {
    setExtraQty((current) => {
      const next = (current[id] ?? 0) + delta;
      const copy = { ...current };
      if (next <= 0) delete copy[id];
      else copy[id] = Math.min(20, next);
      return copy;
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (isFood && when === "scheduled" && (!scheduledOk || whenError)) {
      setError(whenError ?? t.checkout.whenInvalid);
      setBusy(false);
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          items: allLines.map((line) => ({
            menuItemId: line.menuItemId,
            listingId: line.listingId,
            quantity: line.quantity,
          })),
          deliveryMethod,
          contactPhone: phone,
          deliveryAddress: address,
          meetupPoint: meetup,
          note,
          offerId: discount > 0 ? offerId : null,
          scheduledAt:
            isFood && when === "scheduled" && scheduledOk
              ? new Date(scheduledMs as number).toISOString()
              : null,
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

  // Vinywaji vinaonekana kwanza: ndivyo muuzi anavyopata mauzo ya ziada.
  const sortedExtras = useMemo(
    () =>
      [...extras].sort((a, b) => {
        const rank = (slot: string) => (slot === "drinks" ? 0 : 1);
        return rank(a.slot) - rank(b.slot) || a.name.localeCompare(b.name);
      }),
    [extras],
  );

  return (
    <form onSubmit={submit} className="space-y-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
      <section className="space-y-3">
        {allLines.map((line) => (
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

      {sortedExtras.length > 0 && (
        <fieldset className="space-y-3 rounded-2xl border border-primary-100 bg-primary-50/40 p-4">
          <legend className="px-1 text-sm font-bold text-ink-900">
            {t.checkout.extrasTitle}
          </legend>
          <p className="text-xs leading-relaxed text-gray-500">{t.checkout.extrasDesc}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {sortedExtras.map((item) => {
              const qty = extraQty[item.id] ?? 0;
              const photo = mediaUrl(item.photo_path);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-2.5"
                >
                  <span className="tile relative h-10 w-10 shrink-0 rounded-lg">
                    {photo && (
                      <Image src={photo} alt="" fill sizes="40px" className="object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink-900">
                      {item.name}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {slotLabel(item.slot)} · {formatTzs(item.price)}
                    </span>
                  </span>
                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => stepExtra(item.id, 1)}
                      aria-label={fill(t.checkout.extrasAddAria, { name: item.name })}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white transition hover:bg-primary-800"
                    >
                      <Plus size={16} />
                    </button>
                  ) : (
                    <span className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => stepExtra(item.id, -1)}
                        aria-label={t.storefront.decrease}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white text-ink-900 transition hover:bg-paper-100"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-ink-900">{qty}</span>
                      <button
                        type="button"
                        onClick={() => stepExtra(item.id, 1)}
                        aria-label={t.storefront.increase}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-700 text-white transition hover:bg-primary-800"
                      >
                        <Plus size={16} />
                      </button>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      )}

      {offers.length > 0 && (
        <fieldset className="space-y-3 rounded-2xl border border-accent-100 bg-accent-100/40 p-4">
          <legend className="flex items-center gap-2 px-1 text-sm font-bold text-ink-900">
            <Sparkles size={16} className="text-accent-600" aria-hidden />
            {t.checkout.offerTitle}
          </legend>
          <div className="space-y-2">
            {offers.map((offer) => {
              const value = discountOf(offer, itemsTotal, fee);
              const blocked = itemsTotal < Number(offer.min_items_total);
              return (
                <label
                  key={offer.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border bg-white p-3 transition ${
                    offerId === offer.id
                      ? "border-accent-500 ring-2 ring-accent-100"
                      : "border-black/5 hover:border-accent-400"
                  } ${blocked ? "opacity-60" : ""}`}
                >
                  <input
                    type="radio"
                    name="offer"
                    value={offer.id}
                    checked={offerId === offer.id}
                    onChange={() => setOfferId(offer.id)}
                    className="h-4 w-4 accent-[#a41e22]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-extrabold text-ink-900">
                      <Percent size={13} aria-hidden className="text-accent-600" />
                      {offer.percent_off}% · {offer.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {t.offerScope[offer.scope]}
                      {Number(offer.min_items_total) > 0 &&
                        ` · ${fill(t.checkout.offerMin, {
                          min: formatTzs(Number(offer.min_items_total)),
                        })}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    {value > 0 ? (
                      <span className="text-sm font-extrabold text-accent-600">
                        −{formatTzs(value)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {blocked ? t.checkout.offerNotYet : t.checkout.offerNone}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 text-sm font-semibold text-gray-600">
              <input
                type="radio"
                name="offer"
                value=""
                checked={offerId === ""}
                onChange={() => setOfferId("")}
                className="h-4 w-4 accent-[#a41e22]"
              />
              {t.checkout.offerSkip}
            </label>
          </div>
        </fieldset>
      )}

      <div className="space-y-1 rounded-2xl bg-paper-100 p-4 text-sm">
        <Row label={t.checkout.itemTotal} value={formatTzs(itemsTotal)} />
        {discount > 0 && chosen && (
          <Row
            label={fill(t.checkout.offerRow, { label: chosen.label })}
            value={`−${formatTzs(discount)}`}
            accent
          />
        )}
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
        {offerLocked && chosen && (
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            {fill(t.checkout.offerLockedNote, {
              label: chosen.label,
              min: formatTzs(Number(chosen.min_items_total)),
            })}
          </p>
        )}
      </div>

      {isFood && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-ink-900">{t.checkout.whenTitle}</legend>
          <div className="flex gap-3">
            {(
              [
                { value: "asap", label: t.checkout.whenAsap },
                { value: "scheduled", label: t.checkout.whenPick },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setWhen(option.value)}
                aria-pressed={when === option.value}
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                  when === option.value
                    ? "border-primary-800 bg-primary-800 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-primary-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {when === "scheduled" ? (
            <>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => pickTime(e.target.value)}
                required
                className="field"
              />
              <p
                className={`text-xs leading-relaxed ${
                  whenError ? "text-accent-600" : "text-gray-500"
                }`}
              >
                {scheduledAt === "" || whenError
                  ? (whenError ?? t.checkout.whenHint)
                  : fill(t.checkout.whenSelected, {
                      when: new Date(scheduledMs as number).toLocaleString("sw-TZ"),
                    })}
              </p>
            </>
          ) : (
            <p className="text-xs leading-relaxed text-gray-500">{t.checkout.whenAsapHint}</p>
          )}
        </fieldset>
      )}

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
        <span className="mb-2 block text-sm font-bold text-ink-900">{t.checkout.meetupLabel}</span>
        <input
          value={meetup}
          onChange={(e) => setMeetup(e.target.value)}
          maxLength={120}
          placeholder={t.checkout.meetupPlaceholder}
          className="field"
        />
        <span className="mt-1.5 block text-xs leading-relaxed text-gray-500">
          {t.checkout.meetupHint}
        </span>
      </label>

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
        disabled={busy || allLines.length === 0}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-500 px-6 py-4 text-[15px] font-extrabold text-white transition hover:bg-accent-400 disabled:opacity-60"
      >
        {busy && <Loader2 size={17} className="animate-spin" />}
        {busy ? t.checkout.placing : t.checkout.placeOrder}
      </button>

      <p className="text-xs leading-relaxed text-gray-400">{t.checkout.firstOrderNote}</p>
    </form>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-gray-600">
      <span>{label}</span>
      <span
        className={`font-semibold ${accent ? "text-accent-600" : "text-ink-900"}`}
      >
        {value}
      </span>
    </div>
  );
}
