import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/lib/navigation";

type User = { id: string; name: string; roll: string; profile_photo: string | null };

export function LikesModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: likes } = await supabase
        .from("post_interactions")
        .select("user_id")
        .eq("post_id", postId)
        .eq("kind", "like");
      const ids = ((likes ?? []) as { user_id: string }[]).map((l) => l.user_id);
      if (ids.length === 0) {
        if (active) { setUsers([]); setLoading(false); }
        return;
      }
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,name,roll,profile_photo")
        .in("id", ids);
      if (active) {
        setUsers((profs as User[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [postId]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass flex max-h-[70vh] w-full max-w-sm flex-col rounded-2xl"
        >
          <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
            <div className="text-sm font-bold">Likes</div>
            <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full bg-muted/40">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="grid place-items-center py-8 text-xs text-foreground/60">Loading…</div>
            ) : users.length === 0 ? (
              <div className="grid place-items-center py-8 text-xs text-foreground/60">No likes yet</div>
            ) : (
              users.map((u) => (
                <Link
                  key={u.id}
                  to={"/u/" + u.roll}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40"
                >
                  <div className="h-9 w-9 overflow-hidden rounded-full bg-muted">
                    {u.profile_photo ? <img src={u.profile_photo} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-xs font-bold text-secondary">{u.name[0]}</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{u.name}</div>
                    <div className="text-[11px] text-foreground/60">Roll {u.roll}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}