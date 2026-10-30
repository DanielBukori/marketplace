import { getAllReviews } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import RequireAdmin from "@/components/RequireAdmin";
import ReviewsModeration from "@/components/ReviewsModeration";
import SetupNotice from "@/components/SetupNotice";

export default async function AdminReviewsPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;

  const reviews = await getAllReviews();

  return (
    <RequireAdmin nextPath="/dashboard/admin/reviews">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
            {t.reviews.adminTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-500">
            {t.reviews.adminDesc}
          </p>
        </div>

        <ReviewsModeration reviews={reviews} />
      </div>
    </RequireAdmin>
  );
}
