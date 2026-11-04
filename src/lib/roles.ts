import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { CourierStatus } from "@/lib/types";

/**
 * Majibu ya mtumiaji katika jukwaa.
 *
 * Kanuni: kila mtu aliyeingia ni MNUNUZI — kwa hivyo "mnunuzi" si rol
 * inayowezekana, ni hali ya msingi. Rol za nyongeza hutokana na data:
 *   muuzaji  — ana angalau biashara moja
 *   msabishi — profaili yake iko katika hali ya "approved"
 *   msimamizi — profaili yake `is_admin`
 *
 * Safu za usabishi huja kwenye migration mpya. Ili msimamizi aendelee
 * kupata kurasa zake akiwa bado amejaza DDL, swali la pamoja linarudi
 * nyuma kwa swali la `is_admin` pekee badala ya kurudisha majibu tupu.
 */
export type Roles = {
  isAdmin: boolean;
  isSeller: boolean;
  isCourier: boolean;
  courierStatus: CourierStatus;
};

export const getRoles = cache(async function getRoles(userId: string): Promise<Roles> {
  const supabase = await createClient();

  const [profile, businesses] = await Promise.all([
    supabase
      .from("profiles")
      .select("is_admin, courier_status")
      .eq("id", userId)
      .maybeSingle<{ is_admin: boolean; courier_status: CourierStatus }>(),
    supabase.from("businesses").select("id").eq("owner_id", userId).limit(1),
  ]);

  let isAdmin = false;
  let courierStatus: CourierStatus = "none";

  if (profile.error) {
    const { data: base } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle<{ is_admin: boolean }>();
    isAdmin = base?.is_admin ?? false;
  } else {
    isAdmin = profile.data?.is_admin ?? false;
    courierStatus = profile.data?.courier_status ?? "none";
  }

  return {
    isAdmin,
    isSeller: (businesses.data?.length ?? 0) > 0,
    isCourier: courierStatus === "approved",
    courierStatus,
  };
});
