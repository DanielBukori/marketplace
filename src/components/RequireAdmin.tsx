import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { getProfile } from "@/lib/db";
import { getT } from "@/lib/i18n-server";

/** Ukurasa wa ndani wa msimamizi tu; wengine huonyeshwa ujumbe wazi. */
export default async function RequireAdmin({
  nextPath,
  children,
}: {
  nextPath: string;
  children: React.ReactNode;
}) {
  const t = await getT();
  const user = await requireUser(nextPath);
  const profile = await getProfile(user.id);

  if (!profile?.is_admin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">
          {t.admin.onlyTitle}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
          {t.admin.onlyDesc}
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900"
        >
          {t.admin.backToDashboard}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
