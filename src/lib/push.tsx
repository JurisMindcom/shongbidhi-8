import { useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo.png";

/**
 * Global push / badge bridge.
 * - Requests browser Notification permission once per device (after login).
 * - Subscribes to the current user's notifications and fires native Notifications
 *   when the tab is in the background (Android Chrome, desktop browsers).
 * - Keeps the app icon badge in sync via the Badging API
 *   (navigator.setAppBadge / clearAppBadge) — used by installed PWAs on
 *   Android/Chrome OS/desktop to render a red unread count.
 */
export function PushProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Ask for permission once after login (best-effort, never throws).
  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const flag = "ll-notif-asked";
    if (localStorage.getItem(flag)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().finally(() => {
        try { localStorage.setItem(flag, "1"); } catch {}
      });
    } else {
      try { localStorage.setItem(flag, "1"); } catch {}
    }
  }, [user]);

  // Subscribe to realtime notifications + maintain app badge.
  useEffect(() => {
    if (!user) {
      try { (navigator as any).clearAppBadge?.(); } catch {}
      return;
    }
    let active = true;

    const setBadge = (n: number) => {
      try {
        const nav: any = navigator;
        if (n > 0) nav.setAppBadge?.(n);
        else nav.clearAppBadge?.();
      } catch {}
    };

    const refreshBadge = () =>
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)
        .then(({ count }) => { if (active) setBadge(count ?? 0); });

    refreshBadge();

    const ch = supabase
      .channel("push-" + user.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const n = payload.new as { title: string; body: string | null };
            if (
              "Notification" in window &&
              Notification.permission === "granted" &&
              document.visibilityState !== "visible"
            ) {
              try {
                new Notification(n.title, { body: n.body ?? undefined, icon: logo, badge: logo, tag: "ll-notif" });
              } catch {}
            }
          }
          refreshBadge();
        },
      )
      .subscribe();

    return () => { active = false; supabase.removeChannel(ch); };
  }, [user]);

  return <>{children}</>;
}