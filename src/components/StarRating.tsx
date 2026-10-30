import { Star } from "lucide-react";

/**
 * Nyota tano za kuonyesha tu — thamani hutokana na wastani wa hifadhidata.
 * Hakuna kitu kinachobadilika hapa, kwa hivyo sehemu hii inaweza kutumika
 * kwenye kurasa za seva zisizo za mteja.
 */
export default function StarRating({
  value,
  size = 15,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const safe = Math.max(0, Math.min(5, Number(value) || 0));
  const percent = (safe / 5) * 100;

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
      <span
        role="img"
        aria-label={`${safe} / 5`}
        className="relative inline-flex"
      >
        <span className="flex text-gray-200">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={size} className="shrink-0" aria-hidden />
          ))}
        </span>
        <span
          className="absolute inset-0 flex overflow-hidden text-accent-500"
          style={{ width: `${percent}%` }}
          aria-hidden
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              size={size}
              fill="currentColor"
              className="shrink-0"
            />
          ))}
        </span>
      </span>
      <span className="text-xs font-bold text-ink-900">{safe.toFixed(1)}</span>
      {label && <span className="text-xs text-gray-500">{label}</span>}
    </span>
  );
}
