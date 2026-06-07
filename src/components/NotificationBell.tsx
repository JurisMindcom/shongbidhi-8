import { useEffect, useState } from "react";
import { Bell, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/lib/navigation";

type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (active) setItems((data as Notif[]) ?? []);
      });
    const ch = supabase
      .channel("notif-" + user.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setItems((prev) => {
            if (payload.eventType === "INSERT") {
              return [payload.new as Notif, ...prev].slice(0, 50);
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((n) => n.id !== (payload.old as Notif).id);
            }
            return prev.map((n) => (n.id === (payload.new as Notif).id ? (payload.new as Notif) : n));
          });
        },
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [user]);

  if (!user) return null;

  const markAllRead = async () => {
    if (unread === 0) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  return (
    <>
      <button
        aria-label="Notifications"
        onClick={() => setOpen(true)}
        className="relative grid h-9 w-9 place-items-center rounded-full bg-muted/40 hover:bg-muted/60"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              className="glass fixed right-2 top-2 z-50 flex max-h-[80vh] w-[min(380px,calc(100vw-1rem))] flex-col rounded-2xl"
            >
              <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
                <div className="text-sm font-bold">Notifications</div>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={markAllRead} className="flex items-center gap-1 rounded-md bg-muted/40 px-2 py-1 text-[11px] hover:bg-muted/60">
                      <Check className="h-3 w-3" /> Read all
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="grid h-7 w-7 place-items-center rounded-full bg-muted/40 hover:bg-muted/60">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="grid place-items-center px-4 py-12 text-center text-xs text-foreground/60">
                    You're all caught up.
                  </div>
                ) : (
                  items.map((n) => {
                    const Inner = (
                      <div className={"border-b border-border/20 px-4 py-3 text-xs hover:bg-muted/30 " + (n.read ? "" : "bg-primary/5")}>
                        <div className="flex items-center gap-2">
                          {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                          <span className="font-semibold">{n.title}</span>
                        </div>
                        {n.body && <p className="mt-0.5 text-foreground/70">{n.body}</p>}
                        <div className="mt-1 text-[10px] text-foreground/50">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    );
                    return n.link ? (
                      <Link key={n.id} to={n.link} onClick={() => setOpen(false)}>{Inner}</Link>
                    ) : (
                      <div key={n.id}>{Inner}</div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}