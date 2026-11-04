import Footer from "@/components/Footer";
import { getSettings, getSocialLinks } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/media";

/**
 * Footer hutenganishwa na layout ili kusoma hifadhidata kwenye mpaka wake
 * mwenye Suspense: bila hivyo kila ukurasa ungesubiri ombi hili mbili kabla
 * ya header wala maudhui hayajapakiwa.
 */
export default async function FooterData() {
  const [links, support] = isSupabaseConfigured
    ? await Promise.all([getSocialLinks(), getSettings()])
    : [[], {}];

  return <Footer links={links} support={support} />;
}
