import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LogIn, Users } from "lucide-react";

export function FloatingNav() {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 80 }}
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 gap-3 sm:bottom-8"
    >
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity }}>
        <Link
          to="/login"
          className="glass flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-foreground transition hover:scale-105"
          style={{ boxShadow: "0 0 30px var(--glow)" }}
        >
          <LogIn className="h-4 w-4" /> Login
        </Link>
      </motion.div>
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}>
        <a
          href="#students"
          className="glass flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-foreground transition hover:scale-105"
          style={{ boxShadow: "0 0 30px var(--glow)" }}
        >
          <Users className="h-4 w-4" /> Students
        </a>
      </motion.div>
    </motion.div>
  );
}