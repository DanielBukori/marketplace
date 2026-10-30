import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { mediaUrl } from "@/lib/media";
import type { Ad } from "@/lib/types";

/**
 * Mstari wa matangazo yaliyolipwa. Urefu wa muda na bei vimekwidha kwenye
 * jedwali `ads`; hapa huonekana tu zile ambazo ni "live" na bado hazijisha.
 */
export default function AdStrip({
  ads,
  label,
  sponsored,
}: {
  ads: Ad[];
  label: string;
  sponsored: string;
}) {
  if (ads.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
          {label}
        </h2>
        <span className="h-px flex-1 bg-black/5" />
      </div>

      <ul className="no-scrollbar mt-4 flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
        {ads.map((ad) => {
          const src = mediaUrl(ad.image_path);
          const href = ad.target_url || (ad.business?.slug ? `/msosi/${ad.business.slug}` : null);

          return (
            <li key={ad.id} className="w-[240px] shrink-0 sm:w-auto">
              <Link
                href={href ?? "/"}
                className="group block overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="relative block aspect-[4/3] w-full bg-paper-100">
                  {src ? (
                    <Image
                      src={src}
                      alt={ad.title}
                      fill
                      sizes="(max-width: 640px) 60vw, 25vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <ImageOff className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-300" />
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                    {sponsored}
                  </span>
                </span>
                <span className="block px-4 py-3">
                  <span className="block truncate text-[15px] font-extrabold text-ink-900">
                    {ad.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-gray-500">
                    {ad.business?.name ?? "—"}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
