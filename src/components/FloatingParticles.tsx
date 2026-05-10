import { motion } from "framer-motion";
import { useMemo } from "react";

export function FloatingParticles({ count = 20 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        size: 2 + Math.random() * 6,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: 8 + Math.random() * 12,
        delay: Math.random() * 5,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [-30, 30, -30], opacity: [0, 0.7, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: "var(--secondary)",
            boxShadow: "0 0 12px var(--glow)",
          }}
        />
      ))}
    </div>
  );
}