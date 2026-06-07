import { createFileRoute, Link, Navigate } from "@/lib/navigation";
import { motion } from "framer-motion";
import { FloatingNav } from "@/components/FloatingNav";
import { HamburgerMenu } from "@/components/HamburgerMenu";
import { FloatingParticles } from "@/components/FloatingParticles";
import cover from "@/assets/cover.jpg";
import logo from "@/assets/logo.png";
import { Scale, BookOpen, Sparkles, Award, Heart, Users, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Department of Law and Land Administration — Islamic University, Bangladesh" },
      {
        name: "description",
        content:
          "Official portal of the Department of Law and Land Administration, Islamic University, Bangladesh — academic excellence, research and student community.",
      },
      { property: "og:title", content: "Law and Land Administration — Islamic University" },
      {
        property: "og:description",
        content: "A premium academic platform for the Department of Law and Land Administration.",
      },
    ],
  }),
  component: Home,
});

export default function Home() {
  const { user, loading, isAdmin, isCR } = useAuth();
  if (!loading && user) {
    return <Navigate to={isAdmin || isCR ? "/admin" : "/dashboard"} />;
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative h-[100svh] w-full overflow-hidden">
        <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        <FloatingParticles count={28} />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.img
            src={logo}
            alt="Department logo"
            initial={{ scale: 0.6, opacity: 0, rotate: -30 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 70, delay: 0.1 }}
            className="h-28 w-28 rounded-full glow-ring sm:h-36 sm:w-36"
          />
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 max-w-3xl text-3xl font-black leading-tight sm:text-5xl md:text-6xl"
          >
            <span className="text-gradient">Department of Law &amp; Land Administration</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 max-w-xl text-sm text-foreground/80 sm:text-base"
          >
            Islamic University, Bangladesh · সংবিধি-৮
          </motion.p>
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute bottom-24 text-xs text-foreground/60"
          >
            ↓ scroll to explore ↓
          </motion.div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="relative px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl space-y-10">
          <Reveal>
            <h2 className="text-center text-3xl font-bold sm:text-4xl">
              About <span className="text-gradient">the Department</span>
            </h2>
          </Reveal>
          <Reveal>
            <div className="glass rounded-2xl p-6 leading-relaxed text-foreground/85 sm:p-8">
              The Department of Law and Land Administration at Islamic University, Bangladesh is committed to academic
              excellence, professional integrity, and research-driven education in the fields of legal studies and land
              governance. The department strives to produce competent graduates equipped with analytical skills, ethical
              values, leadership qualities, and practical expertise necessary to address contemporary legal and
              administrative challenges. Through an innovative academic environment, the department aims to contribute to
              the development of justice, sustainable land management, and responsible public administration.
            </div>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2">
            {missions.map((m, i) => (
              <Reveal key={m.title} delay={i * 0.08}>
                <div className="glass group h-full rounded-2xl p-6 transition hover:-translate-y-1">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/30 text-secondary">
                    <m.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{m.title}</h3>
                  <p className="mt-2 text-sm text-foreground/75">{m.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="glass rounded-2xl p-6 sm:p-8">
              <h3 className="text-xl font-bold">Vision</h3>
              <p className="mt-2 text-foreground/85">
                To become a nationally and internationally recognized center of excellence in legal education, land
                administration, research, and academic innovation through integrity, professionalism, and intellectual
                advancement.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="glass rounded-2xl p-6 sm:p-8">
              <h3 className="mb-3 text-xl font-bold">Importance of Law &amp; Land Administration</h3>
              <ul className="grid list-disc gap-2 pl-5 text-sm text-foreground/85 sm:grid-cols-2">
                <li>Advancement of legal knowledge and judicial awareness</li>
                <li>Development of efficient land management systems</li>
                <li>Strengthening governance and public administration</li>
                <li>Promotion of justice, ethics, and human rights</li>
                <li>Contribution to national development and policy improvement</li>
                <li>Sustainable and transparent administrative practices</li>
              </ul>
            </div>
          </Reveal>

          <Reveal>
            <div className="glass rounded-2xl p-6 italic text-foreground/85 sm:p-8">
              “Our department is dedicated to nurturing future professionals, scholars, and leaders through quality
              education, ethical values, research excellence, and practical knowledge in law and land administration.”
              <div className="mt-3 text-xs not-italic text-secondary">— Faculty Message</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA to students page */}
      <section className="relative px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="glass flex flex-col items-center gap-4 rounded-3xl p-8 text-center sm:p-12">
              <Users className="h-10 w-10 text-secondary" />
              <h2 className="text-2xl font-bold sm:text-3xl">
                Meet our <span className="text-gradient">students</span>
              </h2>
              <p className="max-w-xl text-sm text-foreground/75">
                Browse profiles of the talented learners shaping the future of law and land administration.
              </p>
              <Link
                to="/students"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                style={{ boxShadow: "0 0 30px var(--glow)" }}
              >
                View Students <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-border/30 px-4 py-8 text-center text-xs text-foreground/60">
        © {new Date().getFullYear()} Department of Law and Land Administration · Islamic University, Bangladesh
      </footer>

      <FloatingNav />
      <HamburgerMenu />
    </div>
  );
}

const missions = [
  { title: "Academic Excellence", body: "Quality education in law, land administration, and governance.", icon: BookOpen },
  { title: "Ethical Leadership", body: "Integrity, professionalism, critical thinking and leadership.", icon: Award },
  { title: "Research & Innovation", body: "Advanced research, policy analysis and innovative legal study.", icon: Sparkles },
  { title: "Social Responsibility", body: "Legal awareness, justice, human rights and sustainable land use.", icon: Heart },
  { title: "Justice & Governance", body: "Contributing to a transparent, fair administrative ecosystem.", icon: Scale },
  { title: "Future Ready", body: "Empowering graduates for national and global contribution.", icon: Sparkles },
];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}
