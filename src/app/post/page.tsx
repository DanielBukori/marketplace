import { requireUser } from "@/lib/require-user";
import { getMyBusinesses } from "@/lib/db";
import ListingForm from "@/components/ListingForm";
import { isSupabaseConfigured } from "@/lib/media";
import { getT } from "@/lib/i18n-server";
import SetupNotice from "@/components/SetupNotice";

export default async function PostPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;
  const user = await requireUser("/post");
  const businesses = await getMyBusinesses(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          {t.post.title}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-500">
          {t.post.desc}
        </p>
      </div>

      <ListingForm
        userId={user.id}
        businesses={businesses.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}
