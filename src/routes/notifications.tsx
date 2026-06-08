import { createFileRoute, Link, useNavigate } from "@/lib/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Bell, Check } from "lucide-react";

type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);

  useEffect(() => {
    if (!loading && !user) nav("/login");
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => { if (active) setItems((data as Notif[]) ?? []); });
    const ch = supabase
      .channel("notif-page-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems((prev) => {
          if (payload.eventType === "INSERT") return [payload.new as Notif, ...prev];
          if (payload.eventType === "DELETE") return prev.filter((n) => n.id !== (payload.old as Notif).id);
          return prev.map((n) => (n.id === (payload.new as Notif).id ? (payload.new as Notif) : n));
        });
      })
      .subscribe();
    // Mark all as read on visit
    supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false).then(() => {});
    return () => { active = false; supabase.removeChannel(ch); };
  }, [user]);

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="relative min-h-screen bg-background pb-24">
      <DashboardHeader title="Notifications" />
      <main className="mx-auto max-w-2xl space-y-3 px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/80 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          {unread > 0 && (
            <button
              onClick={() => user && supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false)}
              className="flex items-center gap-1 rounded-md bg-muted/40 px-2 py-1 text-[11px] hover:bg-muted/60"
            >
              <Check className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="glass flex flex-col items-center gap-3 rounded-2xl p-10 text-center">
            <Bell className="h-8 w-8 text-foreground/40" />
            <div className="text-sm font-semibold">You're all caught up</div>
            <div className="text-xs text-foreground/60">Likes, comments and new accounts will show up here.</div>
          </div>
        ) : (
          <ul className="glass overflow-hidden rounded-2xl">
            {items.map((n) => {
              const Body = (
                <div className={"flex items-start gap-3 border-b border-border/30 px-4 py-3 text-sm last:border-b-0 " + (n.read ? "" : "bg-primary/5")}>
                  <div className={"mt-1 h-2 w-2 shrink-0 rounded-full " + (n.read ? "bg-transparent" : "bg-primary")} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{n.title}</div>
                    {n.body && <p className="mt-0.5 text-xs text-foreground/70">{n.body}</p>}
                    <div className="mt-1 text-[10px] text-foreground/50">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.link ? <Link to={n.link} className="block hover:bg-muted/30">{Body}</Link> : Body}
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}