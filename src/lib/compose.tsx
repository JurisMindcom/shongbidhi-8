import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, FileText, Image as ImageIcon, Paperclip, Send } from "lucide-react";

type Ctx = { open: () => void; close: () => void };
const ComposeCtx = createContext<Ctx>({ open: () => {}, close: () => {} });
export const useCompose = () => useContext(ComposeCtx);

export function ComposeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value: Ctx = {
    open: useCallback(() => setOpen(true), []),
    close: useCallback(() => setOpen(false), []),
  };
  return (
    <ComposeCtx.Provider value={value}>
      {children}
      {open && <ComposeDialog onClose={() => setOpen(false)} />}
    </ComposeCtx.Provider>
  );
}

function ComposeDialog({ onClose }: { onClose: () => void }) {
  const { user, profile } = useAuth();
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  if (!user || !profile) {
    return (
      <Backdrop onClose={onClose}>
        <div className="glass w-full max-w-md rounded-2xl p-6 text-center text-sm text-foreground/70">
          Please sign in to share a post.
        </div>
      </Backdrop>
    );
  }

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).filter((f) => f.size <= 20 * 1024 * 1024);
    setFiles((prev) => [...prev, ...arr].slice(0, 10));
  };

  const submit = async () => {
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
    toast.success("Posted");
    onClose();
  };

  return (
    <Backdrop onClose={onClose}>
      <div className="glass w-full max-w-lg space-y-3 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Share a note, file, or photo</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-muted/40">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-sm font-bold text-secondary">
                {profile.name[0]}
              </div>
            )}
          </div>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional)"
            className="flex-1 rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none"
          />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What do you want to share?"
          rows={4}
          autoFocus
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
        <input ref={ref} hidden type="file" multiple
          accept="image/*,.pdf,.doc,.docx,.txt,.zip,.ppt,.pptx,.xls,.xlsx"
          onChange={(e) => addFiles(e.target.files)} />
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <button onClick={() => ref.current?.click()} className="flex items-center gap-1 rounded-lg bg-muted/40 px-3 py-2 text-xs font-semibold hover:bg-muted/60">
              <ImageIcon className="h-3.5 w-3.5 text-emerald-400" /> Photo
            </button>
            <button onClick={() => ref.current?.click()} className="flex items-center gap-1 rounded-lg bg-muted/40 px-3 py-2 text-xs font-semibold hover:bg-muted/60">
              <Paperclip className="h-3.5 w-3.5 text-secondary" /> File
            </button>
          </div>
          <button disabled={busy} onClick={submit}
            className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">
            <Send className="h-3.5 w-3.5" /> {busy ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

function Backdrop({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">{children}</div>
    </div>
  );
}