import { createFileRoute, useNavigate } from "@/lib/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BottomNav } from "@/components/BottomNav";
import { FileText, Image as ImageIcon, Download, Search, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/notes")({ component: NotesPage });

type Media = { url: string; type: string; name: string };
type Post = {
  id: string;
  user_id: string;
  subject: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  media_urls: Media[] | null;
  created_at: string;
};
type Author = { id: string; name: string; roll: string; profile_photo: string | null };

function isPdf(m: Media) {
  return m.type === "application/pdf" || m.name.toLowerCase().endsWith(".pdf");
}
function isImage(m: Media) {
  return m.type.startsWith("image/");
}

export default function NotesPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Record<string, Author>>({});
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!loading && !user) nav("/login");
  }, [loading, user, nav]);

  const load = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    const list = (data as Post[]) ?? [];
    setPosts(list);
    const ids = Array.from(new Set(list.map((p) => p.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,name,roll,profile_photo")
        .in("id", ids);
      const m: Record<string, Author> = {};
      (profs ?? []).forEach((p) => (m[(p as Author).id] = p as Author));
      setAuthors(m);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("notes-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const items = useMemo(() => {
    const all = posts.flatMap((p) => {
      const media: Media[] = (p.media_urls && p.media_urls.length)
        ? p.media_urls
        : (p.file_url ? [{ url: p.file_url, type: p.file_type ?? "", name: p.title }] : []);
      return media.map((m, i) => ({ post: p, media: m, key: p.id + "-" + i }));
    }).filter(({ media }) => isImage(media) || isPdf(media) || !!media.url);
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter(({ post, media }) =>
      post.title.toLowerCase().includes(needle) ||
      post.subject.toLowerCase().includes(needle) ||
      media.name.toLowerCase().includes(needle),
    );
  }, [posts, q]);

  return (
    <div className="relative min-h-screen bg-background pb-24">
      <DashboardHeader title="Notes & Files" />
      <main className="mx-auto max-w-2xl space-y-3 px-4 py-4">
        <div className="glass flex items-center gap-2 rounded-xl px-3 py-2">
          <Search className="h-4 w-4 text-secondary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes, files, subjects…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {items.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-foreground/60">
            No notes yet. Upload one from the Dashboard.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map(({ post, media, key }) => {
              const author = authors[post.user_id];
              const image = isImage(media);
              return (
                <div key={key} className="glass overflow-hidden rounded-2xl">
                  <div className="relative aspect-square bg-muted/40">
                    {image ? (
                      <img src={media.url} alt={media.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
                        {isPdf(media) ? (
                          <FileText className="h-10 w-10 text-red-400" />
                        ) : (
                          <FileText className="h-10 w-10 text-secondary" />
                        )}
                        <div className="line-clamp-3 text-[11px] text-foreground/70">{media.name}</div>
                      </div>
                    )}
                    {image && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-black/50 p-1 text-white">
                        <ImageIcon className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 p-2.5">
                    <div className="truncate text-xs font-semibold">{post.title}</div>
                    <div className="truncate text-[10px] text-foreground/60">
                      {author?.name ?? "Student"} · {new Date(post.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 pt-1">
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-1 items-center justify-center gap-1 rounded-md bg-muted/60 py-1 text-[10px] font-semibold hover:bg-muted"
                      >
                        <ExternalLink className="h-3 w-3" /> Open
                      </a>
                      <a
                        href={media.url}
                        download
                        className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary py-1 text-[10px] font-bold text-primary-foreground"
                      >
                        <Download className="h-3 w-3" /> Save
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}