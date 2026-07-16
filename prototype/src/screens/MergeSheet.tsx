import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "../styles/flows.css";
import { FeedIcon } from "../components/icons";

type Pick = "sam" | "you";
type Result = null | "merged" | "kept";

const OPTIONS: Record<Pick, { by: string; initial: string; color: string; when: string; detail: string; badge?: string }> = {
  sam: { by: "Sam", initial: "S", color: "var(--sleep)", when: "7:30 am", detail: "Bottle · 120 ml · 18 min", badge: "More complete" },
  you: { by: "You", initial: "Y", color: "var(--feed)", when: "7:32 am", detail: "Bottle · 120 ml", badge: "Edited" },
};

export function MergeSheet({ onClose }: { onClose: () => void }) {
  const [pick, setPick] = useState<Pick>("sam");
  const [result, setResult] = useState<Result>(null);

  return (
    <div className="flow">
      <div className="flow-bar">
        <span style={{ fontFamily: "var(--font-display)", fontSize: 19, color: "var(--ink)" }}>
          Possible duplicate
        </span>
        <button className="flow-close" onClick={onClose} aria-label="Close">
          <Close />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {result === null ? (
          <motion.div
            key="choose"
            className="flow-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="merge-banner">
              <span className="ic" style={{ background: "var(--feed-tint)", color: "var(--feed)" }}>
                <FeedIcon size={20} />
              </span>
              <p className="ob-p" style={{ marginTop: 0, fontSize: "var(--t-body)" }}>
                You and Sam both logged a bottle around 7:30 am. Keep both, or merge into a
                single entry?
              </p>
            </div>

            <div className="field-label" style={{ marginTop: 22 }}>If merging, keep</div>
            {(Object.keys(OPTIONS) as Pick[]).map((k) => {
              const o = OPTIONS[k];
              return (
                <button key={k} className="merge-opt" data-on={pick === k} onClick={() => setPick(k)}>
                  <span className="merge-radio"><span /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="merge-who">
                      <span className="avatar" style={{ width: 20, height: 20, fontSize: 10, background: o.color }}>{o.initial}</span>
                      <span className="nm">{o.by}</span>
                      <span className="merge-when tnum">{o.when}</span>
                    </div>
                    <div className="merge-det">{o.detail}</div>
                    {o.badge && (
                      <span className="merge-badge" style={{ background: "color-mix(in srgb, " + o.color + " 14%, transparent)", color: o.color }}>
                        {o.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            <div style={{ flex: 1, minHeight: 20 }} />

            <button className="flow-cta" style={{ background: "var(--feed)" }} onClick={() => setResult("merged")}>
              Merge into one entry
            </button>
            <button className="flow-ghost" onClick={() => setResult("kept")}>
              Keep both — they're different feeds
            </button>
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
              className="merge-radio"
              style={{ width: 64, height: 64, border: "none", background: result === "merged" ? "var(--feed)" : "var(--positive)", color: "#fff" }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
            >
              <Check />
            </motion.span>
            <h1 className="danger-head" style={{ marginTop: 20 }}>
              {result === "merged" ? "Merged into one" : "Kept both"}
            </h1>
            <p className="ob-p" style={{ fontSize: "var(--t-body)" }}>
              {result === "merged"
                ? `Sam's entry was kept and the duplicate removed. The timeline now shows one bottle at 7:30 am.`
                : "Both entries stay on the timeline. The duplicate flag is cleared."}
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
function Check() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
