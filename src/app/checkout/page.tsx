import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { getBusinessBySlug, getListing } from "@/lib/db";
import CheckoutForm, { type CheckoutLine } from "@/components/CheckoutForm";
import { isSupabaseConfigured } from "@/lib/media";
import { getT } from "@/lib/i18n-server";
import SetupNotice from "@/components/SetupNotice";
import { notFound } from "next/navigation";
import type { MenuItem, Offer } from "@/lib/types";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ business?: string; listing?: string; items?: string }>;
}) {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;
  const user = await requireUser("/checkout");
  const { business: businessSlug, listing: listingId, items } = await searchParams;

  let lines: CheckoutLine[] = [];
  let businessId = "";
  let businessName = "";
  let deliveryFee = 0;
  let extras: MenuItem[] = [];
  let offers: Offer[] = [];

  if (listingId) {
    const listing = await getListing(listingId);
    if (!listing) notFound();

    businessId = listing.business_id;
    businessName = listing.business?.name ?? t.checkout.defaultSeller;
    lines = [
      {
        key: listing.id,
        listingId: listing.id,
        name: listing.title,
        price: listing.price,
        quantity: 1,
        photoPath: listing.photo_paths[0] ?? null,
      },
    ];
  } else if (businessSlug) {
    const board = await getBusinessBySlug(businessSlug);
    if (!board) notFound();

    const wanted = new Map<string, number>();
    for (const part of (items ?? "").split(",")) {
      const [id, qty] = part.split(":");
      if (id) wanted.set(id, Math.max(1, Math.min(20, Number(qty) || 1)));
    }

    // Bei na majina hutokana na rekodi za muuzi, si kivinjari.
    lines = board.menu
      .filter((item) => wanted.has(item.id))
      .map((item) => ({
        key: item.id,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: wanted.get(item.id) ?? 1,
        photoPath: item.photo_path,
      }));

    // Kipande ambacho mnunuzi hakijaichagua bado kinaweza kuongezwa
    // kwenye oda hii — vinywaji hasa, lakini na vitafunio vyovyote.
    extras = board.menu.filter((item) => !wanted.has(item.id));
    offers = board.offers;

    businessId = board.business.id;
    businessName = board.business.name;
    deliveryFee = board.business.delivery_fee;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-[15px] text-gray-600">{t.checkout.empty}</p>
        <Link
          href="/msosi"
          className="mt-5 inline-flex rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900"
        >
          {t.checkout.backToMenu}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          {t.checkout.title}
        </h1>
        <p className="mt-2 text-[15px] text-gray-500">
          {businessName} · {t.checkout.pricesNote}
        </p>
      </div>

      <CheckoutForm
        lines={lines}
        extras={extras}
        offers={offers}
        businessId={businessId}
        deliveryFee={deliveryFee}
        contact={{ email: user.email ?? "", phone: "" }}
      />
    </div>
  );
}
