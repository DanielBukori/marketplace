import { getLiveAds } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/media";
import HomeHero from "@/components/HomeHero";

export default async function HomePage() {
  const ads = isSupabaseConfigured ? await getLiveAds("home") : [];
  return <HomeHero ads={ads} />;
}
