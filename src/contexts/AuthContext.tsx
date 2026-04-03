import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/portal";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    company: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const stored = localStorage.getItem("valck_studio_profile");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data && !error) {
      const p = data as Profile;
      setProfile(p);
      localStorage.setItem("valck_studio_profile", JSON.stringify(p));
      return p;
    } else {
      setProfile(null);
      localStorage.removeItem("valck_studio_profile");
      return null;
    }
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const {
          data: { session: s },
        } = await supabase.auth.getSession();

        if (!mounted) return;
        setSession(s);

        if (s?.user) {
          await fetchProfile(s.user.id);
        } else {
          setProfile(null);
          localStorage.removeItem("valck_studio_profile");
        }
      } catch {
        if (mounted) {
          setProfile(null);
          localStorage.removeItem("valck_studio_profile");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);

      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
        localStorage.removeItem("valck_studio_profile");
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error?.message ?? null };
    },
    []
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      company: string
    ) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, company } },
      });
      return { error: error?.message ?? null };
    },
    []
  );

  const signOut = useCallback(async () => {
    setProfile(null);
    localStorage.removeItem("valck_studio_profile");
    localStorage.removeItem("valck_studio_active_client");
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback((updates: Partial<Profile>) => {
    setProfile((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem("valck_studio_profile", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const user = session?.user ?? null;

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }),
    [session, user, profile, loading, signIn, signUp, signOut, updateProfile]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuth moet binnen AuthProvider gebruikt worden");
  return ctx;
}
