"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Plus,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import LangToggle from "@/components/LangToggle";

export default function Navbar() {
  const { t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/market", label: t.nav.marketplace },
    { href: "/msosi", label: t.nav.food },
    { href: "/services", label: t.nav.services },
    { href: "/vyumba", label: t.nav.rooms },
    { href: "/news", label: t.nav.news },
  ];

  const accountLinks = [
    { href: "/dashboard", label: t.nav.account, icon: LayoutDashboard },
    { href: "/dashboard/ads", label: t.nav.myAds, icon: Megaphone },
    { href: "/orders", label: t.nav.myOrders, icon: User },
    ...(profile?.is_admin
      ? [{ href: "/dashboard/admin", label: t.nav.admin, icon: ShieldCheck }]
      : []),
  ];

  const initials = (profile?.full_name || user?.email || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-paper-50/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:gap-6 sm:px-6 lg:px-8">
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

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/post"
            className="hidden items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-2.5 text-sm font-bold text-primary-800 transition hover:bg-primary-50 sm:inline-flex"
          >
            <Plus size={16} /> {t.nav.post}
          </Link>

          <LangToggle />

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-900"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[11px] font-extrabold">
                  {initials}
                </span>
                <span className="hidden md:inline">{t.nav.account}</span>
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
              className="hidden items-center gap-2 rounded-full bg-primary-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-900 sm:inline-flex"
            >
              <User size={16} />
              <span className="hidden md:inline">{t.nav.signIn}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-white text-ink-900 shadow-sm transition hover:bg-primary-50 sm:hidden"
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-black/5 bg-white px-4 pb-5 pt-3 sm:hidden">
          <nav className="grid gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-[15px] font-semibold text-gray-700 transition hover:bg-primary-50 hover:text-primary-800"
              >
                {l.label}
              </Link>
            ))}

            <Link
              href="/post"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-2xl bg-accent-500 px-4 py-3 text-[15px] font-extrabold text-white transition hover:bg-accent-400"
            >
              <Plus size={17} /> {t.nav.post}
            </Link>

            {user ? (
              <>
                <p className="mt-3 px-4 text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                  {t.nav.account}
                </p>
                {accountLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold text-gray-700 transition hover:bg-primary-50 hover:text-primary-800"
                    >
                      <Icon size={17} /> {item.label}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                  className="mt-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-semibold text-accent-600 transition hover:bg-accent-100"
                >
                  <LogOut size={17} /> {t.nav.signOut}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-3 flex items-center gap-2 rounded-2xl bg-primary-800 px-4 py-3 text-[15px] font-bold text-white transition hover:bg-primary-900"
              >
                <User size={17} /> {t.nav.signIn}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
