import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/media";

/**
 * Ukurasa unaoihitaji mtumiaji ailipe kodi: anza ukague `isSupabaseConfigured`,
 * kwa sababu client ya seva huhitaji fungo la mradi ili kiundwe.
 */
export async function requireUser(nextPath: string) {
  if (!isSupabaseConfigured) redirect("/login");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}
