import { requireUser } from "@/lib/require-user";
import { getRoles } from "@/lib/roles";
import { getCourierOrders, getProfile } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/media";
import { getT } from "@/lib/i18n-server";
import { noIndexMeta } from "@/lib/seo";
import SetupNotice from "@/components/SetupNotice";
import CourierBoard from "@/components/CourierBoard";
import CourierRequest from "@/components/CourierRequest";

export async function generateMetadata() {
  const t = await getT();
  return {
    ...noIndexMeta,
    title: `${t.courier.title} · ${t.brand.name} ${t.brand.suffix}`,
  };
}

export default async function CourierPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;

  const user = await requireUser("/dashboard/courier");
  const roles = await getRoles(user.id);
  const profile = await getProfile(user.id);

  // Oda za msabishi hutolewa tu baada ya uidhinishaji; RLS huzuia mtu
  // mwingine kuona kazi ambazo hazikuwa zake.
  const orders = roles.isCourier ? await getCourierOrders(user.id) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          {t.courier.title}
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-500">
          {t.courier.desc}
        </p>
      </div>

      {roles.isCourier ? (
        <>
          <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
            {t.courier.workTitle}
          </h2>
          <CourierBoard orders={orders} />
          <p className="text-xs leading-relaxed text-gray-500">{t.courier.moneyNote}</p>
        </>
      ) : (
        <CourierRequest status={roles.courierStatus} hasPhone={Boolean(profile?.phone)} />
      )}
    </div>
  );
}
