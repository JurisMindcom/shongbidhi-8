import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { useTheme, type ThemeName } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import { adminCreateStudent, adminDeleteStudent } from "@/lib/admin.functions";
import { toast } from "sonner";
import { FloatingParticles } from "@/components/FloatingParticles";
import { LogOut, Trash2, UserPlus, Palette, ArrowLeft } from "lucide-react";
import type { Profile } from "@/lib/auth";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const nav = useNavigate();
  const [students, setStudents] = useState<Profile[]>([]);
  const createFn = useServerFn(adminCreateStudent);
  const deleteFn = useServerFn(adminDeleteStudent);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) nav({ to: "/login" });
  }, [loading, user, isAdmin, nav]);

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").order("roll");
    setStudents((data as Profile[]) ?? []);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const [form, setForm] = useState({
    name: "", roll: "", password: "", registration_number: "", session: "", batch: "",
    blood_group: "", district: "", gender: "", facebook_link: "", profile_photo: "",
    role: "student" as "student" | "cr" | "admin",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFn({ data: form });
      toast.success("Student created");
      setForm({ ...form, name: "", roll: "", password: "", registration_number: "", facebook_link: "", profile_photo: "" });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this account?")) return;
    try { await deleteFn({ data: { id } }); toast.success("Deleted"); load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  if (!isAdmin) return <div className="grid min-h-screen place-items-center text-foreground/70">Loading…</div>;

  return (
    <div className="relative min-h-screen bg-background pb-12">
      <FloatingParticles count={10} />
      <header className="glass sticky top-0 z-30 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Link to="/" className="rounded-full bg-muted/40 p-2"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-lg font-bold">Admin Dashboard</h1>
        </div>
        <button onClick={signOut} className="rounded-full bg-primary/80 px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          <LogOut className="inline h-3.5 w-3.5" />
        </button>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {/* Theme switcher */}
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

        {/* Add student */}
        <section className="glass rounded-2xl p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><UserPlus className="h-4 w-4" /> Add Student</h2>
          <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2">
            {([
              ["name", "Full Name *", true],
              ["roll", "Roll Number *", true],
              ["password", "Password *", true],
              ["registration_number", "Registration", false],
              ["session", "Session", false],
              ["batch", "Batch", false],
              ["blood_group", "Blood Group", false],
              ["district", "District", false],
              ["gender", "Gender", false],
              ["facebook_link", "Facebook URL", false],
              ["profile_photo", "Profile photo URL", false],
            ] as const).map(([k, p, req]) => (
              <input key={k} required={req} placeholder={p}
                value={form[k as keyof typeof form] as string}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                className="rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none" />
            ))}
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}
              className="rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none">
              <option value="student">Student</option>
              <option value="cr">CR</option>
              <option value="admin">Admin</option>
            </select>
            <button className="sm:col-span-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground">Create Account</button>
          </form>
        </section>

        {/* Student list */}
        <section className="glass rounded-2xl p-5">
          <h2 className="mb-3 text-lg font-bold">Students ({students.length})</h2>
          <div className="space-y-2">
            {students.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-foreground/60">Roll {s.roll} · {s.batch ?? "—"}</div>
                </div>
                <button onClick={() => remove(s.id)} className="rounded-md bg-destructive/80 p-2 text-destructive-foreground">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}