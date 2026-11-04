import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SplashScreen from "@/components/SplashScreen";
import { FooterSkeleton } from "@/components/Footer";
import FooterData from "@/components/FooterData";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { dictFor } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { shareImageUrl } from "@/lib/seo";

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
    openGraph: {
      siteName: `${t.brand.name} ${t.brand.suffix}`,
      title: t.meta.title,
      description: t.meta.description,
      images: [{ url: shareImageUrl, width: 800, height: 300, alt: t.meta.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.title,
      description: t.meta.description,
      images: [shareImageUrl],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getLang();

  return (
    <html lang={lang}>
      <body
        className={`${body.variable} ${heading.variable} font-sans flex min-h-screen flex-col bg-paper-50 text-ink-900`}
      >
        <LanguageProvider initialLang={lang}>
          <AuthProvider>
            <SplashScreen />
            <Navbar />
            <main className="w-full flex-1">{children}</main>
            <Suspense fallback={<FooterSkeleton />}>
              <FooterData />
            </Suspense>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
