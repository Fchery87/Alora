import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Staggered entrance for a column of cards. Keep delays short (Emil: 30–80ms). */
export function Reveal({
  i = 0,
  children,
  style,
  className,
}: {
  i?: number;
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.23, 1, 0.32, 1], delay: 0.04 + i * 0.05 }}
    >
      {children}
    </motion.div>
  );
}
