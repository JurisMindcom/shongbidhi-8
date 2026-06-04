import { useState, useEffect } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, LayoutDashboard, Users, BookOpen, Settings, User as UserIcon, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";

type Item = { to: string; label: string; icon: typeof Home; auth?: boolean };
const items: Item[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, auth: true },
  { to: "/students", label: "Students", icon: Users },
  { to: "/notes", label: "Notes", icon: BookOpen, auth: true },
  { to: "/profile", label: "Profile", icon: UserIcon, auth: true },
  { to: "/settings", label: "Settings", icon: Settings, auth: true },
];

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const unsub = router.subscribe("onResolved", () => setOpen(false));
    return () => unsub();
  }, [router]);

  return (
    <>
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="glass fixed left-3 top-3 z-40 grid h-10 w-10 place-items-center rounded-full text-foreground hover:scale-105 transition"
      >
        <Menu className="h-5 w-5" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="bg"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="panel"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
              className="glass fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col gap-1 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-bold text-gradient">Menu</div>
                <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full bg-muted/40">
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
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/90 transition hover:bg-muted/50"
                    activeProps={{ className: "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold bg-primary/20 text-foreground" }}
                  >
                    <Icon className="h-4 w-4 text-secondary" /> {it.label}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link to="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-amber-400 hover:bg-muted/50">
                  <Shield className="h-4 w-4" /> Admin Panel
                </Link>
              )}
              <div className="mt-auto">
                {user ? (
                  <button
                    onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}
                    className="flex w-full items-center gap-3 rounded-xl bg-primary/80 px-3 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                ) : (
                  <Link to="/login" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground">
                    Login
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}