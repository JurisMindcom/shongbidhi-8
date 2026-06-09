import { motion } from "framer-motion";
import { CheckCircle2, Facebook, Crown, Shield, UserCog, ExternalLink } from "lucide-react";
import type { Profile } from "@/lib/auth";
import { Link } from "@/lib/navigation";
import { setActiveCard, useActiveCard } from "@/lib/active-card";

export const FOUNDER_ROLL = "2426006";
/** Rolls that should always display the "CR" role label regardless of stored role. */
export const STATIC_CR_ROLLS = new Set<string>(["2426008"]);

export type CardRole = "Admin" | "CR" | "Founder" | "Student";
export const displayRole = (
  profile: Pick<Profile, "roll">,
  baseRole?: "admin" | "cr" | "student",
): CardRole => {
  if (profile.roll === FOUNDER_ROLL) return "Founder";
  if (baseRole === "admin") return "Admin";
  if (baseRole === "cr" || STATIC_CR_ROLLS.has(profile.roll)) return "CR";
  return "Student";
};

export function StudentCard({
  profile,
  role: baseRole,
}: {
  profile: Profile;
  /** @deprecated serial numbering removed */
  serial?: number;
  role?: "admin" | "cr" | "student";
}) {
  const { activeId } = useActiveCard();
  const flipped = activeId === profile.id;
  const role = displayRole(profile, baseRole);
  const badgeClass =
    role === "Founder"
      ? "rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-semibold text-amber-950 inline-flex items-center gap-1"
      : role === "Admin"
        ? "rounded-full bg-rose-500/90 px-2 py-0.5 text-[10px] font-semibold text-rose-50 inline-flex items-center gap-1"
        : role === "CR"
          ? "rounded-full bg-sky-500/90 px-2 py-0.5 text-[10px] font-semibold text-sky-50 inline-flex items-center gap-1"
          : "rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground inline-flex items-center gap-1";
  const RoleIcon = role === "Founder" ? Crown : role === "Admin" ? Shield : role === "CR" ? UserCog : null;
  return (
    <div className="perspective-[1200px]" style={{ perspective: "1200px" }}>
      <motion.div
        className="relative aspect-[3/4] w-full cursor-pointer"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.7, type: "spring" }}
        onClick={() => setActiveCard(flipped ? null : profile.id)}
      >
        {/* FRONT */}
        <div
          className="glass absolute inset-0 flex flex-col items-center gap-2 rounded-2xl p-3 transition-opacity"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", opacity: flipped ? 0 : 1 }}
        >
          {/* Tap indicator */}
          <span
            aria-hidden
            className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold tracking-widest text-white shadow ring-1 ring-white/20 backdrop-blur"
            title="Tap to flip"
          >
            TAP
          </span>
          <div className="relative h-[72%] w-full overflow-hidden rounded-xl bg-muted">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-secondary">
                {profile.name?.[0] ?? "?"}
              </div>
            )}
          </div>
          <span className={badgeClass}>
            {RoleIcon && <RoleIcon className="h-3 w-3" />} {role}
          </span>
          <div className="flex items-center gap-1 text-center text-sm font-semibold text-foreground">
            <span className="line-clamp-1">{profile.name}</span>
            <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500 text-emerald-50" />
          </div>
        </div>

        {/* BACK */}
        <div
          className="glass absolute inset-0 flex flex-col gap-2 rounded-2xl p-3"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{profile.name}</div>
              <div className="text-[10px] text-foreground/60">{profile.department}</div>
            </div>
            <span className={badgeClass}>
              {RoleIcon && <RoleIcon className="h-3 w-3" />} {role}
            </span>
          </div>
          <div className="flex-1 space-y-1.5 text-xs leading-tight text-foreground/90">
            <Row label="Role" value={role} />
            <Row label="Roll" value={profile.roll} />
            <Row label="District" value={profile.district ?? "—"} />
            <Row label="Blood" value={profile.blood_group ?? "—"} />
            <Row label="Session" value={profile.session ?? "2024-2025"} />
          </div>
          {profile.facebook_link ? (
            <a
              href={profile.facebook_link}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-2 py-1.5 text-[11px] font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Facebook className="h-3.5 w-3.5" /> Send Friend Request
            </a>
          ) : null}
          <Link
            to={"/u/" + profile.roll}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-muted/60 px-2 py-1.5 text-[11px] font-semibold text-foreground transition hover:bg-muted"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Visit Profile
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[10px] uppercase tracking-wide text-foreground/55">{label}</span>
      <span className="truncate text-right font-semibold text-secondary">{value}</span>
    </div>
  );
}