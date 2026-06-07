import { createFileRoute, useNavigate, Link } from "@/lib/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import loginBg from "@/assets/login-bg.jpg";
import { FloatingParticles } from "@/components/FloatingParticles";
import { ArrowLeft, Lock, User, Shield, GraduationCap, UserCog } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login · Law & Land Administration" }] }),
  component: LoginPage,
});

export default function LoginPage() {
  const { signInWithRoll, user, isAdmin, isCR, loading, loginMode } = useAuth();
  const nav = useNavigate();
  const [roll, setRoll] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [remember, setRemember] = useState(true);
  const [step, setStep] = useState<"role" | "form">("role");
  const [chosenMode, setChosenMode] = useState<"admin" | "cr" | "student">(loginMode);

  useEffect(() => {
    if (!loading && user) nav(isAdmin || isCR ? "/admin" : "/dashboard");
  }, [user, isAdmin, isCR, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signInWithRoll(roll, password, chosenMode);
    setSubmitting(false);
    if (error) return toast.error(error);
    try {
      localStorage.setItem("ll-remember", remember ? "1" : "0");
    } catch {}
    toast.success("Welcome back");
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
        {step === "role" ? (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 80 }}
            className="glass w-full max-w-md space-y-5 rounded-3xl p-7 glow-ring"
          >
            <div className="text-center">
              <h1 className="text-2xl font-bold">Choose your role</h1>
              <p className="text-xs text-foreground/70">Select how you want to sign in</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "admin", label: "Admin", icon: Shield, desc: "Full control" },
                { key: "cr", label: "CR", icon: UserCog, desc: "Class rep" },
                { key: "student", label: "Student", icon: GraduationCap, desc: "Student portal" },
              ] as const).map((r) => {
                const active = chosenMode === r.key;
                const Icon = r.icon;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setChosenMode(r.key)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition ${
                      active
                        ? "bg-primary text-primary-foreground glow-ring"
                        : "bg-muted/40 text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <div className="text-xs font-bold">{r.label}</div>
                    <div className="text-[10px] opacity-80">{r.desc}</div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setStep("form")}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              style={{ boxShadow: "0 0 30px var(--glow)" }}
            >
              Continue as {chosenMode === "admin" ? "Admin" : chosenMode === "cr" ? "CR" : "Student"}
            </button>
            <p className="text-center text-[11px] text-foreground/60">
              Admin can sign in via any role. CR can sign in as CR or Student.
            </p>
          </motion.div>
        ) : (
        <motion.form
          onSubmit={submit}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 80 }}
          className="glass w-full max-w-md space-y-5 rounded-3xl p-7 glow-ring"
        >
          <div className="text-center">
            <div className="mx-auto mb-2 inline-flex items-center gap-1.5 rounded-full bg-muted/40 px-3 py-1 text-[11px] uppercase tracking-wide">
              {chosenMode === "admin" ? <Shield className="h-3 w-3" /> : chosenMode === "cr" ? <UserCog className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
              {chosenMode} login
            </div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-xs text-foreground/70">Sign in to your department portal</p>
          </div>

          <Field icon={<User className="h-4 w-4" />} placeholder="Roll Number" value={roll} onChange={setRoll} />
          <Field icon={<Lock className="h-4 w-4" />} type="password" placeholder="Password" value={password} onChange={setPassword} />

          <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground/75">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 accent-[color:var(--primary)]"
            />
            Remember me on this device
          </label>

          <button
            disabled={submitting}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            style={{ boxShadow: "0 0 30px var(--glow)" }}
          >
            {submitting ? "Signing in..." : "Login"}
          </button>

          <button
            type="button"
            onClick={() => setStep("role")}
            className="w-full text-center text-[11px] text-foreground/70 underline-offset-2 hover:underline"
          >
            ← Change role
          </button>

          <p className="text-center text-[11px] text-foreground/60">
            No public registration. Accounts are created by admin.
          </p>
        </motion.form>
        )}
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