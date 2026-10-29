import { requireUser } from "@/lib/require-user";
import { getMyBusinesses, getMyPayouts, getPayoutQueue, getProfile } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { isSupabaseConfigured } from "@/lib/media";
import { isSnippeConfigured } from "@/lib/snippe";
import SetupNotice from "@/components/SetupNotice";
import PayoutBoard from "@/components/PayoutBoard";

export default async function PayoutsPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;
  const user = await requireUser("/dashboard/payouts");

  const businesses = await getMyBusinesses(user.id);
  const profile = await getProfile(user.id);

  const [payouts, queue] = await Promise.all([
    getMyPayouts(businesses.map((business) => business.id)),
    profile?.is_admin ? getPayoutQueue() : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          {t.dashboard.payouts}
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-500">
          {t.dashboard.payoutsDesc}
        </p>
      </div>

      <PayoutBoard
        payouts={payouts}
        queue={queue}
        isAdmin={Boolean(profile?.is_admin)}
        mobileMoneyReady={isSnippeConfigured}
      />
    </div>
  );
}
