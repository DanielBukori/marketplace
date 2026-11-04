import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Dict } from "@/lib/translations";

/**
 * Malizo ya msimamizi kwenye njia za API. RLS inazuia tu kusoma, lakini
 * matendo kama kuthibitisha malipo huhitaji seva (service_role), kwa hivyo
 * lazima thibitisha kwanza kwamba aliyeomba ana daraja la usimamizi.
 *
 * `t` hutumika kwa sababu msomaji wa ujumbe huu ni binadamu aliye kwenye
 * kivinjari — lugha yake ndiyo huamua nakala, si Kiswahili pekee.
 */
export async function requireAdminActor(
  t: Dict,
): Promise<{ error: NextResponse } | { ok: true; userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ message: t.api.signInFirst }, { status: 401 }),
    } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_admin: boolean }>();

  if (!profile?.is_admin) {
    return {
      error: NextResponse.json({ message: t.api.adminOnly }, { status: 403 }),
    } as const;
  }

  return { ok: true, userId: user.id } as const;
}
