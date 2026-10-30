"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import StarRating from "@/components/StarRating";
import type { Review } from "@/lib/types";

export default function ReviewsModeration({ reviews }: { reviews: Review[] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(changes: Record<string, unknown>, id: string, message: string) {
    setBusy(true);
    setNotice(null);
    const { error } = await createClient()
      .from("reviews")
      .update(changes)
      .eq("id", id);

    if (error) setNotice(error.message);
    else {
      setNotice(message);
      router.refresh();
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm(t.reviews.removeConfirm)) return;
    setBusy(true);
    setNotice(null);
    const { error } = await createClient().from("reviews").delete().eq("id", id);

    if (error) setNotice(error.message);
    else {
      setNotice(t.reviews.removed);
      router.refresh();
    }
    setBusy(false);
  }

  if (reviews.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-primary-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
        {t.reviews.emptyAdmin}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {notice && (
        <p className="rounded-2xl bg-primary-50 px-5 py-4 text-sm font-semibold text-primary-800">
          {notice}
        </p>
      )}

      <ul className="space-y-3">
        {reviews.map((review) => (
          <li
            key={review.id}
            className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] font-extrabold text-ink-900">
                  {review.author?.full_name || t.reviews.anonymous}
                </p>
                {review.business?.slug ? (
                  <Link
                    href={`/msosi/${review.business.slug}`}
                    className="text-sm font-semibold text-primary-700 hover:text-primary-900"
                  >
                    {review.business.name}
                  </Link>
                ) : (
                  <p className="text-sm text-gray-500">{review.business?.name ?? "—"}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleString(t.localeDate)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <StarRating value={Number(review.rating)} size={16} />
                {review.is_hidden && (
                  <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-bold text-accent-600">
                    {t.reviews.hiddenBadge}
                  </span>
                )}
              </div>
            </div>

            {review.menu_item?.name && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-paper-100 px-3 py-1 text-xs font-bold text-gray-600">
                <ShieldCheck size={13} /> {t.reviews.about} {review.menu_item.name}
              </p>
            )}

            {review.comment && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {review.comment}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2 border-t border-black/5 pt-4">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(
                    { is_hidden: !review.is_hidden },
                    review.id,
                    review.is_hidden ? t.reviews.shownAgain : t.reviews.hiddenNow,
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-ink-900 transition hover:border-primary-400 disabled:opacity-50"
              >
                {review.is_hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                {review.is_hidden ? t.reviews.unhide : t.reviews.hide}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => void remove(review.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent-400 px-4 py-2 text-xs font-bold text-accent-600 transition hover:bg-accent-100 disabled:opacity-50"
              >
                <Trash2 size={14} /> {t.reviews.delete}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-gray-500">{t.reviews.moderationNote}</p>
    </div>
  );
}
