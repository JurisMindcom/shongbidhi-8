import { Link, usePathname } from "@/lib/navigation";
import { Home, Users, BookOpen, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCompose } from "@/lib/compose";

const tabs = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/students", label: "Students", icon: Users },
  { to: "/notes", label: "Notes", icon: BookOpen },
] as const;

export function BottomNav() {
  const { profile, user } = useAuth();
  const path = usePathname();
  const compose = useCompose();
  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-center justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        <Tab to="/dashboard" label="Home" Icon={Home} active={path === "/dashboard"} />
        <Tab to="/students" label="Students" Icon={Users} active={path === "/students"} />

        {/* Center Upload FAB — opens global compose modal */}
        <button
          onClick={() => compose.open()}
          aria-label="Share a note, file, or photo"
          className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition active:scale-95"
          style={{ boxShadow: "0 0 30px var(--glow)" }}
        >
          <Plus className="h-7 w-7" />
        </button>

        <Tab to="/notes" label="Notes" Icon={BookOpen} active={path === "/notes"} />

        <Link
          to="/profile"
          aria-label="Profile"
          className={
            "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] " +
            (path === "/profile" ? "text-primary" : "text-foreground/65")
          }
        >
          <div
            className={
              "h-7 w-7 overflow-hidden rounded-full bg-muted ring-2 " +
              (path === "/profile" ? "ring-primary" : "ring-transparent")
            }
          >
            {profile?.profile_photo ? (
              <img src={profile.profile_photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-[10px] font-bold text-secondary">
                {profile?.name?.[0] ?? "?"}
              </div>
            )}
          </div>
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
  void tabs;
}

function Tab({
  to,
  label,
  Icon,
  active,
}: {
  to: string;
  label: string;
  Icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={
        "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition " +
        (active ? "text-primary" : "text-foreground/65 hover:text-foreground")
      }
    >
      <Icon className={"h-5 w-5 " + (active ? "stroke-[2.5]" : "")} />
      <span>{label}</span>
    </Link>
  );
}