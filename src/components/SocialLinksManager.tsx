"use client";
import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import BrandIcon, { brandHex, platformLabel } from "@/components/BrandIcon";
import type { SocialLink, SocialPlatform } from "@/lib/types";

const PLATFORMS: SocialPlatform[] = [
  "instagram",
  "tiktok",
  "x",
  "facebook",
  "whatsapp",
  "telegram",
  "youtube",
  "linkedin",
  "website",
];

/**
 * Msimamizi ndiye pekee anayeweka viungo hivi; ukurasa wa mguu huonyesha
 * icon za jukwaa ambalo lina kiungo hai tu — hakuna alama za uongo.
 */
export default function SocialLinksManager({ links }: { links: SocialLink[] }) {
  const { t } = useLanguage();
  const router = useRouter();
  const byPlatform = new Map(links.map((link) => [link.platform, link]));

  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [url, setUrl] = useState(byPlatform.get("instagram")?.url ?? "");
  const [label, setLabel] = useState(byPlatform.get("instagram")?.label ?? "");
  const [sortOrder, setSortOrder] = useState(
    String(byPlatform.get("instagram")?.sort_order ?? 0),
  );
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function pickPlatform(next: SocialPlatform) {
    setPlatform(next);
    const existing = byPlatform.get(next);
    setUrl(existing?.url ?? "");
    setLabel(existing?.label ?? "");
    setSortOrder(String(existing?.sort_order ?? 0));
    setIsActive(existing ? existing.is_active : true);
    setNotice(null);
  }

  async function save() {
    const trimmed = url.trim();
    if (!/^https?:\/\/.{3,}/i.test(trimmed)) {
      setNotice(t.social.needUrl);
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const { error } = await createClient().from("social_links").upsert(
        {
          platform,
          url: trimmed,
          label: label.trim().slice(0, 40),
          sort_order: Number(sortOrder) || 0,
          is_active: isActive,
        },
        { onConflict: "platform" },
      );

      if (error) setNotice(error.message);
      else {
        setNotice(t.social.saved);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(link: SocialLink) {
    setBusy(true);
    setNotice(null);
    const { error } = await createClient()
      .from("social_links")
      .delete()
      .eq("id", link.id);

    if (error) setNotice(error.message);
    else router.refresh();
    setBusy(false);
  }

  async function toggle(link: SocialLink) {
    setBusy(true);
    const { error } = await createClient()
      .from("social_links")
      .update({ is_active: !link.is_active })
      .eq("id", link.id);

    if (error) setNotice(error.message);
    else router.refresh();
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold tracking-tight text-ink-900">
          {t.social.formTitle}
        </h2>

        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((option) => {
            const isSelected = option === platform;
            const alreadySaved = byPlatform.has(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => pickPlatform(option)}
                style={{ "--brand": brandHex(option) } as CSSProperties}
                aria-pressed={isSelected}
                title={platformLabel(option)}
                className={`relative flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                  isSelected
                    ? "border-transparent bg-(--brand) text-white shadow-md shadow-black/10"
                    : "border-black/10 bg-paper-50 text-gray-400 hover:text-(--brand)"
                }`}
              >
                <BrandIcon platform={option} size={20} />
                {alreadySaved && !isSelected && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary-600" />
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
          {platformLabel(platform)}
        </p>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-ink-900">{t.social.url}</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://instagram.com/iaa_marketplace"
              className="field mt-1.5 w-full"
              inputMode="url"
              autoComplete="off"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <label className="block">
              <span className="text-sm font-bold text-ink-900">
                {t.social.label} <span className="font-medium text-gray-400">{t.common.optional}</span>
              </span>
              <input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                maxLength={40}
                placeholder={platformLabel(platform)}
                className="field mt-1.5 w-full"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-ink-900">{t.social.order}</span>
              <input
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                className="field mt-1.5 w-full"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 text-sm font-semibold text-ink-900">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-500"
            />
            {t.social.showInFooter}
          </label>
        </div>

        {notice && (
          <p className="rounded-2xl bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800">
            {notice}
          </p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900 disabled:opacity-60"
        >
          {busy ? <LoaderCircle size={16} /> : <Plus size={16} />}
          {t.social.save}
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold tracking-tight text-ink-900">
          {t.social.listTitle}
        </h2>

        {links.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-primary-200 bg-white px-6 py-8 text-center text-sm text-gray-500">
            {t.social.empty}
          </p>
        ) : (
          <ul className="space-y-2">
            {links.map((link) => (
              <li
                key={link.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white p-4"
                style={{ "--brand": brandHex(link.platform) } as CSSProperties}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: brandHex(link.platform) }}>
                  <BrandIcon platform={link.platform} size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink-900">
                    {link.label || platformLabel(link.platform)}
                  </p>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer nofollow"
                    className="block truncate text-xs text-gray-500 hover:text-primary-700"
                  >
                    {link.url}
                  </a>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    link.is_active
                      ? "bg-primary-100 text-primary-800"
                      : "bg-paper-100 text-gray-500"
                  }`}
                >
                  {link.is_active ? t.social.visible : t.social.hidden}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggle(link)}
                  className="rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-ink-900 transition hover:border-primary-400 disabled:opacity-50"
                >
                  {link.is_active ? t.admin.turnOff : t.admin.turnOn}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(link)}
                  aria-label={t.social.remove}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-accent-400 text-accent-600 transition hover:bg-accent-100 disabled:opacity-50"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
