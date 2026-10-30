"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Save } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";

const KNOWN_KEYS = [
  "support_phone",
  "support_whatsapp",
  "support_email",
  "service_hours",
] as const;

/**
 * Mipangilio michache ya jukwaa. Thamani zote huhifadhiwa kama maandishi
 * kwenye `app_settings`; ukurasa wa mguu huonyesha zile zilizojazwa tu.
 */
export default function SettingsEditor({
  initial,
  knownLabels,
}: {
  initial: Record<string, string>;
  knownLabels: Record<string, string>;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    for (const key of KNOWN_KEYS) base[key] = initial[key] ?? "";
    return base;
  });
  const [extraKey, setExtraKey] = useState("");
  const [extraValue, setExtraValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function save(entries: Record<string, string>) {
    setBusy(true);
    setNotice(null);
    const rows = Object.entries(entries)
      .filter(([key]) => /^[a-z0-9_]{2,40}$/.test(key))
      .map(([key, value]) => ({ key, value: value.trim().slice(0, 300) }));

    if (rows.length === 0) {
      setNotice(t.settings.needKey);
      setBusy(false);
      return;
    }

    const { error } = await createClient().from("app_settings").upsert(rows, {
      onConflict: "key",
    });

    if (error) setNotice(error.message);
    else {
      setNotice(t.settings.saved);
      router.refresh();
    }
    setBusy(false);
  }

  function change(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const extras = Object.entries(initial)
    .filter(([key]) => !KNOWN_KEYS.includes(key as (typeof KNOWN_KEYS)[number]))
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold tracking-tight text-ink-900">
          {t.settings.contactTitle}
        </h2>
        <p className="text-sm leading-relaxed text-gray-500">{t.settings.contactDesc}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {KNOWN_KEYS.map((key) => (
            <label key={key} className="block">
              <span className="text-sm font-bold text-ink-900">{knownLabels[key]}</span>
              <input
                value={values[key] ?? ""}
                onChange={(event) => change(key, event.target.value)}
                maxLength={300}
                className="field mt-1.5 w-full"
              />
            </label>
          ))}
        </div>

        {notice && (
          <p className="rounded-2xl bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800">
            {notice}
          </p>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => void save(values)}
          className="inline-flex items-center gap-2 rounded-full bg-primary-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-900 disabled:opacity-60"
        >
          {busy ? <LoaderCircle size={16} /> : <Save size={16} />}
          {t.common.save}
        </button>
      </section>

      <section className="space-y-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold tracking-tight text-ink-900">
          {t.settings.otherTitle}
        </h2>

        {extras.length === 0 ? (
          <p className="text-sm text-gray-500">{t.settings.noExtras}</p>
        ) : (
          <ul className="space-y-2">
            {extras.map(([key, value]) => (
              <li
                key={key}
                className="flex flex-wrap items-center gap-3 rounded-2xl bg-paper-50 px-4 py-3 text-sm"
              >
                <span className="font-mono text-xs font-bold text-primary-700">{key}</span>
                <span className="min-w-0 flex-1 truncate text-gray-700">{value || "—"}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <label className="block">
            <span className="text-sm font-bold text-ink-900">{t.settings.key}</span>
            <input
              value={extraKey}
              onChange={(event) =>
                setExtraKey(
                  event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, "")
                    .slice(0, 40),
                )
              }
              placeholder="banner_note"
              className="field mt-1.5 w-full font-mono text-xs"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-ink-900">{t.settings.value}</span>
            <input
              value={extraValue}
              onChange={(event) => setExtraValue(event.target.value)}
              maxLength={300}
              className="field mt-1.5 w-full"
            />
          </label>
          <button
            type="button"
            disabled={busy || extraKey.length < 2}
            onClick={() => {
              void save({ [extraKey]: extraValue });
              setExtraKey("");
              setExtraValue("");
            }}
            className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-bold text-ink-900 transition hover:border-primary-400 disabled:opacity-50"
          >
            {t.settings.add}
          </button>
        </div>

        <p className="text-xs leading-relaxed text-gray-500">{t.settings.keyRule}</p>
      </section>
    </div>
  );
}
