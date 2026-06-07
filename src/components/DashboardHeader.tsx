import { Link } from "@/lib/navigation";
import logo from "@/assets/logo.png";
import { NotificationBell } from "./NotificationBell";

export function DashboardHeader({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
          <img
            src={logo}
            alt="Department logo"
            className="h-9 w-9 shrink-0 rounded-full ring-2 ring-primary/40"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold leading-tight">
              {title ?? "Law & Land Administration"}
            </div>
            <div className="truncate text-[10px] text-foreground/60 leading-tight">
              Islamic University · সংবিধি-৮
            </div>
          </div>
        </Link>
        <div className="ml-auto">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}