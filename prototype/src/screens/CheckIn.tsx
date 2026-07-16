import { useState } from "react";
import "../styles/screens.css";
import { Reveal } from "../components/Reveal";
import { CheckInIcon, ChevronRight } from "../components/icons";

const MOODS = [
  { face: "😞", label: "Low" },
  { face: "😕", label: "Tired" },
  { face: "😐", label: "Okay" },
  { face: "🙂", label: "Good" },
  { face: "😊", label: "Great" },
];

export function CheckIn() {
  const [mood, setMood] = useState<number | null>(null);

  return (
    <>
      <Reveal i={0}>
        <div className="scr-head">
          <h1 className="scr-title">Check-In</h1>
          <p className="scr-sub">A quiet moment, just for you.</p>
        </div>
      </Reveal>

      <Reveal i={1}>
        <div className="ci-card">
          <span className="private-pill">
            <LockGlyph /> Private · only you can see this
          </span>
          <h2 className="ci-q">How are you doing today?</h2>
          <p className="ci-sub">No streaks, no scores. Just a check-in.</p>

          <div className="moods">
            {MOODS.map((m, i) => (
              <button key={m.label} className="mood" data-on={mood === i} onClick={() => setMood(i)}>
                <span className="face">{m.face}</span>
                <span className="ml">{m.label}</span>
              </button>
            ))}
          </div>

          <textarea
            className="reflect"
            placeholder="Anything on your mind? (optional)"
            rows={3}
          />

          <button
            className="cta"
            style={{ background: "var(--diaper)", position: "static", marginTop: 18, opacity: mood === null ? 0.5 : 1 }}
          >
            {mood === null ? "Pick a mood to continue" : "Save check-in"}
            {mood !== null && <ChevronRight size={18} stroke={2.4} />}
          </button>
        </div>
      </Reveal>

      {/* Always-available support — non-triggered, non-clinical */}
      <Reveal i={2}>
        <div className="support">
          <div className="sh">
            <span style={{ color: "var(--diaper)" }}><CheckInIcon size={22} /></span>
            <span className="st">Support, whenever you need it</span>
          </div>
          <p className="sd">
            Early parenthood is a lot. If you'd like to talk to someone, these free,
            confidential lines are always here — no diagnosis, no judgment.
          </p>

          <button className="resource">
            <span style={{ color: "var(--diaper)", fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 18 }}>988</span>
            <div style={{ flex: 1 }}>
              <div className="rt">988 Suicide &amp; Crisis Lifeline</div>
              <div className="rd">Call or text, 24/7 · US</div>
            </div>
            <ChevronRight size={18} stroke={2} />
          </button>

          <button className="resource">
            <span style={{ color: "var(--diaper)", fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 13 }}>PSI</span>
            <div style={{ flex: 1 }}>
              <div className="rt">Postpartum Support International</div>
              <div className="rd">Helpline 1-800-944-4773 · call or text</div>
            </div>
            <ChevronRight size={18} stroke={2} />
          </button>
        </div>
      </Reveal>

      <Reveal i={3}>
        <p className="disclaimer">
          Alora is not a medical or crisis service and does not provide diagnosis or
          treatment. If you're in immediate danger, call your local emergency number.
        </p>
      </Reveal>
    </>
  );
}

function LockGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
