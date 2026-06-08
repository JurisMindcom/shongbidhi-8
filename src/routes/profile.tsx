import { createFileRoute, Link, useNavigate } from "@/lib/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BottomNav } from "@/components/BottomNav";
import { displayRole } from "@/components/StudentCard";
import { Crown, ArrowLeft, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile" }] }),
  component: ProfilePage,
});

function Info({ label, v }: { label: string; v: string | null | undefined }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="text-[10px] uppercase tracking-wide text-foreground/60">{label}</div>
      <div className="text-sm font-semibold">{v ?? "—"}</div>
    </div>
  );
}

function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);
  if (!profile) return <div className="grid min-h-screen place-items-center text-foreground/70">Loading…</div>;
  const role = displayRole(profile);
  const isFounder = role === "Founder";
  return (
    <div className="relative min-h-screen bg-background pb-24">
      <DashboardHeader title="My Profile" />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold"><ArrowLeft className="h-4 w-4" /> Back</Link>
          <Link to="/settings" className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"><SettingsIcon className="h-3.5 w-3.5" /> Edit</Link>
        </div>
        <div className="glass rounded-3xl p-6 text-center">
          <div className="mx-auto h-32 w-32 overflow-hidden rounded-full bg-muted ring-4 ring-primary/40">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-5xl font-bold text-secondary">{profile.name[0]}</div>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold">{profile.name}</h1>
          <div className={"mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold " + (isFounder ? "bg-amber-400/90 text-amber-950" : "bg-secondary/80 text-secondary-foreground")}>
            {isFounder && <Crown className="h-3 w-3" />} {role}
          </div>
          <div className="mt-1 text-xs text-foreground/60">{profile.department}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Info label="Roll" v={profile.roll} />
          <Info label="Reg." v={profile.registration_number} />
          <Info label="Batch" v={profile.batch} />
          <Info label="Session" v={profile.session} />
          <Info label="District" v={profile.district} />
          <Info label="Blood" v={profile.blood_group} />
          <Info label="Phone" v={profile.phone} />
          <Info label="Gender" v={profile.gender} />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}