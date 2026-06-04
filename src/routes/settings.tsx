import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { Camera, ArrowLeft, Upload as UploadIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, loading, refresh } = useAuth();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nick, setNick] = useState("");
  const [session, setSession] = useState("");
  const [phone, setPhone] = useState("");
  const [fb, setFb] = useState("");

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);
  useEffect(() => {
    if (profile) {
      setNick(profile.nickname ?? "");
      setSession(profile.session ?? "");
      setPhone(profile.phone ?? "");
      setFb(profile.facebook_link ?? "");
    }
  }, [profile]);

  if (!profile) return <div className="grid min-h-screen place-items-center text-foreground/70">Loading…</div>;

  const onPhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Pick an image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    const path = `${profile.id}/avatar-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { setBusy(false); return toast.error(error.message); }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: e2 } = await supabase.from("profiles").update({ profile_photo: data.publicUrl }).eq("id", profile.id);
    setBusy(false);
    if (e2) return toast.error(e2.message);
    toast.success("Profile photo updated");
    refresh();
  };

  const saveDetails = async () => {
    const { error } = await supabase.from("profiles").update({
      nickname: nick || null, session: session || null, phone: phone || null, facebook_link: fb || null,
    }).eq("id", profile.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    refresh();
  };

  return (
    <div className="relative min-h-screen bg-background pb-20">
      <HamburgerMenu />
      <header className="flex items-center justify-between px-4 py-3 pl-16">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Back</Link>
      </header>
      <main className="mx-auto max-w-xl space-y-4 px-4">
        <h1 className="text-2xl font-bold">Settings</h1>

        <section className="glass space-y-3 rounded-2xl p-5">
          <h2 className="text-sm font-bold">Profile Photo</h2>
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-muted ring-2 ring-primary/40">
              {(preview ?? profile.profile_photo) ? (
                <img src={preview ?? profile.profile_photo!} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-3xl font-bold text-secondary">{profile.name[0]}</div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input ref={fileRef} hidden type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); }} />
              <button disabled={busy} onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
                <Camera className="h-4 w-4" /> {busy ? "Uploading…" : "Change photo"}
              </button>
              <p className="text-[10px] text-foreground/60">JPG/PNG, up to 5MB. Updates everywhere instantly.</p>
            </div>
          </div>
        </section>

        <section className="glass space-y-3 rounded-2xl p-5">
          <h2 className="text-sm font-bold">Personal Info</h2>
          <Field label="Nickname"><input value={nick} onChange={(e) => setNick(e.target.value)} className="w-full rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none" /></Field>
          <Field label="Session"><input value={session} onChange={(e) => setSession(e.target.value)} className="w-full rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none" /></Field>
          <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none" /></Field>
          <Field label="Facebook URL"><input value={fb} onChange={(e) => setFb(e.target.value)} className="w-full rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none" /></Field>
          <button onClick={saveDetails} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><UploadIcon className="h-4 w-4" /> Save</button>
          <p className="text-[10px] text-foreground/60">Roll number, name and password can only be changed by admin.</p>
        </section>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <div className="text-[10px] uppercase tracking-wide text-foreground/60">{label}</div>
      {children}
    </label>
  );
}