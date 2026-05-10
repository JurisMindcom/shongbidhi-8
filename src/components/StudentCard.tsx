import { motion } from "framer-motion";
import { useState } from "react";
import { CheckCircle2, Facebook } from "lucide-react";
import type { Profile } from "@/lib/auth";

export function StudentCard({ profile }: { profile: Profile }) {
  const [flipped, setFlipped] = useState(false);
  const role = profile.id ? "Student" : "Student";
  return (
    <div className="perspective-[1200px]" style={{ perspective: "1200px" }}>
      <motion.div
        className="relative aspect-[3/4] w-full cursor-pointer"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.7, type: "spring" }}
        onClick={() => setFlipped((f) => !f)}
      >
        {/* FRONT */}
        <div
          className="glass absolute inset-0 flex flex-col items-center gap-2 rounded-2xl p-3"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="relative h-[72%] w-full overflow-hidden rounded-xl bg-muted">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-secondary">
                {profile.name?.[0] ?? "?"}
              </div>
            )}
          </div>
          <span className="rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
            {role}
          </span>
          <div className="flex items-center gap-1 text-center text-sm font-semibold text-foreground">
            <span className="line-clamp-1">{profile.name}</span>
            <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500 text-emerald-50" />
          </div>
        </div>

        {/* BACK */}
        <div
          className="glass absolute inset-0 flex flex-col gap-2 rounded-2xl p-3"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="relative h-[55%] w-full overflow-hidden rounded-xl bg-muted">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-secondary">
                {profile.name?.[0] ?? "?"}
              </div>
            )}
          </div>
          <span className="self-start rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
            {role}
          </span>
          <div className="flex-1 space-y-0.5 text-[11px] leading-tight text-foreground/90">
            <div className="text-sm font-bold">{profile.name}</div>
            <div>Batch: <span className="text-secondary">{profile.batch ?? "-"}</span></div>
            <div>District: <span className="text-secondary">{profile.district ?? "-"}</span></div>
            <div>Blood: <span className="text-secondary">{profile.blood_group ?? "-"}</span></div>
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
        </div>
      </motion.div>
    </div>
  );
}