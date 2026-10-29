import { requireUser } from "@/lib/require-user";
import { getMyBusinesses, getMyListings } from "@/lib/db";
import ListingManager from "@/components/ListingManager";
import { isSupabaseConfigured } from "@/lib/media";
import { getT } from "@/lib/i18n-server";
import SetupNotice from "@/components/SetupNotice";

export default async function MyListingsPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;
  const user = await requireUser("/dashboard/listings");
  const businesses = await getMyBusinesses(user.id);
  const listings = await getMyListings(businesses.map((b) => b.id));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          {t.dashboard.yourListings}
        </h1>
        <p className="mt-2 text-[15px] text-gray-500">{t.dashboard.listingsDesc}</p>
      </div>

      <ListingManager
        listings={listings}
        businesses={businesses.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}
