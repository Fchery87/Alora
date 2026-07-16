import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/flows.css";
import { ChevronRight } from "../components/icons";

export function Invite({ onClose }: { onClose: () => void }) {
  const [revoked, setRevoked] = useState(false);

  return (
    <div className="flow">
      <div className="flow-bar">
        <span style={{ fontFamily: "var(--font-display)", fontSize: 19, color: "var(--ink)" }}>
          Invite a caregiver
        </span>
        <button className="flow-close" onClick={onClose} aria-label="Close">
          <Close />
        </button>
      </div>

      <div className="flow-body">
        <p className="ob-p" style={{ marginTop: 0, fontSize: "var(--t-body)" }}>
          Share this code with someone you trust to add them to Maya's family.
        </p>

        <AnimatePresence mode="wait">
          {!revoked ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="code-card">
                <div className="eyebrow" style={{ marginBottom: 12 }}>Invite code</div>
                <div className="code tnum">A7-K9P</div>
                <div className="code-meta">
                  <Clock /> Expires in 24h · single use
                </div>
                <div className="qr" aria-hidden>
                  <QrArt />
                </div>
              </div>

              <button className="flow-cta" style={{ marginTop: 18 }}>
                <Share /> Share invite link
              </button>
              <button className="flow-ghost" style={{ color: "var(--danger)" }} onClick={() => setRevoked(true)}>
                Revoke this code
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="revoked"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="code-card" style={{ background: "var(--surface)" }}>
                <div
                  className="code"
                  style={{ fontSize: 26, letterSpacing: 0, color: "var(--ink-soft)", paddingLeft: 0 }}
                >
                  Code revoked
                </div>
                <p className="ob-p" style={{ fontSize: "var(--t-body)", marginTop: 8 }}>
                  That code can no longer be used. Generate a fresh one whenever you're ready.
                </p>
              </div>
              <button className="flow-cta" style={{ marginTop: 18 }} onClick={() => setRevoked(false)}>
                Generate new code <ChevronRight size={18} stroke={2.4} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="disclaimer" style={{ marginTop: 22 }}>
          Invite codes are single-use and time-limited. You can revoke an unused code at any time.
        </p>
      </div>
    </div>
  );
}

function Close() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
function Clock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function Share() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" />
      <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}
function QrArt() {
  // decorative pseudo-QR
  const cells = Array.from({ length: 49 });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, width: "100%", height: "100%" }}>
      {cells.map((_, i) => {
        const on = [0, 1, 2, 6, 7, 8, 12, 14, 16, 18, 20, 24, 28, 30, 33, 36, 40, 42, 46, 47, 48, 5, 11, 23, 35].includes(i);
        return (
          <span
            key={i}
            style={{ background: on ? "var(--ink)" : "transparent", borderRadius: 2 }}
          />
        );
      })}
    </div>
  );
}
