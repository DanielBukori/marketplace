"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { fill } from "@/lib/i18n";
import { formatTzs } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import type { Business, Listing } from "@/lib/types";

export default function ListingManager({
  listings,
  businesses,
}: {
  listings: Listing[];
  businesses: Pick<Business, "id" | "name">[];
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [businessId, setBusinessId] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = listings.filter(
    (l) => businessId === "all" || l.business_id === businessId,
  );

  async function setStatus(id: string, status: Listing["status"]) {
    setBusyId(id);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("listings")
      .update({
        status,
        published_at: status === "active" ? new Date().toISOString() : undefined,
      })
      .eq("id", id);
    setBusyId(null);

    if (updateError) setError(updateError.message);
    else router.refresh();
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-primary-200 bg-white p-12 text-center">
        <p className="text-[15px] text-gray-600">{t.listings.empty}</p>
        <Link
          href="/post"
          className="mt-5 inline-flex rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900"
        >
          {t.nav.post}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setBusinessId("all")}
          className={`chip ${businessId === "all" ? "chip-active" : ""}`}
        >
          {fill(t.listings.all, { count: listings.length })}
        </button>
        {businesses.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBusinessId(b.id)}
            className={`chip ${businessId === b.id ? "chip-active" : ""}`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl bg-accent-100 px-4 py-3 text-sm text-accent-600">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {visible.map((listing) => {
          const photo = mediaUrl(listing.photo_paths[0]);
          const busy = busyId === listing.id;

          return (
            <article
              key={listing.id}
              className="flex flex-col gap-4 rounded-3xl border border-black/5 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="tile relative h-20 w-20 shrink-0 rounded-2xl">
                {photo && (
                  <Image src={photo} alt="" fill sizes="80px" className="object-cover" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-bold text-ink-900">
                  {listing.title}
                </p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {formatTzs(listing.price)} · {listing.business?.name}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-primary-700">
                  {t.listingStatus[listing.status]}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/post/${listing.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-black/5 bg-white px-4 py-2.5 text-sm font-bold text-ink-900 transition hover:bg-paper-100"
                >
                  <Pencil size={15} /> {t.listings.edit}
                </Link>

                {listing.status === "active" ? (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setStatus(listing.id, "sold")}
                      className="rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-accent-600 disabled:opacity-50"
                    >
                      {t.listings.markSold}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setStatus(listing.id, "archived")}
                      className="rounded-xl border border-black/5 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-paper-100 disabled:opacity-50"
                    >
                      {t.listings.remove}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStatus(listing.id, "active")}
                    className="rounded-xl bg-primary-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-900 disabled:opacity-50"
                  >
                    {t.listings.republish}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
