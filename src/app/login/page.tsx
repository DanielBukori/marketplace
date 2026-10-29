"use client";
import { useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Mail, Phone, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import { fill } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/media";
import SetupNotice from "@/components/SetupNotice";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Step = "choose" | "email" | "sent";

/** Kitu kutoka kwa URL bila `useSearchParams`, ambacho kingeomba Suspense. */
function useQueryParam(name: string) {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("popstate", onStoreChange);
      return () => window.removeEventListener("popstate", onStoreChange);
    },
    () => new URLSearchParams(window.location.search).get(name),
    () => null,
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="h-[18px] w-[18px]">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.4h11.84c-.52 2.75-2.1 5.08-4.4 6.64v5.52h7.12c4.16-3.84 6.56-9.48 6.56-16.06z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.96 14.56-5.32l-7.12-5.52c-1.96 1.32-4.48 2.12-7.44 2.12-5.72 0-10.56-3.88-12.28-9.12H4.4v5.7C8.04 41.64 15.52 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.72 28.16c-.44-1.32-.72-2.72-.72-4.16s.28-2.84.72-4.16v-5.7H4.4C2.92 17.04 2 20.4 2 24s.92 6.96 2.4 9.76l7.32-5.6z"
      />
      <path
        fill="#EA4335"
        d="M24 10.4c3.24 0 6.16 1.12 8.44 3.32l6.28-6.28C34.92 4.32 29.94 2 24 2 15.52 2 8.04 6.36 4.4 12.14l7.32 5.7c1.72-5.24 6.56-9.44 12.28-9.44z"
      />
    </svg>
  );
}

function AuthRow({
  icon,
  label,
  caption,
  onClick,
  badge,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  caption?: string;
  onClick?: () => void;
  badge?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-left transition enabled:hover:border-primary-300 enabled:hover:bg-primary-50/50 disabled:opacity-60"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-paper-100 text-primary-700 transition group-enabled:group-hover:bg-white">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink-900">{label}</span>
        {caption && (
          <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">{caption}</span>
        )}
      </span>
      {badge ? (
        <span className="shrink-0 rounded-full bg-accent-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-accent-600">
          {badge}
        </span>
      ) : (
        <ArrowRight
          size={16}
          className="shrink-0 text-gray-300 transition group-enabled:group-hover:text-primary-600"
        />
      )}
    </button>
  );
}

export default function LoginPage() {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("choose");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const linkError = useQueryParam("error_description");
  const [linkErrorHidden, setLinkErrorHidden] = useState(false);

  // Ruga za ndani tu: `//host` ni protocol-relative, ingekuwa open redirect.
  function nextPath() {
    const raw = new URLSearchParams(window.location.search).get("next") ?? "/dashboard";
    return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
  }

  // `next` husomwa browserani ili ukurasa huu usihitaji Suspense ya useSearchParams.
  function redirectTo() {
    return `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath())}`;
  }

  // Supabase hutoa ujumbe wa Kiingereza; hii huongeza hatua halisi ya Kiswahili/EN.
  function hintFor(raw: string) {
    const text = raw.toLowerCase();
    if (text.includes("exchange external code")) return t.auth.errGoogle;
    if (text.includes("error sending magic link") || text.includes("smtp")) return t.auth.errSmtp;
    if (text.includes("rate limit")) return t.auth.errRateLimit;
    if (text.includes("code verifier") || text.includes("pkce")) return t.auth.errPkce;
    if (text.includes("token")) return t.auth.errToken;
    if (text.includes("redirect")) return t.auth.errRedirect;
    if (text.includes("signup")) return t.auth.errSignupDisabled;
    return null;
  }

  async function continueWithGoogle() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo() },
      });
      // Mafanikio huondoka kwenye ukurasa, kwa hivyo makosa tu ndiyo yanaonekana hapa.
      if (oauthError) setError(oauthError.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setBusy(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: redirectTo(),
          // Hii inaandika profaili wakati Supabase inapotengeneza mtumiaji
          // mpya; kwa akaunti zilizopo humezaachwa kama zilivyo.
          data: { full_name: name.trim(), phone: phone.trim() },
        },
      });

      if (signInError) setError(signInError.message);
      else setStep("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setBusy(false);
  }

  function openEmailForm() {
    setError(null);
    setLinkErrorHidden(true);
    setStep("email");
  }

  // Njia mbadala ya kiungo: namba 6 za OTP zinafanya kazi hata kama barua pepe
  // imesomwa kwenye simu isiyoona `localhost`.
  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: "email",
      });
      if (verifyError) {
        setError(verifyError.message);
        setBusy(false);
        return;
      }
      // Session imehifadhiwa kwenye cookies; pakia upya ili SSR ionekane.
      window.location.assign(nextPath());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-10 sm:py-14">
      <div className="animate-pop-in overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_22px_60px_-28px_rgba(10,47,80,0.45)]">
        <div className="border-b border-paper-200 bg-linear-to-b from-primary-50 to-white px-6 pb-6 pt-7 text-center">
          <Image
            src="/iaa/iaa-crest.png"
            width={90}
            height={87}
            alt={t.brand.name}
            className="mx-auto h-12 w-auto"
          />
          <h1 className="mt-4 text-[26px] font-extrabold leading-tight tracking-tight text-ink-900">
            {t.auth.dialogTitle}
          </h1>
          <p className="mx-auto mt-2 max-w-[19rem] text-sm leading-relaxed text-gray-500">
            {t.auth.dialogSubtitle}
          </p>
        </div>

        <div className="px-6 py-6">
          {!isSupabaseConfigured ? (
            <SetupNotice />
          ) : step === "sent" ? (
            <div className="space-y-5">
              <div className="text-center">
                <CheckCircle2 className="mx-auto text-primary-600" size={38} />
                <p className="mt-4 font-display text-lg font-bold text-ink-900">
                  {t.auth.sentTitle}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {fill(t.auth.sentBody, { email })}
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-3">
                <div>
                  <label
                    className="block text-sm font-semibold text-ink-900"
                    htmlFor="code"
                  >
                    {t.auth.codeLabel}
                  </label>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {t.auth.codeIntro}
                  </p>
                </div>
                <input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  placeholder={t.auth.codePlaceholder}
                  className="field text-center font-display text-xl font-bold tracking-[0.45em]"
                />

                {error && (
                  <div className="rounded-xl bg-accent-100 px-4 py-3">
                    <p className="text-sm font-semibold text-accent-600">{error}</p>
                    {hintFor(error) && (
                      <p className="mt-1 text-xs leading-relaxed text-accent-600">
                        {hintFor(error)}
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || code.length < 6}
                  className="w-full rounded-2xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
                >
                  {busy ? t.auth.codeVerifying : t.auth.codeVerify}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setCode("");
                  setStep("choose");
                }}
                className="block w-full text-center text-sm font-semibold text-primary-700 hover:underline"
              >
                {t.auth.sentOther}
              </button>
            </div>
          ) : step === "choose" ? (
            <div className="space-y-3">
              {linkError && !linkErrorHidden && (
                <div className="rounded-2xl border border-accent-100 bg-accent-100/60 px-4 py-3">
                  <p className="text-sm font-bold text-accent-600">
                    {hintFor(linkError) === t.auth.errGoogle
                      ? t.auth.providerErrorTitle
                      : t.auth.linkErrorTitle}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-accent-600">
                    {hintFor(linkError) ?? t.auth.linkErrorBody}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-gray-500">{linkError}</p>
                </div>
              )}

              <AuthRow
                icon={<GoogleMark />}
                label={busy ? t.auth.sending : t.auth.google}
                onClick={continueWithGoogle}
                disabled={busy}
              />

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-paper-200" />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                  {t.auth.or}
                </span>
                <span className="h-px flex-1 bg-paper-200" />
              </div>

              <AuthRow
                icon={<Mail size={17} />}
                label={t.auth.emailRow}
                caption={t.auth.createDesc}
                onClick={openEmailForm}
              />

              <AuthRow
                icon={<GraduationCap size={17} />}
                label={t.auth.campusRow}
                caption={t.auth.campusNote}
                badge={t.auth.comingSoon}
                disabled
              />

              {error && (
                <div className="rounded-xl bg-accent-100 px-4 py-3">
                  <p className="text-sm font-semibold text-accent-600">{error}</p>
                  {hintFor(error) && (
                    <p className="mt-1 text-xs leading-relaxed text-accent-600">
                      {hintFor(error)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink-900">
                  {t.auth.createTitle}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  {t.auth.createDesc}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-900" htmlFor="name">
                  {t.auth.fullName}{" "}
                  <span className="font-normal text-gray-400">({t.common.optional})</span>
                </label>
                <div className="relative">
                  <User
                    aria-hidden
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="name"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.auth.fullNamePlaceholder}
                    className="field pl-11"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-900" htmlFor="email">
                  {t.auth.email}
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
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

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-900" htmlFor="phone">
                  {t.auth.phone}{" "}
                  <span className="font-normal text-gray-400">({t.common.optional})</span>
                </label>
                <div className="relative">
                  <Phone
                    aria-hidden
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.auth.phonePlaceholder}
                    className="field pl-11"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-accent-100 px-4 py-3">
                  <p className="text-sm font-semibold text-accent-600">{error}</p>
                  {hintFor(error) && (
                    <p className="mt-1 text-xs leading-relaxed text-accent-600">
                      {hintFor(error)}
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={busy || email.trim().length === 0}
                className="w-full rounded-2xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
              >
                {busy ? t.auth.sending : t.auth.sendLink}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("choose");
                }}
                className="flex w-full items-center justify-center gap-2 py-1 text-sm font-semibold text-gray-500 transition hover:text-primary-700"
              >
                <ArrowLeft size={15} /> {t.auth.backToOptions}
              </button>
            </form>
          )}
        </div>

        {isSupabaseConfigured && (
          <p className="border-t border-paper-200 bg-paper-50 px-6 py-4 text-center text-[11px] leading-relaxed text-gray-400">
            {t.auth.agreement}
          </p>
        )}
      </div>

      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-700"
      >
        <ArrowLeft size={16} /> {t.auth.backHome}
      </Link>
    </div>
  );
}
