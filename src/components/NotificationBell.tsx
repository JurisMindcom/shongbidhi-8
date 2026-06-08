import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Link } from "@/lib/navigation";

/**
 * Bell button → navigates to the dedicated /notifications page (Facebook-style).
 * Subscribes to realtime to keep the unread badge in sync everywhere it's rendered.
 */
export function NotificationBell() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = () =>
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)
        .then(({ count }) => { if (active) setUnread(count ?? 0); });
    load();
    const ch = supabase
      .channel("notif-badge-" + user.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [user]);

  if (!user) return null;

  return (
    <Link
      to="/notifications"
      aria-label="Notifications"
      className="relative grid h-9 w-9 place-items-center rounded-full bg-muted/40 hover:bg-muted/60"
    >
      <Bell className="h-4 w-4" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}