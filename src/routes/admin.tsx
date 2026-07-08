import { createFileRoute, Link, useNavigate } from "@/lib/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme, type ThemeName } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FloatingParticles } from "@/components/FloatingParticles";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BottomNav } from "@/components/BottomNav";
import {
  Trash2, UserPlus, Palette, ArrowLeft, Upload, X,
  Pencil, Pause, Play, Search,
} from "lucide-react";
import type { Profile } from "@/lib/auth";
import { compareStudents } from "@/lib/sort-students";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type FormState = {
  name: string; roll: string; password: string;
  registration_number: string; session: string; batch: string;
  blood_group: string; district: string; gender: "" | "Male" | "Female";
  facebook_link: string; profile_photo: string; phone: string;
  role: "student" | "cr" | "admin";
};

const emptyForm: FormState = {
  name: "", roll: "", password: "", registration_number: "",
  session: "2024-2025", batch: "08",
  blood_group: "", district: "", gender: "", facebook_link: "", profile_photo: "", phone: "",
  role: "student",
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const clean = (v: string) => v.trim() || null;

async function adminCreateStudent(data: FormState & { gender: "Male" | "Female" }) {
  const { data: res, error } = await supabase.functions.invoke("admin-create-student", {
    body: {
      name: data.name.trim(),
      roll: data.roll.trim(),
      password: data.password,
      registration_number: clean(data.registration_number),
      session: clean(data.session),
      batch: clean(data.batch),
      blood_group: clean(data.blood_group),
      district: clean(data.district),
      gender: data.gender,
      phone: clean(data.phone),
      facebook_link: clean(data.facebook_link),
      profile_photo: clean(data.profile_photo),
      role: data.role,
    },
  });
  if (error) {
    // Surface server-supplied error body when available
    const ctx = (error as { context?: Response }).context;
    if (ctx) {
      try {
        const body = await ctx.json();
        throw new Error(body?.error ?? error.message);
      } catch { /* fall through */ }
    }
    throw error;
  }
  if (res && (res as { error?: string }).error) throw new Error((res as { error: string }).error);
}

async function adminDeleteStudent(id: string) {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw error;
}

async function adminUpdateStudent(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase.from("profiles").update(patch as never).eq("id", id);
  if (error) throw error;
}

async function adminSetStatus(id: string, status: "active" | "suspended") {
  const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
  if (error) throw error;
}

export default function AdminPage() {
  const { user, isAdmin, isCR, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const nav = useNavigate();
  const [students, setStudents] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");
  const [confirmDel, setConfirmDel] = useState<Profile | null>(null);
  const [editing, setEditing] = useState<Profile | null>(null);
  const canAccess = isAdmin || isCR;

  useEffect(() => {
    if (!loading && (!user || !canAccess)) nav("/login");
  }, [loading, user, canAccess, nav]);

  useEffect(() => {
    if (!canAccess) return;
    let active = true;
    supabase.from("profiles").select("*").order("roll").then(({ data }) => {
      if (active) setStudents(((data as Profile[]) ?? []).slice().sort((a, b) => compareStudents(a, b)));
    });
    const channel = supabase
      .channel("profiles-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, (payload) => {
        setStudents((prev) => {
          if (payload.eventType === "DELETE") {
            return prev.filter((p) => p.id !== (payload.old as Profile).id);
          }
          const next = payload.new as Profile;
          const exists = prev.some((p) => p.id === next.id);
          const merged = exists ? prev.map((p) => (p.id === next.id ? next : p)) : [...prev, next];
          return merged.sort((a, b) => compareStudents(a, b));
        });
      })
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [canAccess]);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `students/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setForm((f) => ({ ...f, profile_photo: data.publicUrl }));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gender) return toast.error("Please select gender");
    if (!form.password || form.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (students.some((s) => s.roll === form.roll.trim())) {
      return toast.error("A student with this roll already exists");
    }
    setSubmitting(true);
    try {
      // CRs can only create students
      const safeRole = isAdmin ? form.role : "student";
      await adminCreateStudent({ ...form, role: safeRole, gender: form.gender });
      toast.success("Student created");
      setForm(emptyForm);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirmDel) return;
    const id = confirmDel.id;
    setConfirmDel(null);
    // optimistic remove
    setStudents((prev) => prev.filter((p) => p.id !== id));
    try {
      await adminDeleteStudent(id);
      toast.success("Account deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const toggleStatus = async (s: Profile) => {
    const next = s.status === "active" ? "suspended" : "active";
    setStudents((prev) => prev.map((p) => (p.id === s.id ? { ...p, status: next } : p)));
    try {
      await adminSetStatus(s.id, next);
      toast.success(next === "active" ? "Activated" : "Suspended");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const filtered = students
    .filter((s) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q);
    })
    .sort((a, b) => compareStudents(a, b));

  if (!canAccess) return <div className="grid min-h-screen place-items-center text-foreground/70">Loading…</div>;

  return (
    <div className="relative min-h-screen bg-background pb-24">
      <FloatingParticles count={10} />
      <DashboardHeader title={isAdmin ? "Admin Panel" : "CR Panel"} />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/80 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <Link
          to="/admin/add"
          className="glass flex items-center justify-between rounded-2xl p-5 hover:bg-muted/30"
          style={{ boxShadow: "0 0 30px var(--glow)" }}
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/30 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Add Student / CR</div>
              <div className="text-[11px] text-foreground/60">Open dedicated full-page form</div>
            </div>
          </div>
          <ArrowLeft className="h-4 w-4 rotate-180 text-foreground/60" />
        </Link>

        {/* Theme switcher (admin only) */}
        {isAdmin && (
        <section className="glass rounded-2xl p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Palette className="h-4 w-4" /> Global Theme</h2>
          <div className="flex flex-wrap gap-2">
            {(["royal", "purple", "green"] as ThemeName[]).map((t) => (
              <button key={t} onClick={() => setTheme(t)}
                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${theme === t ? "bg-primary text-primary-foreground glow-ring" : "bg-muted/40"}`}>
                {t}
              </button>
            ))}
          </div>
        </section>
        )}

        {/* Add student */}
        <section className="glass rounded-2xl p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><UserPlus className="h-4 w-4" /> Add Student</h2>
          <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2">
            {/* Photo upload */}
            <div className="sm:col-span-2 flex items-center gap-4 rounded-lg bg-muted/30 p-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted/60 ring-2 ring-primary/30">
                {form.profile_photo ? (
                  <img src={form.profile_photo} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs text-foreground/50">No photo</div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary/90 px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary">
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? "Uploading…" : form.profile_photo ? "Change Photo" : "Upload Photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
                {form.profile_photo && (
                  <button type="button" onClick={() => setForm({ ...form, profile_photo: "" })}
                    className="ml-2 inline-flex items-center gap-1 rounded-lg bg-destructive/70 px-3 py-2 text-xs font-semibold text-destructive-foreground">
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
                <p className="text-[11px] text-foreground/60">JPG/PNG, up to 5MB. Or paste a URL below.</p>
              </div>
            </div>
            {([
              ["name", "Full Name *", true],
              ["roll", "Roll Number *", true],
              ["password", "Password *", true],
              ["registration_number", "Registration", false],
              ["session", "Session", false],
              ["batch", "Batch", false],
              ["district", "District", false],
              ["phone", "Phone", false],
              ["facebook_link", "Facebook URL", false],
              ["profile_photo", "Profile photo URL", false],
            ] as const).map(([k, p, req]) => (
              <input key={k} required={req} placeholder={p}
                value={form[k as keyof typeof form] as string}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                className="rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none" />
            ))}
            <select
              value={form.blood_group}
              onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
              className="rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none"
            >
              <option value="">Blood Group</option>
              {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select
              required
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value as FormState["gender"] })}
              className="rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none"
            >
              <option value="">Gender *</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            {isAdmin ? (
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}
                className="rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none">
                <option value="student">Student</option>
                <option value="cr">CR</option>
                <option value="admin">Admin</option>
              </select>
            ) : (
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-foreground/70">
                Role: Student (CR can only create students)
              </div>
            )}
            <button
              disabled={submitting}
              className="sm:col-span-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create Account"}
            </button>
          </form>
        </section>

        {/* Student list (admin only) */}
        {isAdmin && (
        <section className="glass rounded-2xl p-5">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold">Students ({filtered.length})</h2>
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-1.5">
              <Search className="h-4 w-4 text-secondary" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or roll…"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            {filtered.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{s.name}</span>
                    {s.status !== "active" && (
                      <span className="rounded-full bg-destructive/30 px-2 py-0.5 text-[10px] uppercase text-destructive-foreground">
                        {s.status}
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-foreground/60">
                    Roll {s.roll} · {s.gender ?? "—"} · {s.batch ?? "—"}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditing(s)} title="Edit"
                    className="rounded-md bg-muted/60 p-2 text-foreground/80 hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => toggleStatus(s)}
                    title={s.status === "active" ? "Suspend" : "Activate"}
                    className="rounded-md bg-muted/60 p-2 text-foreground/80 hover:bg-muted">
                    {s.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setConfirmDel(s)} title="Delete"
                    className="rounded-md bg-destructive/80 p-2 text-destructive-foreground hover:bg-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}
      </main>

      {/* Edit modal (admin only) */}
      {isAdmin && editing && (
        <EditStudentModal
          student={editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            try {
              await adminUpdateStudent(editing.id, patch);
              toast.success("Student updated");
              setEditing(null);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed");
            }
          }}
        />
      )}

      {/* Delete confirm modal (admin only) */}
      {isAdmin && confirmDel && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
          <div className="glass w-full max-w-sm space-y-4 rounded-2xl p-6 text-center">
            <h3 className="text-lg font-bold">Delete account?</h3>
            <p className="text-sm text-foreground/75">
              This permanently removes <span className="font-semibold">{confirmDel.name}</span> (Roll {confirmDel.roll}).
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-2">
              <button onClick={() => setConfirmDel(null)}
                className="rounded-lg bg-muted/60 px-4 py-2 text-sm font-semibold">Cancel</button>
              <button onClick={confirmDelete}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}

function EditStudentModal({
  student, onClose, onSave,
}: {
  student: Profile;
  onClose: () => void;
  onSave: (patch: Record<string, unknown>) => void | Promise<void>;
}) {
  const [f, setF] = useState({
    name: student.name ?? "",
    registration_number: student.registration_number ?? "",
    session: student.session ?? "",
    batch: student.batch ?? "",
    blood_group: student.blood_group ?? "",
    district: student.district ?? "",
    gender: (student.gender as "Male" | "Female" | null) ?? "",
    phone: student.phone ?? "",
    facebook_link: student.facebook_link ?? "",
    profile_photo: student.profile_photo ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `students/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setF((p) => ({ ...p, profile_photo: data.publicUrl }));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 px-4 py-6">
      <div className="glass w-full max-w-lg space-y-3 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Edit {student.name}</h3>
          <button onClick={onClose} className="rounded-full bg-muted/60 p-1.5">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-4 rounded-lg bg-muted/30 p-3">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted/60 ring-2 ring-primary/30">
            {f.profile_photo ? (
              <img src={f.profile_photo} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs text-foreground/50">No photo</div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary/90 px-3 py-2 text-xs font-semibold text-primary-foreground">
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "Uploading…" : f.profile_photo ? "Replace" : "Upload"}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
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
          {([
            ["name", "Full Name"],
            ["registration_number", "Registration"],
            ["session", "Session"],
            ["batch", "Batch"],
            ["district", "District"],
            ["phone", "Phone"],
            ["facebook_link", "Facebook URL"],
          ] as const).map(([k, p]) => (
            <input key={k} placeholder={p}
              value={f[k] as string}
              onChange={(e) => setF({ ...f, [k]: e.target.value })}
              className="rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none" />
          ))}
          <select
            value={f.blood_group}
            onChange={(e) => setF({ ...f, blood_group: e.target.value })}
            className="rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none"
          >
            <option value="">Blood Group</option>
            {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select
            value={f.gender}
            onChange={(e) => setF({ ...f, gender: e.target.value as "Male" | "Female" })}
            className="rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none"
          >
            <option value="">Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose}
            className="rounded-lg bg-muted/60 px-4 py-2 text-sm font-semibold">Cancel</button>
          <button
            onClick={() => onSave({
              name: f.name || undefined,
              registration_number: f.registration_number || null,
              session: f.session || null,
              batch: f.batch || null,
              blood_group: f.blood_group || null,
              district: f.district || null,
              gender: f.gender || undefined,
              phone: f.phone || null,
              facebook_link: f.facebook_link || null,
              profile_photo: f.profile_photo || null,
            })}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}