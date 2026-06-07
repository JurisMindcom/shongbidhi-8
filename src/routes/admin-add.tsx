import { createFileRoute, Link, useNavigate } from "@/lib/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, UserPlus } from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";

export const Route = createFileRoute("/admin/add")({ component: AdminAddPage });

type Form = {
  name: string; roll: string; password: string;
  registration_number: string; session: string; batch: string;
  blood_group: string; district: string; gender: "" | "Male" | "Female";
  facebook_link: string; profile_photo: string; phone: string;
  role: "student" | "cr" | "admin";
};

const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const defaults: Form = {
  name: "", roll: "", password: "",
  registration_number: "",
  session: "2024-2025",
  batch: "08",
  blood_group: "", district: "",
  gender: "",
  facebook_link: "", profile_photo: "", phone: "",
  role: "student",
};

const clean = (v: string) => v.trim() || null;

export default function AdminAddPage() {
  const { user, isAdmin, isCR, loading } = useAuth();
  const nav = useNavigate();
  const canAccess = isAdmin || isCR;
  const [f, setF] = useState<Form>(defaults);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !canAccess)) nav("/login");
  }, [loading, user, canAccess, nav]);

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `students/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setF((s) => ({ ...s, profile_photo: data.publicUrl }));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!f.gender) return toast.error("Please select gender");
    if (!f.password || f.password.length < 6) return toast.error("Password ≥ 6 chars");
    setSubmitting(true);
    try {
      const role = isAdmin ? f.role : "student";
      const { data: res, error } = await supabase.functions.invoke("admin-create-student", {
        body: {
          name: f.name.trim(),
          roll: f.roll.trim(),
          password: f.password,
          registration_number: clean(f.registration_number),
          session: clean(f.session),
          batch: clean(f.batch),
          blood_group: clean(f.blood_group),
          district: clean(f.district),
          gender: f.gender,
          phone: clean(f.phone),
          facebook_link: clean(f.facebook_link),
          profile_photo: clean(f.profile_photo),
          role,
        },
      });
      if (error) {
        const ctx = (error as { context?: Response }).context;
        if (ctx) { try { const body = await ctx.json(); throw new Error(body?.error ?? error.message); } catch { /* */ } }
        throw error;
      }
      if (res && (res as { error?: string }).error) throw new Error((res as { error: string }).error);
      toast.success("Account created");
      setF({ ...defaults });
      // Realtime channel on /students will pick this up instantly.
      setTimeout(() => nav("/admin"), 400);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canAccess) return <div className="grid min-h-screen place-items-center text-foreground/70">Loading…</div>;

  return (
    <div className="relative min-h-screen bg-background pb-24">
      <DashboardHeader title="Add Account" />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/80 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Admin
        </Link>

        <form onSubmit={submit} className="glass space-y-3 rounded-2xl p-5">
          <h1 className="flex items-center gap-2 text-lg font-bold"><UserPlus className="h-4 w-4" /> New Account</h1>

          <div className="flex items-center gap-4 rounded-lg bg-muted/30 p-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted/60 ring-2 ring-primary/30">
              {f.profile_photo ? (
                <img src={f.profile_photo} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs text-foreground/50">No photo</div>
              )}
            </div>
            <div className="flex flex-1 flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary/90 px-3 py-2 text-xs font-semibold text-primary-foreground">
                <Upload className="h-3.5 w-3.5" />
                {uploading ? "Uploading…" : f.profile_photo ? "Change Photo" : "Upload Photo"}
                <input type="file" accept="image/*" className="hidden" onChange={onPhoto} disabled={uploading} />
              </label>
              {f.profile_photo && (
                <button type="button" onClick={() => setF({ ...f, profile_photo: "" })}
                  className="inline-flex items-center gap-1 rounded-lg bg-destructive/70 px-3 py-2 text-xs font-semibold text-destructive-foreground">
                  <X className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Input label="Full Name *" value={f.name} required onChange={(v) => setF({ ...f, name: v })} />
            <Input label="Roll Number *" value={f.roll} required onChange={(v) => setF({ ...f, roll: v })} />
            <Input label="Password *" type="password" value={f.password} required onChange={(v) => setF({ ...f, password: v })} />
            <Input label="Registration" value={f.registration_number} onChange={(v) => setF({ ...f, registration_number: v })} />
            <Input label="Session" value={f.session} onChange={(v) => setF({ ...f, session: v })} />
            <Input label="Batch" value={f.batch} onChange={(v) => setF({ ...f, batch: v })} />
            <Input label="District" value={f.district} onChange={(v) => setF({ ...f, district: v })} />
            <Input label="Phone" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
            <Input label="Facebook URL" value={f.facebook_link} onChange={(v) => setF({ ...f, facebook_link: v })} />
            <Input label="Profile photo URL" value={f.profile_photo} onChange={(v) => setF({ ...f, profile_photo: v })} />
            <Select label="Blood Group" value={f.blood_group} options={["", ...BLOOD]} onChange={(v) => setF({ ...f, blood_group: v })} />
            <Select label="Gender *" value={f.gender} options={["", "Male", "Female"]} onChange={(v) => setF({ ...f, gender: v as Form["gender"] })} required />
            <Select
              label="Role"
              value={f.role}
              options={isAdmin ? ["student", "cr", "admin"] : ["student"]}
              onChange={(v) => setF({ ...f, role: v as Form["role"] })}
            />
          </div>

          <button
            disabled={submitting}
            className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
            style={{ boxShadow: "0 0 30px var(--glow)" }}
          >
            {submitting ? "Creating…" : "Create Account"}
          </button>
        </form>
      </main>
    </div>
  );
}

function Input({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="block space-y-1">
      <div className="text-[10px] uppercase tracking-wide text-foreground/60">{label}</div>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none"
      />
    </label>
  );
}
function Select({ label, value, options, onChange, required }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void; required?: boolean }) {
  return (
    <label className="block space-y-1">
      <div className="text-[10px] uppercase tracking-wide text-foreground/60">{label}</div>
      <select required={required} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none">
        {options.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
      </select>
    </label>
  );
}