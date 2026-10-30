import Link from "next/link";
import { CalendarDays, Megaphone } from "lucide-react";
import { getAnnouncements } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/media";
import { getT } from "@/lib/i18n-server";
import SetupNotice from "@/components/SetupNotice";

export default async function NewsPage() {
  const t = await getT();
  if (!isSupabaseConfigured) return <SetupNotice />;
  const announcements = await getAnnouncements();

  const dayMonthYear = (value: string) =>
    new Date(value).toLocaleDateString(t.localeDate, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-700">
        {t.news.eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 md:text-4xl">
        {t.news.title}
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-gray-500">
        {t.news.desc}
      </p>

      {announcements.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-primary-200 bg-white p-12 text-center">
          <Megaphone className="mx-auto text-primary-400" size={28} />
          <p className="mt-4 text-[15px] text-gray-600">{t.news.empty}</p>
          <p className="mt-1 text-sm text-gray-500">
            {t.news.hint}{" "}
            <Link href="/dashboard/news" className="font-bold text-primary-700">
              {t.news.linkLabel}
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-10 space-y-5">
          {announcements.map((item) => (
            <article
              key={item.id}
              className="flex items-start gap-5 rounded-[26px] border border-black/5 bg-white p-6 shadow-[0_14px_34px_-28px_rgba(16,24,40,0.8)]"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                <CalendarDays size={24} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  {dayMonthYear(item.event_at ?? item.created_at)}
                </p>
                <h2 className="mt-1 text-lg font-extrabold text-ink-900">{item.title}</h2>
                {item.body && (
                  <p className="mt-1.5 text-[15px] leading-relaxed text-gray-500">
                    {item.body}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
