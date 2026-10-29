"use client";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Plus, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import LangToggle from "@/components/LangToggle";

export default function Navbar() {
  const { t } = useLanguage();
  const { user, profile, signOut } = useAuth();

  const links = [
    { href: "/market", label: t.nav.marketplace },
    { href: "/msosi", label: t.nav.food },
    { href: "/services", label: t.nav.services },
    { href: "/news", label: t.nav.news },
  ];

  const initials = (profile?.full_name || user?.email || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-paper-50/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/iaa/iaa-crest.png"
            width={90}
            height={87}
            alt={t.brand.name}
            className="h-10 w-auto"
          />
          <span className="text-xl font-extrabold tracking-tight text-ink-900">
            {t.brand.name} <span className="text-primary-600">{t.brand.suffix}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[15px] font-medium text-gray-600 transition hover:text-primary-700"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/post"
            className="hidden items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-2.5 text-sm font-bold text-primary-800 transition hover:bg-primary-50 sm:inline-flex"
          >
            <Plus size={16} /> {t.nav.post}
          </Link>

          <LangToggle />

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-900"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[11px] font-extrabold">
                  {initials}
                </span>
                <span className="hidden sm:inline">{t.nav.account}</span>
              </Link>
              <button
                type="button"
                onClick={signOut}
                aria-label={t.nav.signOut}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-white text-gray-500 shadow-sm transition hover:text-accent-500"
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              aria-label={t.nav.signIn}
              className="flex items-center gap-2 rounded-full bg-primary-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-900"
            >
              <User size={16} />
              <span className="hidden sm:inline">{t.nav.signIn}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
