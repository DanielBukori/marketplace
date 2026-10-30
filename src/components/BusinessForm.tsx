"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import PhotoUploader from "@/components/PhotoUploader";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import type { Business } from "@/lib/types";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

export default function BusinessForm({
  userId,
  business,
}: {
  userId: string;
  business?: Business;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState(business?.name ?? "");
  const [slug, setSlug] = useState(business?.slug ?? "");
  const [kind, setKind] = useState<Business["kind"]>(business?.kind ?? "food");
  const [description, setDescription] = useState(business?.description ?? "");
  const [phone, setPhone] = useState(business?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(business?.whatsapp ?? "");
  const [location, setLocation] = useState(business?.location ?? "");
  const [hours, setHours] = useState(business?.opening_hours ?? "");
  const [deliveryFee, setDeliveryFee] = useState(String(business?.delivery_fee ?? 0));
  const [logoPath, setLogoPath] = useState<string[]>(
    business?.logo_path ? [business.logo_path] : [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveSlug = slug.trim() || slugify(name);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const supabase = createClient();
    const row = {
      owner_id: userId,
      name: name.trim(),
      slug: effectiveSlug,
      kind,
      description: description.trim(),
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      location: location.trim() || null,
      opening_hours: hours.trim() || null,
      delivery_fee: Number(deliveryFee) || 0,
      logo_path: logoPath[0] ?? null,
    };

    setBusy(true);
    const result = business
      ? await supabase
          .from("businesses")
          .update(row)
          .eq("id", business.id)
      : await supabase
          .from("businesses")
          // Muuzi anaweza kuanza mara moja; alama ya "verified" huongezwa
          // na msimamizi baada ya kuona hati za biashara.
          .insert({ ...row, is_active: true })
          .select("id")
          .single();
    setBusy(false);

    if (result.error) {
      setError(
        result.error.code === "23505" ? t.business.slugTaken : result.error.message,
      );
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.business.name}>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!business) setSlug(slugify(e.target.value));
            }}
            required
            maxLength={60}
            placeholder={t.business.namePlaceholder}
            className="field"
          />
        </Field>

        <Field label={t.business.slug}>
          <div className="flex items-center rounded-2xl border border-gray-200 bg-white focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100">
            <span className="pl-4 text-sm text-gray-400">/duka/</span>
            <input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              required
              className="w-full bg-transparent px-1 py-3 text-sm focus:outline-none"
            />
          </div>
        </Field>
      </div>

      <Field label={t.business.kind}>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              { value: "food", label: t.business.kindFood },
              { value: "goods", label: t.business.kindGoods },
              { value: "service", label: t.business.kindService },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setKind(option.value)}
              className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                kind === option.value
                  ? "border-primary-800 bg-primary-800 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-primary-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label={t.business.shortDesc}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={800}
          placeholder={t.business.shortDescPlaceholder}
          className="field resize-y"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.business.phone}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="2557..."
            className="field"
          />
        </Field>
        <Field label={t.business.whatsapp}>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="2557..."
            className="field"
          />
        </Field>
        <Field label={t.business.location}>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t.business.locationPlaceholder}
            className="field"
          />
        </Field>
        <Field label={t.business.hours}>
          <input
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder={t.business.hoursPlaceholder}
            className="field"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.business.deliveryFee}>
          <input
            type="number"
            min="0"
            step="100"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            className="field"
          />
        </Field>
        <Field label={t.business.logo}>
          <PhotoUploader
            userId={userId}
            paths={logoPath}
            onChange={(next) => setLogoPath(next.slice(-1))}
            max={1}
          />
        </Field>
      </div>

      {error && (
        <p className="rounded-xl bg-accent-100 px-4 py-3 text-sm text-accent-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-2xl bg-primary-800 px-7 py-3.5 text-sm font-extrabold text-white transition hover:bg-primary-900 disabled:opacity-60"
      >
        {busy && <Loader2 size={16} className="animate-spin" />}
        {business ? t.business.update : t.business.save}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-ink-900">{label}</span>
      {children}
    </label>
  );
}
