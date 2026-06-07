import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  name: string;
  nickname: string | null;
  roll: string;
  registration_number: string | null;
  session: string | null;
  batch: string | null;
  department: string;
  blood_group: string | null;
  district: string | null;
  gender: string | null;
  phone: string | null;
  facebook_link: string | null;
  profile_photo: string | null;
  status: string;
};

export type Role = "admin" | "cr" | "student";

export type LoginMode = "admin" | "cr" | "student";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: Role[];
  isAdmin: boolean;
  isCR: boolean;
  canManage: boolean;
  loginMode: LoginMode;
  setLoginMode: (m: LoginMode) => void;
  loading: boolean;
  signInWithRoll: (
    roll: string,
    password: string,
    mode: LoginMode,
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>(null!);

export const rollToEmail = (roll: string) => `${roll.trim()}@law.iu.local`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginMode, setLoginModeState] = useState<LoginMode>(() => {
    if (typeof window === "undefined") return "student";
    return (localStorage.getItem("ll-login-mode") as LoginMode) || "student";
  });
  const setLoginMode = (m: LoginMode) => {
    setLoginModeState(m);
    try { localStorage.setItem("ll-login-mode", m); } catch {}
  };

  const loadProfile = async (uid: string) => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile((p as Profile) ?? null);
    setRoles(((r ?? []) as { role: Role }[]).map((x) => x.role));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadProfile(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    // Honor "Remember me": if user opted out, sign out when the tab closes
    const onUnload = () => {
      try {
        if (localStorage.getItem("ll-remember") === "0") {
          supabase.auth.signOut();
        }
      } catch {}
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  const signInWithRoll = async (
    roll: string,
    password: string,
    mode: LoginMode,
  ) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: rollToEmail(roll),
      password,
    });
    if (error || !data.user) return { error: error?.message ?? "Login failed" };
    // Validate that the user's actual roles permit the chosen login mode.
    const { data: r } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const userRoles = ((r ?? []) as { role: Role }[]).map((x) => x.role);
    const hasAdmin = userRoles.includes("admin");
    const hasCR = userRoles.includes("cr");
    const allowed =
      mode === "student"
        ? true
        : mode === "cr"
          ? hasCR || hasAdmin
          : hasAdmin;
    if (!allowed) {
      await supabase.auth.signOut();
      const label = mode === "admin" ? "Admin" : "CR";
      return { error: `Your account is not authorized for ${label} login.` };
    }
    setLoginMode(mode);
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refresh = async () => {
    if (user) await loadProfile(user.id);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        profile,
        roles,
        // Effective permissions = min(actual role, chosen login mode)
        isAdmin: roles.includes("admin") && loginMode === "admin",
        isCR:
          (loginMode === "admin" && roles.includes("admin")) ||
          (loginMode === "cr" && (roles.includes("cr") || roles.includes("admin"))),
        canManage:
          (loginMode === "admin" && roles.includes("admin")) ||
          (loginMode === "cr" && (roles.includes("cr") || roles.includes("admin"))),
        loginMode,
        setLoginMode,
        loading,
        signInWithRoll,
        signOut,
        refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);