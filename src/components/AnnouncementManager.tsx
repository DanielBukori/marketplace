"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import type { Announcement } from "@/lib/types";

export default function AnnouncementManager({ items }: { items: Announcement[] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [eventAt, setEventAt] = useState("");
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("announcements").insert({
      title: title.trim(),
      body: body.trim(),
      event_at: eventAt || null,
      published,
    });

    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setTitle("");
    setBody("");
    setEventAt("");
    router.refresh();
  }

  async function toggle(id: string, next: boolean) {
    setBusy(true);
    setError(null);
    const { error: updateError } = await createClient()
      .from("announcements")
      .update({ published: next })
      .eq("id", id);
    setBusy(false);

    if (updateError) setError(updateError.message);
    else router.refresh();
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    const { error: deleteError } = await createClient()
      .from("announcements")
      .delete()
      .eq("id", id);
    setBusy(false);

    if (deleteError) setError(deleteError.message);
    else router.refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={create} className="space-y-5 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
          {t.announcement.newTitle}
        </h2>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink-900">{t.announcement.title}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
            className="field"
            placeholder={t.announcement.titlePlaceholder}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink-900">{t.announcement.body}</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={800}
            className="field"
            placeholder={t.announcement.bodyPlaceholder}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-ink-900">
              {t.announcement.eventAt}
            </span>
            <input
              type="date"
              value={eventAt}
              onChange={(e) => setEventAt(e.target.value)}
              className="field"
            />
          </label>

          <label className="flex items-center gap-3 self-end pb-3 text-sm font-bold text-ink-900">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-5 w-5 accent-primary-800"
            />
            {t.announcement.showOnFeed}
          </label>
        </div>

        {error && (
          <p className="rounded-xl bg-accent-100 px-4 py-3 text-sm text-accent-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy || title.trim().length < 4}
          className="inline-flex items-center gap-2 rounded-full bg-primary-800 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-primary-900 disabled:opacity-50"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : null} {t.announcement.publish}
        </button>
      </form>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
          {t.announcement.saved}
        </h2>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-primary-200 bg-white p-10 text-center">
            <p className="text-[15px] text-gray-600">{t.announcement.empty}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-black/5 bg-white p-5 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-extrabold text-ink-900">{item.title}</p>
                  {item.body && (
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">
                      {item.body}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-gray-400">
                    {item.event_at ??
                      new Date(item.created_at).toLocaleDateString(t.localeDate)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggle(item.id, !item.published)}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${
                      item.published
                        ? "border border-gray-200 text-ink-900 hover:border-primary-300"
                        : "bg-primary-800 text-white hover:bg-primary-900"
                    }`}
                  >
                    {item.published ? t.announcement.hide : t.announcement.publish}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(item.id)}
                    aria-label={t.announcement.deleteAria}
                    className="rounded-xl border border-accent-400 p-2 text-accent-600 transition hover:bg-accent-100 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
