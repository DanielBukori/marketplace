"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  House,
  Store,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

/**
 * Menyu ya chini kama ya programu ya simu. Inaonekana kwenye skrini ndogo
 * pekee; kompyuta inaendelea kutumia menyu ya juu.
 */
export default function MobileTabBar() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname();

  const tabs = [
    {
      href: "/",
      label: t.nav.home,
      icon: House,
      active: pathname === "/",
    },
    {
      href: "/msosi",
      label: t.nav.foodShort,
      icon: UtensilsCrossed,
      active: pathname === "/msosi" || pathname.startsWith("/msosi/") || pathname.startsWith("/duka/"),
    },
    {
      href: "/market",
      label: t.nav.marketplace,
      icon: Store,
      active:
        pathname === "/market" ||
        pathname.startsWith("/market/") ||
        pathname.startsWith("/product/") ||
        pathname.startsWith("/vyumba") ||
        pathname.startsWith("/services"),
    },
    {
      href: "/orders",
      label: t.nav.ordersShort,
      icon: ClipboardList,
      active: pathname === "/orders" || pathname.startsWith("/orders/"),
    },
    {
      href: user ? "/dashboard" : "/login",
      label: user ? t.nav.account : t.nav.signIn,
      icon: UserRound,
      active:
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/profile") ||
        pathname === "/login",
    },
  ];

  return (
    <nav
      aria-label={t.nav.tabBar}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-18px_rgba(10,47,80,0.35)] backdrop-blur-lg lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={tab.active ? "page" : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 transition active:scale-95 ${
                  tab.active ? "text-primary-700" : "text-gray-500"
                }`}
              >
                {tab.active && (
                  <span
                    aria-hidden
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-primary-700"
                  />
                )}
                <Icon size={22} strokeWidth={tab.active ? 2.4 : 1.8} />
                <span className="text-[10px] font-bold tracking-wide">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
