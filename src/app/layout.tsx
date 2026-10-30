import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { getSettings, getSocialLinks } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/media";

/**
 * next/font hupakia fonti kwenye seva wakati wa kujenga, kwa hivyo tovuti
 * haitegemei Google Fonts kwa muda wa kutumia. `variable` tu ndiyo inayopita
 * kwenye CSS; `@theme inline` katika globals.css inaziunganisha na
 * `font-sans` / `font-display`.
 */
const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

const heading = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = dictFor(await getLang());

  return {
    title: t.meta.title,
    description: t.meta.description,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getLang();
  const [socialLinks, support] = isSupabaseConfigured
    ? await Promise.all([getSocialLinks(), getSettings()])
    : [[], {}];

  return (
    <html lang={lang}>
      <body
        className={`${body.variable} ${heading.variable} font-sans flex min-h-screen flex-col bg-paper-50 text-ink-900`}
      >
        <LanguageProvider initialLang={lang}>
          <AuthProvider>
            <Navbar />
            <main className="w-full flex-1">{children}</main>
            <Footer links={socialLinks} support={support} />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
