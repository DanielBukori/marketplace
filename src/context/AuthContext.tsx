"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/media";
import type { Profile } from "@/lib/types";

type AuthValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  /** Muuzaji = ana angalau biashara moja; hutumika kwenye navigation ya rol. */
  isSeller: boolean;
  isCourier: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasBusiness, setHasBusiness] = useState(false);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      },
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const userId = session?.user.id;
    let active = true;

    // Profile inasomwa baada ya await, si katika mwili wa effect, ili
    // kutosababisha mnyororo wa rendering; `active` huzuia jibu la zamani.
    void (async () => {
      if (!userId) {
        if (active) {
          setProfile(null);
          setHasBusiness(false);
        }
        return;
      }
      const supabase = createClient();

      // Safu za usabishi huja kwenye migration mpya. Zikikosora, swali la
      // pili linaacha nje ili beti la kichwa liendelee kuonyesha mtu.
      let attempt = await supabase
        .from("profiles")
        .select("id, full_name, phone, hall, avatar_path, is_admin, courier_status")
        .eq("id", userId)
        .maybeSingle();
      if (attempt.error) {
        attempt = await supabase
          .from("profiles")
          .select("id, full_name, phone, hall, avatar_path, is_admin")
          .eq("id", userId)
          .maybeSingle();
      }
      if (active) setProfile((attempt.data as Profile) ?? null);

      // Kuna biashara? Hii ndiyo rol ya muuzaji kwenye navigation.
      const { data: owned } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", userId)
        .limit(1);
      if (active) setHasBusiness((owned?.length ?? 0) > 0);
    })();

    return () => {
      active = false;
    };
  }, [session]);

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      isSeller: hasBusiness,
      isCourier: profile?.courier_status === "approved",
      isLoading,
      signOut: async () => {
        if (!isSupabaseConfigured) return;
        await createClient().auth.signOut();
      },
    }),
    [session, profile, hasBusiness, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
