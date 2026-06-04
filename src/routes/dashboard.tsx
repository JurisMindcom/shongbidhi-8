import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { FloatingParticles } from "@/components/FloatingParticles";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { displayRole } from "@/components/StudentCard";
import { Heart, Download, Eye, Image as ImageIcon, FileText, X, Send, Crown, Paperclip, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard" }] }),
  component: Dashboard,
});

type Post = {
  id: string;
  user_id: string;
  subject: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  media_urls: { url: string; type: string; name: string }[] | null;
  created_at: string;
};

type Author = { id: string; name: string; profile_photo: string | null; roll: string };

function Dashboard() {
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Record<string, Author>>({});

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  const loadPosts = async () => {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(100);
    const list = (data as Post[]) ?? [];
    setPosts(list);
    const ids = Array.from(new Set(list.map((p) => p.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,name,profile_photo,roll").in("id", ids);
      const map: Record<string, Author> = {};
      (profs ?? []).forEach((p) => (map[(p as Author).id] = p as Author));
      setAuthors(map);
    }
  };

  useEffect(() => {
    loadPosts();
    const ch = supabase
      .channel("posts-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => loadPosts())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (!user || !profile) return <div className="grid min-h-screen place-items-center text-foreground/70">Loading…</div>;

  const role = displayRole(profile);
  const isFounder = role === "Founder";

  return (
    <div className="relative min-h-screen bg-background pb-20">
      <FloatingParticles count={8} />
      <HamburgerMenu />

      {/* Profile header */}
      <section className="mx-auto max-w-2xl px-4 pt-16">
        <Link to="/profile" className="glass flex items-center gap-3 rounded-2xl p-4 transition hover:bg-muted/30">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-primary/40">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt={profile.name} className="h-full w-full object-cover" loading="eager" />
            ) : (
              <div className="grid h-full w-full place-items-center text-2xl font-bold text-secondary">{profile.name[0]}</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="truncate text-base font-bold">{profile.name}</div>
              <span className={"inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold " + (isFounder ? "bg-amber-400/90 text-amber-950" : "bg-secondary/80 text-secondary-foreground")}>
                {isFounder && <Crown className="h-3 w-3" />} {role}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-xs text-foreground/70">
              <span>Roll: <b className="text-foreground">{profile.roll}</b></span>
              {profile.blood_group && <span>Blood: <b className="text-foreground">{profile.blood_group}</b></span>}
            </div>
          </div>
        </Link>
      </section>

      {/* Composer */}
      <section className="mx-auto mt-4 max-w-2xl px-4">
        <PostComposer onPosted={loadPosts} />
      </section>

      {/* Feed */}
      <section className="mx-auto mt-4 max-w-2xl space-y-3 px-4">
        {posts.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-foreground/60">No posts yet. Share the first one!</div>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} userId={user.id} author={authors[p.user_id]} onChange={loadPosts} />)
        )}
      </section>
    </div>
  );
}

function PostComposer({ onPosted }: { onPosted: () => void }) {
  const { user, profile } = useAuth();
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).filter((f) => f.size <= 20 * 1024 * 1024);
    setFiles((prev) => [...prev, ...arr].slice(0, 10));
    setOpen(true);
  };

  const submit = async () => {
    if (!user) return;
    if (!text.trim() && files.length === 0) return toast.error("Add text or a file");
    setBusy(true);
    const media: { url: string; type: string; name: string }[] = [];
    for (const f of files) {
      const path = `${user.id}/${Date.now()}-${f.name}`;
      const { error } = await supabase.storage.from("uploads").upload(path, f);
      if (error) { toast.error(error.message); continue; }
      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      media.push({ url: data.publicUrl, type: f.type || "application/octet-stream", name: f.name });
    }
    const first = media[0];
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      subject: subject.trim() || "General",
      title: (text.trim() || files[0]?.name || "Shared post").slice(0, 140),
      description: text.trim() || null,
      file_url: first?.url ?? null,
      file_type: first?.type ?? null,
      media_urls: media as never,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setText(""); setSubject(""); setFiles([]); setOpen(false);
    toast.success("Posted");
    onPosted();
  };

  if (!profile) return null;

  return (
    <div className="glass rounded-2xl p-3">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
          {profile.profile_photo ? <img src={profile.profile_photo} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-sm font-bold text-secondary">{profile.name[0]}</div>}
        </div>
        <button onClick={() => setOpen(true)} className="flex-1 rounded-full bg-muted/40 px-4 py-2 text-left text-sm text-foreground/60">
          Share a note, file, or photo…
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional)"
            className="w-full rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What do you want to share?"
            rows={3}
            className="w-full resize-none rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none"
          />
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-muted/40">
                  {f.type.startsWith("image/") ? (
                    <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
                      <FileText className="h-6 w-6 text-secondary" />
                      <div className="line-clamp-2 text-[10px] text-foreground/70">{f.name}</div>
                    </div>
                  )}
                  <button
                    onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input ref={ref} hidden type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.zip,.ppt,.pptx,.xls,.xlsx" onChange={(e) => addFiles(e.target.files)} />
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1">
              <button onClick={() => ref.current?.click()} className="flex items-center gap-1 rounded-lg bg-muted/40 px-3 py-2 text-xs font-semibold hover:bg-muted/60">
                <ImageIcon className="h-3.5 w-3.5 text-emerald-400" /> Photo
              </button>
              <button onClick={() => ref.current?.click()} className="flex items-center gap-1 rounded-lg bg-muted/40 px-3 py-2 text-xs font-semibold hover:bg-muted/60">
                <Paperclip className="h-3.5 w-3.5 text-secondary" /> File
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setOpen(false); setFiles([]); setText(""); setSubject(""); }} className="rounded-lg px-3 py-2 text-xs text-foreground/60">Cancel</button>
              <button disabled={busy} onClick={submit} className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">
                <Send className="h-3.5 w-3.5" /> {busy ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PostCard({ post, userId, author, onChange }: { post: Post; userId: string; author?: Author; onChange: () => void }) {
  const [counts, setCounts] = useState({ like: 0, view: 0, download: 0 });
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    supabase
      .from("post_interactions")
      .select("kind,user_id")
      .eq("post_id", post.id)
      .then(({ data }) => {
        const c = { like: 0, view: 0, download: 0 } as Record<string, number>;
        (data ?? []).forEach((r: { kind: string; user_id: string }) => {
          c[r.kind] = (c[r.kind] ?? 0) + 1;
          if (r.user_id === userId && r.kind === "like") setLiked(true);
        });
        setCounts(c as typeof counts);
      });
    supabase.from("post_interactions").upsert({ post_id: post.id, user_id: userId, kind: "view" }, { onConflict: "post_id,user_id,kind" });
  }, [post.id, userId]);

  const toggleLike = async () => {
    if (liked) {
      await supabase.from("post_interactions").delete().eq("post_id", post.id).eq("user_id", userId).eq("kind", "like");
      setLiked(false); setCounts((c) => ({ ...c, like: Math.max(0, c.like - 1) }));
    } else {
      await supabase.from("post_interactions").upsert({ post_id: post.id, user_id: userId, kind: "like" }, { onConflict: "post_id,user_id,kind" });
      setLiked(true); setCounts((c) => ({ ...c, like: c.like + 1 }));
    }
  };

  const remove = async () => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    onChange();
  };

  const media = (post.media_urls && post.media_urls.length > 0)
    ? post.media_urls
    : (post.file_url ? [{ url: post.file_url, type: post.file_type ?? "", name: post.title }] : []);
  const images = media.filter((m) => m.type.startsWith("image/"));
  const files = media.filter((m) => !m.type.startsWith("image/"));
  const authorRole = author ? displayRole(author) : "Student";
  const isFounder = authorRole === "Founder";

  return (
    <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass overflow-hidden rounded-2xl">
      <header className="flex items-center gap-3 px-4 pt-4">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
          {author?.profile_photo ? <img src={author.profile_photo} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-sm font-bold text-secondary">{author?.name?.[0] ?? "?"}</div>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-semibold">{author?.name ?? "Student"}</div>
            {isFounder && <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[9px] font-bold text-amber-950"><Crown className="h-2.5 w-2.5" /> Founder</span>}
          </div>
          <div className="text-[11px] text-foreground/60">{new Date(post.created_at).toLocaleString()} · {post.subject}</div>
        </div>
        {post.user_id === userId && (
          <button onClick={remove} className="grid h-8 w-8 place-items-center rounded-full text-foreground/50 hover:bg-muted/40 hover:text-red-400" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
        )}
      </header>

      {post.description && <p className="px-4 pt-3 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{post.description}</p>}

      {images.length > 0 && (
        <div className={"mt-3 grid gap-1 " + (images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
          {images.slice(0, 6).map((m, i) => (
            <a key={i} href={m.url} target="_blank" rel="noreferrer" className="block bg-muted">
              <img src={m.url} alt="" className="h-full max-h-[480px] w-full object-cover" loading="lazy" />
            </a>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2 px-4 pt-3">
          {files.map((m, i) => {
            const isPdf = m.type === "application/pdf" || m.name.toLowerCase().endsWith(".pdf");
            return (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                <div className={"grid h-10 w-10 shrink-0 place-items-center rounded-lg " + (isPdf ? "bg-red-500/20 text-red-300" : "bg-secondary/20 text-secondary")}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{m.name}</div>
                  <div className="text-[11px] text-foreground/60 uppercase">{isPdf ? "PDF" : (m.type.split("/").pop() || "File")}</div>
                </div>
                <a href={m.url} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-lg bg-muted/60 hover:bg-muted" aria-label="Open"><ExternalLink className="h-4 w-4" /></a>
                <a href={m.url} download className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground" aria-label="Download"><Download className="h-4 w-4" /></a>
              </div>
            );
          })}
        </div>
      )}

      <footer className="mt-3 flex items-center gap-4 border-t border-border/40 px-4 py-2 text-xs text-foreground/70">
        <button onClick={toggleLike} className={"flex items-center gap-1.5 transition " + (liked ? "text-red-400" : "hover:text-red-400")}>
          <Heart className={"h-4 w-4 " + (liked ? "fill-current" : "")} /> {counts.like}
        </button>
        <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {counts.view}</span>
        {files.length > 0 && <span className="ml-auto flex items-center gap-1.5"><Download className="h-4 w-4" /> {counts.download}</span>}
      </footer>
    </motion.article>
  );
}