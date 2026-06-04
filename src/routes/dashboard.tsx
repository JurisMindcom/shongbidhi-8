import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { FloatingParticles } from "@/components/FloatingParticles";
import { Plus, Heart, Download, Eye, LogOut, Home, Upload, User as UserIcon, Settings, Users, BookOpen, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

type Post = {
  id: string;
  user_id: string;
  subject: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  created_at: string;
};

function Dashboard() {
  const { user, profile, loading, signOut, isAdmin } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<"home" | "profile" | "uploads" | "settings">("home");
  const [posts, setPosts] = useState<Post[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [stats, setStats] = useState({ students: 0, posts: 0, myPosts: 0 });

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  const loadPosts = async () => {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    setPosts((data as Post[]) ?? []);
  };
  useEffect(() => { loadPosts(); }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ count: s }, { count: p }, { count: m }] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setStats({ students: s ?? 0, posts: p ?? 0, myPosts: m ?? 0 });
    };
    load();
    const ch = supabase
      .channel("dashboard-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  if (!user || !profile) return <div className="grid min-h-screen place-items-center text-foreground/70">Loading…</div>;

  const myPosts = posts.filter((p) => p.user_id === user.id);

  return (
    <div className="relative min-h-screen bg-background pb-24">
      <FloatingParticles count={12} />
      <header className="glass sticky top-0 z-30 flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-xs text-foreground/60">Welcome,</div>
          <div className="text-sm font-bold">{profile.name}</div>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link to="/admin" className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
              <Shield className="inline h-3 w-3" /> Admin
            </Link>
          )}
          <button onClick={() => signOut()} className="rounded-full bg-primary/80 px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            <LogOut className="inline h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {tab === "home" && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <StatCard icon={Users} label="Students" value={stats.students} />
              <StatCard icon={BookOpen} label="Resources" value={stats.posts} />
              <StatCard icon={Upload} label="My Uploads" value={stats.myPosts} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/students" className="glass flex items-center gap-2 rounded-2xl p-4 text-sm font-semibold transition hover:bg-muted/40">
                <Users className="h-4 w-4 text-secondary" /> Browse Students
              </Link>
              <button onClick={() => setShowUpload(true)} className="glass flex items-center gap-2 rounded-2xl p-4 text-sm font-semibold transition hover:bg-muted/40">
                <Upload className="h-4 w-4 text-secondary" /> Share Notes
              </button>
            </div>
            <h1 className="text-2xl font-bold">Books &amp; <span className="text-gradient">Notes</span></h1>
            {posts.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-foreground/70">No uploads yet. Be the first to share!</div>
            ) : posts.map((p) => <PostCard key={p.id} post={p} userId={user.id} onChange={loadPosts} />)}
          </>
        )}
        {tab === "profile" && <ProfileView />}
        {tab === "uploads" && (
          <>
            <h1 className="text-2xl font-bold">My <span className="text-gradient">Uploads</span></h1>
            {myPosts.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-foreground/70">You haven't shared anything yet.</div>
            ) : myPosts.map((p) => <PostCard key={p.id} post={p} userId={user.id} onChange={loadPosts} />)}
          </>
        )}
        {tab === "settings" && <SettingsView />}
      </main>

      <button
        onClick={() => setShowUpload(true)}
        className="fixed bottom-24 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground"
        style={{ boxShadow: "0 0 40px var(--glow)" }}
      >
        <Plus className="h-6 w-6" />
      </button>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onDone={loadPosts} />}

      <nav className="glass fixed bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-full p-1.5">
        {[
          { k: "home", icon: Home },
          { k: "profile", icon: UserIcon },
          { k: "uploads", icon: Upload },
          { k: "settings", icon: Settings },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as typeof tab)}
            className={`grid h-10 w-10 place-items-center rounded-full transition ${
              tab === t.k ? "bg-primary text-primary-foreground" : "text-foreground/60"
            }`}
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}
      </nav>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-3">
      <div className="flex items-center gap-2 text-xs text-foreground/60">
        <Icon className="h-3.5 w-3.5 text-secondary" /> {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function PostCard({ post, userId, onChange }: { post: Post; userId: string; onChange: () => void }) {
  const [counts, setCounts] = useState({ like: 0, view: 0, download: 0 });
  useEffect(() => {
    supabase
      .from("post_interactions")
      .select("kind")
      .eq("post_id", post.id)
      .then(({ data }) => {
        const c = { like: 0, view: 0, download: 0 } as Record<string, number>;
        (data ?? []).forEach((r: { kind: string }) => (c[r.kind] = (c[r.kind] ?? 0) + 1));
        setCounts(c as typeof counts);
      });
    supabase.from("post_interactions").upsert({ post_id: post.id, user_id: userId, kind: "view" }, { onConflict: "post_id,user_id,kind" });
  }, [post.id, userId]);

  const interact = async (kind: "like" | "download") => {
    await supabase.from("post_interactions").upsert({ post_id: post.id, user_id: userId, kind }, { onConflict: "post_id,user_id,kind" });
    setCounts((c) => ({ ...c, [kind]: c[kind] + 1 }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4">
      <div className="text-xs text-secondary">{post.subject}</div>
      <h3 className="mt-1 font-semibold">{post.title}</h3>
      {post.description && <p className="mt-1 text-sm text-foreground/75">{post.description}</p>}
      <div className="mt-3 flex items-center gap-3 text-xs text-foreground/70">
        <button onClick={() => interact("like")} className="flex items-center gap-1 hover:text-secondary">
          <Heart className="h-3.5 w-3.5" /> {counts.like}
        </button>
        <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {counts.view}</span>
        {post.file_url && (
          <a
            href={post.file_url}
            target="_blank"
            rel="noreferrer"
            onClick={() => interact("download")}
            className="ml-auto flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-primary-foreground"
          >
            <Download className="h-3.5 w-3.5" /> {counts.download}
          </a>
        )}
      </div>
    </motion.div>
  );
}

function UploadModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ subject: "", title: "", description: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    let file_url: string | null = null;
    let file_type: string | null = null;
    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("uploads").getPublicUrl(path);
        file_url = data.publicUrl;
        file_type = file.type;
      }
    }
    const { error } = await supabase.from("posts").insert({ ...form, user_id: user.id, file_url, file_type });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Uploaded!");
    onDone();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="glass w-full max-w-md space-y-3 rounded-2xl p-6">
        <h2 className="text-lg font-bold">Share Notes / Books</h2>
        <input required placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none" />
        <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none" />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none" rows={3} />
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-xs" />
        <button disabled={busy} className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground">{busy ? "Uploading…" : "Post"}</button>
      </form>
    </div>
  );
}

function ProfileView() {
  const { profile } = useAuth();
  if (!profile) return null;
  return (
    <div className="glass space-y-2 rounded-2xl p-6">
      <div className="mx-auto h-24 w-24 overflow-hidden rounded-full bg-muted">
        {profile.profile_photo && <img src={profile.profile_photo} alt={profile.name} className="h-full w-full object-cover" />}
      </div>
      <h2 className="text-center text-xl font-bold">{profile.name}</h2>
      <div className="text-center text-xs text-secondary">{profile.department}</div>
      <div className="grid grid-cols-2 gap-2 pt-3 text-xs">
        <Info label="Roll" v={profile.roll} />
        <Info label="Reg." v={profile.registration_number} />
        <Info label="Batch" v={profile.batch} />
        <Info label="Session" v={profile.session} />
        <Info label="District" v={profile.district} />
        <Info label="Blood" v={profile.blood_group} />
      </div>
    </div>
  );
}
function Info({ label, v }: { label: string; v: string | null | undefined }) {
  return <div className="rounded-lg bg-muted/30 p-2"><div className="text-foreground/60">{label}</div><div className="font-semibold">{v ?? "—"}</div></div>;
}

function SettingsView() {
  const { profile, refresh } = useAuth();
  const [nick, setNick] = useState(profile?.nickname ?? "");
  const [session, setSession] = useState(profile?.session ?? "");
  const save = async () => {
    const { error } = await supabase.from("profiles").update({ nickname: nick, session }).eq("id", profile!.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    refresh();
  };
  return (
    <div className="glass space-y-3 rounded-2xl p-6">
      <h2 className="text-lg font-bold">Settings</h2>
      <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Nickname" className="w-full rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none" />
      <input value={session} onChange={(e) => setSession(e.target.value)} placeholder="Session" className="w-full rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none" />
      <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Save</button>
      <p className="text-xs text-foreground/60">Roll number and password can only be changed by admin.</p>
    </div>
  );
}