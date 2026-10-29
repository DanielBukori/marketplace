"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import PhotoUploader from "@/components/PhotoUploader";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { marketCategoryIds } from "@/lib/data";
import type { Business, Listing } from "@/lib/types";

const categories = marketCategoryIds.filter((id) => id !== "all");

export default function ListingForm({
  userId,
  businesses,
  listing,
}: {
  userId: string;
  businesses: Pick<Business, "id" | "name">[];
  listing?: Listing;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const isEdit = Boolean(listing);

  const [businessId, setBusinessId] = useState(
    listing?.business_id ?? businesses[0]?.id ?? "",
  );
  const [title, setTitle] = useState(listing?.title ?? "");
  const [description, setDescription] = useState(listing?.description ?? "");
  const [category, setCategory] = useState(listing?.category ?? "electronics");
  const [condition, setCondition] = useState(listing?.condition ?? "used");
  const [price, setPrice] = useState(listing?.price ? String(listing.price) : "");
  const [negotiable, setNegotiable] = useState(listing?.is_negotiable ?? false);
  const [stock, setStock] = useState(String(listing?.stock ?? 1));
  const [location, setLocation] = useState(listing?.location ?? "");
  const [whatsapp, setWhatsapp] = useState(listing?.whatsapp ?? "");
  const [photoPaths, setPhotoPaths] = useState<string[]>(listing?.photo_paths ?? []);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (photoPaths.length === 0) {
      setError(t.post.needPhoto);
      return;
    }
    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError(t.post.badPrice);
      return;
    }

    const supabase = createClient();
    const row = {
      business_id: businessId,
      title: title.trim(),
      description: description.trim(),
      category,
      condition,
      price: priceNumber,
      is_negotiable: negotiable,
      stock: Math.max(0, Number(stock) || 1),
      location: location.trim() || null,
      whatsapp: whatsapp.trim() || null,
      photo_paths: photoPaths,
    };

    setBusy(true);
    const result = isEdit
      ? await supabase
          .from("listings")
          .update({ ...row, status: "active", published_at: listing?.published_at ?? new Date().toISOString() })
          .eq("id", listing!.id)
      : await supabase
          .from("listings")
          .insert({ ...row, status: "active", published_at: new Date().toISOString() })
          .select("id")
          .single();
    setBusy(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleDelete() {
    if (!isEdit || !window.confirm(t.post.deleteConfirm)) return;
    setBusy(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("listings")
      .delete()
      .eq("id", listing!.id);
    if (!deleteError && photoPaths.length > 0) {
      await supabase.storage.from("media").remove(photoPaths);
    }
    setBusy(false);
    if (deleteError) setError(deleteError.message);
    else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  if (businesses.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-primary-200 bg-white p-10 text-center">
        <p className="text-[15px] text-gray-600">{t.post.needBusiness}</p>
        <Link
          href="/dashboard/business/new"
          className="mt-5 inline-flex rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900"
        >
          {t.post.createBusiness}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7 rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.post.business}>
          <select
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            className="field"
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t.post.category}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Listing["category"])}
            className="field"
          >
            {categories.map((id) => (
              <option key={id} value={id}>
                {t.categories[id]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t.post.photos}>
        <PhotoUploader userId={userId} paths={photoPaths} onChange={setPhotoPaths} />
      </Field>

      <Field label={t.post.titleField}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={90}
          placeholder={t.post.titlePlaceholder}
          className="field"
        />
      </Field>

      <Field label={t.post.descriptionField}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder={t.post.descriptionPlaceholder}
          className="field resize-y"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label={t.post.price}>
          <input
            type="number"
            min="0"
            step="100"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="field"
          />
        </Field>

        <Field label={t.post.condition}>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as Listing["condition"])}
            className="field"
          >
            {(Object.keys(t.conditions) as (keyof typeof t.conditions)[]).map((key) => (
              <option key={key} value={key}>
                {t.conditions[key]}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t.post.stockLabel}>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="field"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.post.location}>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t.post.locationPlaceholder}
            className="field"
          />
        </Field>

        <Field label={t.post.whatsapp}>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="2557..."
            className="field"
          />
        </Field>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-ink-900">
        <input
          type="checkbox"
          checked={negotiable}
          onChange={(e) => setNegotiable(e.target.checked)}
          className="h-5 w-5 rounded border-gray-300 text-primary-700 focus:ring-primary-500"
        />
        {t.post.negotiable}
      </label>

      {error && (
        <p className="rounded-xl bg-accent-100 px-4 py-3 text-sm text-accent-600">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary-800 px-7 py-3.5 text-sm font-extrabold text-white transition hover:bg-primary-900 disabled:opacity-60"
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          {isEdit ? t.post.update : t.post.publish}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="rounded-2xl border border-accent-400 px-6 py-3.5 text-sm font-bold text-accent-600 transition hover:bg-accent-100 disabled:opacity-60"
          >
            {t.post.delete}
          </button>
        )}
      </div>
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
