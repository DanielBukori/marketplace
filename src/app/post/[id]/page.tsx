import { requireUser } from "@/lib/require-user";
import { getListing, getMyBusinesses } from "@/lib/db";
import ListingForm from "@/components/ListingForm";
import { isSupabaseConfigured } from "@/lib/media";
import { getT } from "@/lib/i18n-server";
import SetupNotice from "@/components/SetupNotice";
import { notFound, redirect } from "next/navigation";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;
  const user = await requireUser("/dashboard");
  const { id } = await params;

  const listing = await getListing(id);
  if (!listing) notFound();

  const businesses = await getMyBusinesses(user.id);
  const owns = businesses.some((b) => b.id === listing.business_id);
  if (!owns) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          {t.post.editTitle}
        </h1>
        <p className="mt-2 text-[15px] text-gray-500">{listing.title}</p>
      </div>

      <ListingForm
        userId={user.id}
        businesses={businesses.map((b) => ({ id: b.id, name: b.name }))}
        listing={listing}
      />
    </div>
  );
}
