import { createFileRoute, useNavigate, useParam, Link } from "@/lib/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { DashboardHeader } from "@/components/DashboardHeader";
import { displayRole } from "@/components/StudentCard";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Crown, Shield, UserCog, Facebook } from "lucide-react";

export const Route = createFileRoute("/u/:roll")({ component: PublicProfilePage });

type Post = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subject: string;
  media_urls: { url: string; type: string; name: string }[] | null;
  file_url: string | null;
  file_type: string | null;
  created_at: string;
};

export default function PublicProfilePage() {
  const roll = useParam("/u/");
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [role, setRole] = useState<"admin" | "cr" | "student">("student");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav("/login");
  }, [loading, user, nav]);

  useEffect(() => {
    if (!roll) return;
    let active = true;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("roll", roll).maybeSingle();
      if (!active) return;
      if (!p) { setNotFound(true); return; }
      setProfile(p as Profile);
      const [{ data: r }, { data: ps }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", (p as Profile).id),
        supabase.from("posts").select("*").eq("user_id", (p as Profile).id).order("created_at", { ascending: false }).limit(50),
      ]);
      if (!active) return;
      const roles = ((r ?? []) as { role: "admin" | "cr" | "student" }[]).map((x) => x.role);
      setRole(roles.includes("admin") ? "admin" : roles.includes("cr") ? "cr" : "student");
      setPosts((ps as Post[]) ?? []);
    })();
    return () => { active = false; };
  }, [roll]);

  if (notFound) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div>
          <h1 className="text-xl font-bold">Profile not found</h1>
          <p className="mt-2 text-sm text-foreground/70">No student with roll {roll}.</p>
          <Link to="/students" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
            Back to Students
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) return <div className="grid min-h-screen place-items-center text-foreground/70">Loading…</div>;

  const label = displayRole(profile, role);
  const Icon = label === "Founder" ? Crown : label === "Admin" ? Shield : label === "CR" ? UserCog : null;
  const badgeColor =
    label === "Founder" ? "bg-amber-400/90 text-amber-950"
    : label === "Admin" ? "bg-rose-500/90 text-rose-50"
    : label === "CR" ? "bg-sky-500/90 text-sky-50"
    : "bg-secondary/80 text-secondary-foreground";

  return (
    <div className="relative min-h-screen bg-background pb-24">
      <DashboardHeader title="Profile" />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/80 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <section className="glass rounded-3xl p-6 text-center">
          <div className="mx-auto h-28 w-28 overflow-hidden rounded-full bg-muted ring-4 ring-primary/40">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-4xl font-bold text-secondary">{profile.name[0]}</div>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold">{profile.name}</h1>
          <div className={"mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold " + badgeColor}>
            {Icon && <Icon className="h-3 w-3" />} {label}
          </div>
          <div className="mt-1 text-xs text-foreground/60">{profile.department}</div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-left sm:grid-cols-3">
            <Info label="Roll" v={profile.roll} />
            <Info label="Batch" v={profile.batch} />
            <Info label="Session" v={profile.session} />
            <Info label="District" v={profile.district} />
            <Info label="Blood" v={profile.blood_group} />
            <Info label="Gender" v={profile.gender} />
          </div>
          {safeHttpUrl(profile.facebook_link) && (
            <a
              href={safeHttpUrl(profile.facebook_link)!}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              <Facebook className="h-3.5 w-3.5" /> Send Friend Request
            </a>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/70">Timeline · {posts.length} posts</h2>
          {posts.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-xs text-foreground/60">No posts yet.</div>
          ) : (
            posts.map((p) => {
              const media = (p.media_urls && p.media_urls.length)
                ? p.media_urls
                : (p.file_url ? [{ url: p.file_url, type: p.file_type ?? "", name: p.title }] : []);
              const firstImage = media.find((m) => m.type.startsWith("image/"));
              return (
                <article key={p.id} className="glass overflow-hidden rounded-2xl">
                  <div className="px-4 pt-3 text-[11px] text-foreground/60">
                    {new Date(p.created_at).toLocaleString()} · {p.subject}
                  </div>
                  {p.description && <p className="px-4 pt-1.5 text-sm text-foreground/90 whitespace-pre-wrap">{p.description}</p>}
                  {firstImage && (
                    <a href={firstImage.url} target="_blank" rel="noreferrer" className="mt-2 block">
                      <img src={firstImage.url} alt="" loading="lazy" className="max-h-[420px] w-full object-cover" />
                    </a>
                  )}
                  <div className="px-4 py-2 text-[11px] text-foreground/50">{media.length} attachment{media.length === 1 ? "" : "s"}</div>
                </article>
              );
            })
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

function Info({ label, v }: { label: string; v: string | null | undefined }) {
  return (
    <div className="rounded-xl bg-muted/40 p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-foreground/60">{label}</div>
      <div className="text-sm font-semibold">{v ?? "—"}</div>
    </div>
  );
}