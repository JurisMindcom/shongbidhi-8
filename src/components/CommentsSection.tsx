import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/lib/navigation";

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
};
type Author = { id: string; name: string; roll: string; profile_photo: string | null };

export function CommentsSection({ postId, postOwnerId }: { postId: string; postOwnerId: string }) {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<Comment[]>([]);
  const [authors, setAuthors] = useState<Record<string, Author>>({});
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at")
      .then(({ data }) => {
        if (!active) return;
        const list = (data as Comment[]) ?? [];
        setItems(list);
        const ids = Array.from(new Set(list.map((c) => c.user_id)));
        if (ids.length) {
          supabase
            .from("profiles")
            .select("id,name,roll,profile_photo")
            .in("id", ids)
            .then(({ data: profs }) => {
              if (!active) return;
              const m: Record<string, Author> = {};
              (profs ?? []).forEach((p) => (m[(p as Author).id] = p as Author));
              setAuthors(m);
            });
        }
      });

    const ch = supabase
      .channel("comments-" + postId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` },
        (payload) => {
          setItems((prev) => {
            if (payload.eventType === "INSERT") return [...prev, payload.new as Comment];
            if (payload.eventType === "DELETE") return prev.filter((c) => c.id !== (payload.old as Comment).id);
            return prev.map((c) => (c.id === (payload.new as Comment).id ? (payload.new as Comment) : c));
          });
          if (payload.eventType === "INSERT") {
            const c = payload.new as Comment;
            if (!authors[c.user_id]) {
              supabase.from("profiles").select("id,name,roll,profile_photo").eq("id", c.user_id).maybeSingle()
                .then(({ data: p }) => p && setAuthors((m) => ({ ...m, [(p as Author).id]: p as Author })));
            }
          }
        },
      )
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [postId]);

  const submit = async () => {
    if (!user || !text.trim()) return;
    setBusy(true);
    const body = text.trim();
    setText("");
    const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: user.id, body });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    // Notify post owner (best-effort)
    if (postOwnerId !== user.id) {
      await supabase.from("notifications").insert({
        user_id: postOwnerId,
        actor_id: user.id,
        kind: "comment",
        title: (profile?.name ?? "Someone") + " commented on your post",
        body: body.slice(0, 120),
        link: "/dashboard",
      });
    }
  };

  return (
    <div className="border-t border-border/30 px-4 py-3">
      <div className="space-y-2">
        {items.map((c) => {
          const a = authors[c.user_id];
          return (
            <div key={c.id} className="flex items-start gap-2">
              <Link to={a ? "/u/" + a.roll : "/dashboard"} className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-muted">
                {a?.profile_photo ? <img src={a.profile_photo} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-[10px] font-bold text-secondary">{a?.name?.[0] ?? "?"}</div>}
              </Link>
              <div className="flex-1 rounded-2xl bg-muted/40 px-3 py-1.5">
                <div className="text-[11px] font-semibold">{a?.name ?? "Student"}</div>
                <div className="text-xs text-foreground/90 whitespace-pre-wrap">{c.body}</div>
              </div>
            </div>
          );
        })}
      </div>
      {user && (
        <div className="mt-2 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Write a comment…"
            className="flex-1 rounded-full bg-muted/40 px-3 py-1.5 text-xs outline-none"
          />
          <button
            onClick={submit}
            disabled={busy || !text.trim()}
            aria-label="Send"
            className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}