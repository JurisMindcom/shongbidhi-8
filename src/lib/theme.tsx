import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ThemeName = "royal" | "purple" | "green";

type Ctx = {
  theme: ThemeName;
  setTheme: (t: ThemeName) => Promise<void>;
};

const ThemeContext = createContext<Ctx>({ theme: "royal", setTheme: async () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("royal");

  useEffect(() => {
    let mounted = true;
    supabase.from("site_settings").select("theme").eq("id", 1).maybeSingle().then(({ data }) => {
      if (mounted && data?.theme) applyTheme(data.theme as ThemeName, setThemeState);
    });
    const channel = supabase
      .channel("site_settings_changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "site_settings" }, (payload) => {
        const t = (payload.new as { theme?: ThemeName })?.theme;
        if (t) applyTheme(t, setThemeState);
      })
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const setTheme = async (t: ThemeName) => {
    applyTheme(t, setThemeState);
    await supabase.from("site_settings").update({ theme: t, updated_at: new Date().toISOString() }).eq("id", 1);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

function applyTheme(t: ThemeName, set: (t: ThemeName) => void) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", t);
  }
  set(t);
}

export const useTheme = () => useContext(ThemeContext);