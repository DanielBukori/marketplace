"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

/**
 * Maoni ya mnunuzi baada ya oda kukamilika. Hifadhidata ndiyo inayokata
 * maoni yasiyoja kwa mnunuzi wa oda hiyo, au kabla oda haijakamilika,
 * kwa hivyo hakuna njia ya kujipa nyota.
 */
export default function ReviewComposer({
  orderId,
  businessId,
  lines,
}: {
  orderId: string;
  businessId: string;
  lines: { menuItemId: string | null; name: string }[];
}) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [itemId, setItemId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const foodLines = lines.filter(
    (line): line is { menuItemId: string; name: string } => line.menuItemId !== null,
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (rating < 1) {
      setError(t.reviews.needStars);
      return;
    }

    setBusy(true);
    const { error: insertError } = await createClient().from("reviews").insert({
      business_id: businessId,
      order_id: orderId,
      author_id: user?.id,
      menu_item_id: itemId || null,
      rating,
      comment: comment.trim().slice(0, 600),
      is_hidden: false,
    });
    setBusy(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <p className="rounded-2xl bg-primary-50 px-5 py-4 text-sm font-semibold text-primary-800">
        {t.reviews.thanks}
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6"
    >
      <div>
        <h3 className="text-base font-extrabold text-ink-900">{t.reviews.formTitle}</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">{t.reviews.formDesc}</p>
      </div>

      <div
        role="radiogroup"
        aria-label={t.reviews.starsLabel}
        className="flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} / 5`}
            onClick={() => setRating(value)}
            className="rounded-lg p-1 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
          >
            <Star
              size={30}
              aria-hidden
              className={
                value <= rating ? "fill-accent-500 text-accent-500" : "text-gray-300"
              }
            />
          </button>
        ))}
        <span className="ml-2 text-sm font-bold text-ink-900">
          {rating > 0 ? t.reviews.stars[rating - 1] : t.reviews.pickStars}
        </span>
      </div>

      {foodLines.length > 1 && (
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-ink-900">
            {t.reviews.subjectLabel}
          </span>
          <select
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="field"
          >
            <option value="">{t.reviews.subjectAll}</option>
            {foodLines.map((line) => (
              <option key={line.menuItemId} value={line.menuItemId}>
                {line.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-ink-900">
          {t.reviews.commentLabel}
        </span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={600}
          placeholder={t.reviews.commentPlaceholder}
          className="field resize-y"
        />
      </label>

      {error && (
        <p className="rounded-xl bg-accent-100 px-4 py-3 text-sm text-accent-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-2xl bg-primary-800 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-primary-900 disabled:opacity-60"
      >
        {busy && <Loader2 size={16} className="animate-spin" />}
        {busy ? t.reviews.saving : t.reviews.submit}
      </button>
    </form>
  );
}
