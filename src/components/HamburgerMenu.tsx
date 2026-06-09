import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BookOpen,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  User as UserIcon,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { Link, usePathname, useRouter } from "@/lib/navigation";
import { useAuth } from "@/lib/auth";

type Item = { to: string; label: string; icon: typeof Home; auth?: boolean };

const items: Item[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, auth: true },
  { to: "/students", label: "Students", icon: Users },
  { to: "/notes", label: "Notes", icon: BookOpen, auth: true },
  { to: "/notifications", label: "Notifications", icon: Bell, auth: true },
  { to: "/profile", label: "Profile", icon: UserIcon, auth: true },
  { to: "/settings", label: "Settings", icon: Settings, auth: true },
];

export function HamburgerMenu({ inline = false }: { inline?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, isAdmin, isCR, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const menu = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/70"
            onClick={() => setOpen(false)}
          />
          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed bottom-0 right-0 top-0 z-[9999] isolate flex h-dvh w-72 max-w-[85vw] flex-col gap-1 border-l border-sidebar-border bg-sidebar p-4 text-sidebar-foreground shadow-2xl"
            style={{ backgroundColor: "var(--sidebar)" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-bold text-gradient">Menu</div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full bg-muted/40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {items.map((it) => {
              if (it.auth && !user) return null;
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to as "/"}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/90 transition hover:bg-sidebar-accent"
                  activeProps={{
                    className:
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold bg-primary/20 text-sidebar-foreground",
                  }}
                >
                  <Icon className="h-4 w-4 text-secondary" /> {it.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-amber-400 hover:bg-sidebar-accent"
              >
                <Shield className="h-4 w-4" /> Admin Panel
              </Link>
            )}
            {isCR && !isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sky-300 hover:bg-sidebar-accent"
              >
                <UserCog className="h-4 w-4" /> CR Panel
              </Link>
            )}
            <div className="mt-auto">
              {user ? (
                <button
                  onClick={async () => {
                    await signOut();
                    router.navigate({ to: "/" });
                  }}
                  className="flex w-full items-center gap-3 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground"
                >
                  Login
                </Link>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className={
          inline
            ? "grid h-9 w-9 place-items-center rounded-full bg-muted/40 text-foreground hover:bg-muted/60"
            : "glass fixed left-3 top-3 z-40 grid h-10 w-10 place-items-center rounded-full text-foreground transition hover:scale-105"
        }
      >
        <Menu className={inline ? "h-4 w-4" : "h-5 w-5"} />
      </button>
      {mounted ? createPortal(menu, document.body) : null}
    </>
  );
}
