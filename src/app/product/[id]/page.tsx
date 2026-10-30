import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  MapPin,
  MessageCircle,
  Phone,
  Store,
} from "lucide-react";
import { getItemReviews, getListing } from "@/lib/db";
import { isSupabaseConfigured, mediaUrl } from "@/lib/media";
import { formatTzs } from "@/lib/data";
import { fill, fillUrl } from "@/lib/i18n";
import ReviewList from "@/components/ReviewList";
import StarRating from "@/components/StarRating";
import { getT } from "@/lib/i18n-server";
import { notFound } from "next/navigation";

export async function generateMetadata() {
  const t = await getT();
  return { title: t.meta.product };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured) notFound();
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const t = await getT();
  const photos = listing.photo_paths.map(mediaUrl).filter(Boolean) as string[];
  const reviews = await getItemReviews("listing_id", listing.id);
  const isSold = listing.status === "sold" || listing.stock === 0;
  const whatsapp =
    listing.whatsapp ?? listing.business?.whatsapp ?? listing.business?.phone;
  const phone = listing.business?.phone ?? listing.whatsapp;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/market"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-700"
      >
        <ArrowLeft size={16} /> {t.product.backToMarket}
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <div className="tile relative aspect-square w-full">
            {photos[0] ? (
              <Image
                src={photos[0]}
                alt={listing.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-contain"
              />
            ) : (
              <p className="px-8 text-center text-sm text-gray-400">
                {t.product.noPhoto}
              </p>
            )}
          </div>

          {photos.length > 1 && (
            <div className="no-scrollbar flex gap-3 overflow-x-auto">
              {photos.slice(1).map((src) => (
                <div key={src} className="tile relative h-24 w-24 shrink-0">
                  <Image src={src} alt="" fill sizes="96px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-accent-500 px-4 py-1.5 text-sm font-extrabold text-white">
              {formatTzs(listing.price)}
            </span>
            <span className="rounded-full bg-primary-50 px-4 py-1.5 text-sm font-semibold text-primary-800">
              {t.conditions[listing.condition]}
            </span>
            {listing.is_negotiable && (
              <span className="rounded-full bg-paper-100 px-4 py-1.5 text-sm font-semibold text-gray-600">
                {t.product.negotiable}
              </span>
            )}
          </div>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink-900">
            {listing.title}
          </h1>

          <p className="mt-2 flex items-center gap-2 text-[15px] text-gray-500">
            <MapPin size={16} />
            {listing.location ?? listing.business?.name}
          </p>

          {listing.business && (
            <div className="mt-6 rounded-3xl border border-primary-100 bg-white p-5">
              <div className="flex items-start gap-4">
                <span className="tile relative h-12 w-12 shrink-0 rounded-xl">
                  {listing.business.logo_path && mediaUrl(listing.business.logo_path) ? (
                    <Image
                      src={mediaUrl(listing.business.logo_path)!}
                      alt={listing.business.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <Store size={20} className="text-primary-200" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-600">
                    {t.product.sellerAbout}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 font-display text-[17px] font-extrabold text-ink-900">
                    {listing.business.name}
                    {listing.business.is_verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700">
                        <BadgeCheck size={12} /> {t.product.sellerVerified}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                    {listing.business.description || t.product.sellerNoAbout}
                  </p>
                  <Link
                    href={`/msosi/${listing.business.slug}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary-700 hover:text-primary-900"
                  >
                    {t.product.sellerStore} <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {isSold ? (
            <p className="mt-8 rounded-2xl bg-paper-100 p-5 text-center font-bold text-accent-600">
              {t.product.soldOut}
            </p>
          ) : (
            <div className="mt-8 space-y-3">
              <Link
                href={`/checkout?listing=${listing.id}`}
                className="flex w-full items-center justify-center rounded-2xl bg-primary-800 px-6 py-4 text-[15px] font-extrabold text-white shadow-sm transition hover:bg-primary-900"
              >
                {t.product.buyNow}
              </Link>

              {whatsapp && (
                <a
                  href={fillUrl("https://wa.me/{phone}?text={message}", {
                    phone: whatsapp.replace(/[^0-9]/g, ""),
                    message: fill(t.product.whatsappMessage, {
                      title: listing.title,
                      price: formatTzs(listing.price),
                    }),
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary-200 bg-white px-6 py-4 text-[15px] font-bold text-primary-800 transition hover:bg-primary-50"
                >
                  <MessageCircle size={18} /> {t.product.whatsapp}
                </a>
              )}

              {phone && (
                <a
                  href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-black/5 bg-white px-6 py-4 text-[15px] font-bold text-ink-900 transition hover:bg-paper-100"
                >
                  <Phone size={18} /> {t.product.contactSeller}
                </a>
              )}
            </div>
          )}

          {listing.description && (
            <div className="mt-10">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink-900">
                {t.product.description}
              </h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-gray-600">
                {listing.description}
              </p>
            </div>
          )}

          <div className="mt-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink-900">
                {t.reviews.sectionTitle}
              </h2>
              {listing.rating_count > 0 && (
                <StarRating
                  value={Number(listing.rating_avg)}
                  size={17}
                  label={fill(t.reviews.count, { count: listing.rating_count })}
                />
              )}
            </div>
            <ReviewList
              reviews={reviews}
              locale={t.localeDate}
              labels={{
                empty: t.reviews.emptyListing,
                verified: t.reviews.verified,
                hidden: t.reviews.hiddenBadge,
                about: t.reviews.about,
              }}
            />
            <p className="text-xs leading-relaxed text-gray-400">{t.reviews.policy}</p>
          </div>

          <p className="mt-10 text-xs leading-relaxed text-gray-400">
            {t.product.safetyTip}
          </p>
        </div>
      </div>
    </div>
  );
}
