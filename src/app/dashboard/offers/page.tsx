import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { getBusinessOffers, getMyBusinesses } from "@/lib/db";
import OfferManager from "@/components/OfferManager";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import SetupNotice from "@/components/SetupNotice";

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ business?: string }>;
}) {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;
  const user = await requireUser("/dashboard/offers");
  const { business } = await searchParams;

  const businesses = await getMyBusinesses(user.id);
  const target = businesses.find((b) => b.id === business) ?? businesses[0];

  if (!target) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-[15px] text-gray-600">{t.dashboard.needBusinessForMenu}</p>
        <Link
          href="/dashboard/business/new"
          className="mt-5 inline-flex rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900"
        >
          {t.dashboard.openBusiness}
        </Link>
      </div>
    );
  }

  const offers = await getBusinessOffers([target.id]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          {t.offer.title}
        </h1>
        <p className="mt-2 text-[15px] text-gray-500">{t.offer.desc}</p>
      </div>

      {businesses.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {businesses.map((b) => (
            <Link
              key={b.id}
              href={`/dashboard/offers?business=${encodeURIComponent(b.id)}`}
              className={`chip ${b.id === target.id ? "chip-active" : ""}`}
            >
              {b.name}
            </Link>
          ))}
        </div>
      )}

      <OfferManager
        businessId={target.id}
        businessName={target.name}
        offers={offers}
      />
    </div>
  );
}
