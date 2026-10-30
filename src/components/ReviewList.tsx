import { ShieldCheck } from "lucide-react";
import StarRating from "@/components/StarRating";
import type { Review } from "@/lib/types";

/**
 * Orodha ya maoni ya umma. Haihitaji mwingiliano, hivyo inatumika kwenye
 * kurasa za muuzaji, za bidhaa na za msimamizi bila tofauti.
 */
export default function ReviewList({
  reviews,
  locale,
  labels,
}: {
  reviews: Review[];
  locale: string;
  labels: {
    empty: string;
    verified: string;
    hidden: string;
    about: string;
  };
}) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-primary-200 bg-white p-8 text-center text-[15px] text-gray-500">
        {labels.empty}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="text-[15px] font-extrabold text-ink-900">
                {review.author?.full_name?.trim() || "—"}
              </span>
              <span
                title={labels.verified}
                className="flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700"
              >
                <ShieldCheck size={12} aria-hidden />
                {labels.verified}
              </span>
            </span>
            <StarRating value={review.rating} />
          </div>

          <p className="mt-1 text-xs text-gray-400">
            {new Date(review.created_at).toLocaleDateString(locale)}
            {review.menu_item?.name && (
              <>
                {" · "}
                {labels.about} {review.menu_item.name}
              </>
            )}
          </p>

          {review.comment && (
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-gray-600">
              {review.comment}
            </p>
          )}

          {review.is_hidden && (
            <p className="mt-3 rounded-xl bg-paper-100 px-3 py-2 text-xs font-bold text-gray-500">
              {labels.hidden}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
