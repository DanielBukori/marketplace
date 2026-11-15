"use client";
import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/media";
import { reportProblem } from "@/lib/report";
import SetupNotice from "@/components/SetupNotice";

/**
 * Hatua: `loading` (tunasoma kipindi), `request` (omba kiungo),
 * `sent`, `set` (kiungo kimefunguliwa — weka nenosiri jipya), `done`.
 */
type Stage = "loading" | "request" | "sent" | "set" | "done";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const [stage, setStage] = useState<Stage>(isSupabaseConfigured ? "loading" : "request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fail(raw: string) {
    setError(raw);
    reportProblem("reset-password", raw);
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;

    void (async () => {
      const { data } = await createClient().auth.getSession();
      if (active) setStage(data.session ? "set" : "request");
    })();

    return () => {
      active = false;
    };
  }, []);

  function hintFor(raw: string) {
    const text = raw.toLowerCase();
    if (
      text.includes("failed to fetch") ||
      text.includes("fetch failed") ||
      text.includes("load failed") ||
      text.includes("network")
    ) {
      return t.common.problems.offline;
    }
    if (text.includes("rate limit") || text.includes("security purposes"))
      return t.auth.errRateLimit;
    if (text.includes("password") && (text.includes("short") || text.includes("least")))
      return t.reset.errWeak;
    if (text.includes("session") || text.includes("jwt"))
      return t.reset.errSession;
    if (
      (text.includes("email") && text.includes("invalid")) ||
      text.includes("badly formatted")
    )
      return t.auth.errBadEmail;
    return null;
  }

  function errorNote(raw: string) {
    const hint = hintFor(raw);
    return (
      <div role="alert" className="rounded-xl bg-accent-100 px-4 py-3">
        <p className="text-sm font-semibold text-accent-600">{hint ?? t.auth.errGeneric}</p>
        {hint && process.env.NODE_ENV === "development" && (
          <p className="mt-1 font-mono text-[11px] leading-relaxed text-gray-600">{raw}</p>
        )}
      </div>
    );
  }

  async function requestLink(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error: sendError } = await createClient().auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${base}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
        },
      );
      if (sendError) fail(sendError.message);
      else setStage("sent");
    } catch (err) {
      fail(err instanceof Error ? err.message : String(err));
    }
    setBusy(false);
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t.reset.errWeak);
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password });
      if (updateError) fail(updateError.message);
      else setStage("done");
    } catch (err) {
      fail(err instanceof Error ? err.message : String(err));
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-6 sm:py-14">
      <div className="animate-pop-in overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_22px_60px_-28px_rgba(10,47,80,0.45)]">
        <div className="border-b border-paper-200 bg-linear-to-b from-primary-50 to-white px-6 pb-5 pt-6 text-center">
          <Image
            src="/iaa/iaa-crest.png"
            width={90}
            height={87}
            alt={t.brand.name}
            className="mx-auto h-11 w-auto"
          />
          <h1 className="mt-3 text-[23px] font-extrabold leading-tight tracking-tight text-ink-900">
            {t.reset.title}
          </h1>
        </div>

        <div className="px-5 py-6 sm:px-6">
          {!isSupabaseConfigured ? (
            <SetupNotice />
          ) : stage === "loading" ? (
            <p className="py-8 text-center text-sm text-gray-500">{t.common.loading}</p>
          ) : stage === "request" ? (
            <form onSubmit={requestLink} className="space-y-4">
              <p className="text-sm leading-relaxed text-gray-500">{t.reset.intro}</p>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-900" htmlFor="email">
                  {t.auth.email}
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
                  />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.auth.emailPlaceholder}
                    className="field pl-11"
                  />
                </div>
              </div>

              {error && errorNote(error)}

              <button
                type="submit"
                disabled={busy || email.trim().length === 0}
                className="w-full rounded-2xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
              >
                {busy ? t.reset.requesting : t.reset.requestCta}
              </button>
            </form>
          ) : stage === "sent" ? (
            <div className="space-y-5 text-center">
              <Mail className="mx-auto text-primary-600" size={36} />
              <div>
                <p className="font-display text-lg font-bold text-ink-900">{t.reset.sentTitle}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {fill(t.reset.sentBody, { email })}
                </p>
              </div>
            </div>
          ) : stage === "set" ? (
            <form onSubmit={savePassword} className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink-900">
                  {t.reset.newTitle}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{t.reset.newIntro}</p>
              </div>

              <div>
                <label
                  className="mb-1.5 block text-sm font-semibold text-ink-900"
                  htmlFor="password"
                >
                  {t.auth.password}
                </label>
                <div className="relative">
                  <LockKeyhole
                    aria-hidden
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.auth.passwordPlaceholder}
                    className="field pl-11 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-gray-500 transition hover:bg-paper-100 hover:text-primary-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && errorNote(error)}

              <button
                type="submit"
                disabled={busy || password.length === 0}
                className="w-full rounded-2xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
              >
                {busy ? t.reset.saving : t.reset.saveCta}
              </button>
            </form>
          ) : (
            <div className="space-y-5 text-center">
              <CheckCircle2 className="mx-auto text-primary-600" size={38} />
              <div>
                <p className="font-display text-lg font-bold text-ink-900">{t.reset.doneTitle}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{t.reset.doneBody}</p>
              </div>
              <Link
                href="/dashboard"
                className="block w-full rounded-2xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700"
              >
                {t.reset.doneCta}
              </Link>
            </div>
          )}
        </div>
      </div>

      <Link
        href="/login"
        className="mt-5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary-700"
      >
        <ArrowLeft size={16} /> {t.reset.back}
      </Link>
    </div>
  );
}
