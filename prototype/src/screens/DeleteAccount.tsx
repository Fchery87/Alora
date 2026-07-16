import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/flows.css";

export function DeleteAccount({ onClose }: { onClose: () => void }) {
  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState(false);
  const fillRef = useRef<HTMLSpanElement>(null);

  // Emil hold-to-delete: slow deliberate fill on press (2s linear),
  // snappy snap-back on release (200ms ease-out).
  const onTransitionEnd = (e: React.TransitionEvent) => {
    if (e.propertyName === "clip-path" && holding) setDone(true);
  };

  return (
    <div className="flow">
      <div className="flow-bar">
        <span style={{ fontFamily: "var(--font-display)", fontSize: 19, color: "var(--ink)" }}>
          Delete account
        </span>
        <button className="flow-close" onClick={onClose} aria-label="Close">
          <Close />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div
            key="confirm"
            className="flow-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            <h1 className="danger-head">Before you go.</h1>
            <p className="ob-p" style={{ fontSize: "var(--t-body)", marginBottom: 22 }}>
              You're the owner of Maya's family. Here's exactly what happens:
            </p>

            <div className="consequence">
              <span className="dotmark" style={{ background: "var(--sleep)" }}><Swap /></span>
              <div className="ct"><b>Sam becomes the owner.</b> They keep full access to Maya's record so care isn't interrupted.</div>
            </div>
            <div className="consequence">
              <span className="dotmark" style={{ background: "var(--positive)" }}><Check /></span>
              <div className="ct"><b>Maya's shared history stays</b> with the family. Your name on past entries becomes "former caregiver."</div>
            </div>
            <div className="consequence">
              <span className="dotmark" style={{ background: "var(--danger)" }}><Trash /></span>
              <div className="ct"><b>Your check-ins and personal info are erased</b> permanently. This can't be undone.</div>
            </div>

            <div style={{ flex: 1, minHeight: 18 }} />

            <button
              className="hold"
              data-done={done}
              onPointerDown={() => setHolding(true)}
              onPointerUp={() => setHolding(false)}
              onPointerLeave={() => setHolding(false)}
              onPointerCancel={() => setHolding(false)}
            >
              <span
                ref={fillRef}
                className="fill"
                onTransitionEnd={onTransitionEnd}
                style={{
                  clipPath: holding ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
                  transition: holding
                    ? "clip-path 2000ms linear"
                    : "clip-path 200ms cubic-bezier(0.23,1,0.32,1)",
                }}
              />
              <span className="lbl">
                <Trash /> {holding ? "Keep holding…" : "Hold to delete"}
              </span>
            </button>
            <button className="flow-ghost" onClick={onClose}>Keep my account</button>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            className="flow-body"
            style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <motion.span
              className="dotmark"
              style={{ width: 64, height: 64, background: "var(--ink-soft)" }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
            >
              <Check size={30} />
            </motion.span>
            <h1 className="danger-head" style={{ marginTop: 20 }}>Account deleted.</h1>
            <p className="ob-p" style={{ fontSize: "var(--t-body)" }}>
              Ownership of Maya's family has passed to Sam. Take care of yourself.
            </p>
            <button className="flow-cta" style={{ marginTop: 26, background: "var(--ink)", maxWidth: 200 }} onClick={onClose}>
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
function Trash({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </svg>
  );
}
function Check({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
function Swap() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h13l-3-3M20 16H7l3 3" />
    </svg>
  );
}
