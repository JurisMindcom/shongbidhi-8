import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import loginBg from "@/assets/login-bg.jpg";
import { FloatingParticles } from "@/components/FloatingParticles";
import { ArrowLeft, Lock, ShieldCheck, User } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login · Law & Land Administration" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { signInWithRoll, user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState<"student" | "admin">("student");
  const [roll, setRoll] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: isAdmin ? "/admin" : "/dashboard" });
  }, [user, isAdmin, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signInWithRoll(roll, password);
    setSubmitting(false);
    if (error) toast.error(error);
    else toast.success("Welcome back");
  };

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-background">
      <img src={loginBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/90 backdrop-blur-sm" />
      <FloatingParticles count={24} />

      <Link
        to="/"
        className="glass absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Home
      </Link>

      <div className="relative z-10 flex min-h-[100svh] items-center justify-center px-4 py-10">
        <motion.form
          onSubmit={submit}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 80 }}
          className="glass w-full max-w-md space-y-5 rounded-3xl p-7 glow-ring"
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-xs text-foreground/70">Sign in to your department portal</p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-1">
            {(["student", "admin"] as const).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize transition ${
                  role === r ? "bg-primary text-primary-foreground" : "text-foreground/70"
                }`}
              >
                {r === "admin" ? <ShieldCheck className="mr-1 inline h-4 w-4" /> : <User className="mr-1 inline h-4 w-4" />}
                {r}
              </button>
            ))}
          </div>

          <Field icon={<User className="h-4 w-4" />} placeholder="Roll Number" value={roll} onChange={setRoll} />
          <Field icon={<Lock className="h-4 w-4" />} type="password" placeholder="Password" value={password} onChange={setPassword} />

          <button
            disabled={submitting}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            style={{ boxShadow: "0 0 30px var(--glow)" }}
          >
            {submitting ? "Signing in..." : "Login"}
          </button>

          <p className="text-center text-[11px] text-foreground/60">
            No public registration. Accounts are created by admin.
          </p>
        </motion.form>
      </div>
    </div>
  );
}

function Field({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring">
      <span className="text-secondary">{icon}</span>
      <input
        type={type}
        required
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground/50 focus:outline-none"
      />
    </div>
  );
}