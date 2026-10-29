"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2, Trash2 } from "lucide-react";
import PhotoUploader from "@/components/PhotoUploader";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { fill } from "@/lib/i18n";
import { formatTzs, menuSlots, type MenuSlot } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import type { MenuItem } from "@/lib/types";

export default function MenuManager({
  userId,
  businessId,
  items,
}: {
  userId: string;
  businessId: string;
  items: MenuItem[];
}) {
  const { t } = useLanguage();
  const slotLabels = new Map<string, string>(Object.entries(t.foodSlots));
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [slot, setSlot] = useState<MenuSlot>(menuSlots[0]);
  const [photoPath, setPhotoPath] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addItem(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      setError(t.menu.badPrice);
      return;
    }

    const supabase = createClient();
    setBusy(true);
    const { error: insertError } = await supabase.from("menu_items").insert({
      business_id: businessId,
      name: name.trim(),
      description: description.trim(),
      price: priceNumber,
      slot,
      photo_path: photoPath[0] ?? null,
      is_available: true,
    });
    setBusy(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setName("");
    setDescription("");
    setPrice("");
    setPhotoPath([]);
    router.refresh();
  }

  async function patch(id: string, changes: Partial<MenuItem>) {
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("menu_items")
      .update(changes)
      .eq("id", id);
    if (updateError) setError(updateError.message);
    else router.refresh();
  }

  async function remove(id: string, photo: string | null) {
    if (!window.confirm(t.menu.removeConfirm)) return;
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id);
    if (!deleteError && photo) {
      await supabase.storage.from("media").remove([photo]);
    }
    if (deleteError) setError(deleteError.message);
    else router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={addItem}
        className="space-y-5 rounded-3xl border border-black/5 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-extrabold text-ink-900">{t.menu.addTitle}</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.menu.name}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
              placeholder={t.menu.namePlaceholder}
              className="field"
            />
          </Field>
          <Field label={t.menu.price}>
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
        </div>

        <Field label={t.menu.description}>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            placeholder={t.menu.descriptionPlaceholder}
            className="field"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.menu.slot}>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value as MenuSlot)}
              className="field"
            >
              {menuSlots.map((id) => (
                <option key={id} value={id}>
                  {t.foodSlots[id]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.menu.photo}>
            <PhotoUploader
              userId={userId}
              paths={photoPath}
              onChange={(next) => setPhotoPath(next.slice(-1))}
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
          className="inline-flex items-center gap-2 rounded-2xl bg-primary-800 px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-primary-900 disabled:opacity-60"
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          {t.menu.add}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold text-ink-900">
          {fill(t.menu.current, { count: items.length })}
        </h2>

        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-primary-200 bg-white p-8 text-center text-[15px] text-gray-500">
            {t.menu.empty}
          </p>
        ) : (
          items.map((item) => {
            const photo = mediaUrl(item.photo_path);
            return (
              <article
                key={item.id}
                className="flex flex-col gap-4 rounded-3xl border border-black/5 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="tile relative h-16 w-16 shrink-0 rounded-2xl">
                  {photo && (
                    <Image src={photo} alt="" fill sizes="64px" className="object-cover" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink-900">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatTzs(item.price)} · {slotLabels.get(item.slot) ?? item.slot}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => patch(item.id, { is_available: !item.is_available })}
                    className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                      item.is_available
                        ? "bg-primary-100 text-primary-800 hover:bg-primary-200"
                        : "border border-black/5 bg-white text-gray-500 hover:bg-paper-100"
                    }`}
                  >
                    {item.is_available ? t.menu.available : t.dashboard.off}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.id, item.photo_path)}
                    aria-label={t.menu.removeAria}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent-400 text-accent-600 transition hover:bg-accent-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

    </div>
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
