import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "../styles/flows.css";
import { ChevronRight } from "../components/icons";

const OUT = [0.23, 1, 0.32, 1] as const;

const stepVariants = {
  enter: (d: number) => ({ opacity: 0, x: d * 36, filter: "blur(4px)" }),
  center: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: (d: number) => ({ opacity: 0, x: d * -28, filter: "blur(4px)" }),
};

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const total = 4;

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };
  const next = () => (step < total - 1 ? go(step + 1) : onDone());
  const back = () => (step > 0 ? go(step - 1) : onDone());

  return (
    <div className="flow">
      <div className="flow-bar">
        <button className="flow-back" onClick={back} aria-label="Back">
          <Arrow />
        </button>
        <div className="dots">
          {Array.from({ length: total }).map((_, i) => (
            <i key={i} data-on={i === step} />
          ))}
        </div>
        <button className="flow-back" style={{ opacity: 0, pointerEvents: "none" }} aria-hidden />
      </div>

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.div
          key={step}
          className="flow-body"
          custom={dir}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.32, ease: OUT }}
        >
          {step === 0 && <Welcome />}
          {step === 1 && <Privacy />}
          {step === 2 && <BabySetup />}
          {step === 3 && <InviteStep />}
        </motion.div>
      </AnimatePresence>

      <div className="flow-foot">
        <button className="flow-cta" onClick={next}>
          {step === 0 ? "Get started" : step === total - 1 ? "Enter Alora" : "Continue"}
          <ChevronRight size={18} stroke={2.4} />
        </button>
        {step === total - 1 && (
          <button className="flow-ghost" onClick={onDone}>
            I'll invite Sam later
          </button>
        )}
      </div>
    </div>
  );
}

function Welcome() {
  return (
    <div className="ob-step">
      <div className="ob-art">
        <div className="ob-orb">
          {[150, 116, 84].map((s, i) => (
            <motion.span
              key={s}
              className="ring"
              style={{ width: s, height: s }}
              animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.3, 0.6] }}
              transition={{ duration: 4.5 + i, ease: "easeInOut", repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
          <span className="glow" />
        </div>
      </div>
      <div>
        <h1 className="ob-hero-mark">Alora</h1>
        <p className="ob-p">
          A calm, shared home for the first months — fast logging, easy handoffs,
          and a quiet moment for you.
        </p>
      </div>
    </div>
  );
}

function Privacy() {
  return (
    <div className="ob-step">
      <h1 className="ob-h">What's shared,<br /> and what's yours.</h1>
      <p className="ob-p" style={{ marginBottom: 22 }}>
        Two clear boundaries. No surprises.
      </p>
      <div className="trust-card">
        <span className="ic" style={{ background: "var(--feed-tint)", color: "var(--feed)" }}>
          <Users />
        </span>
        <div>
          <div className="tt">Shared with your family</div>
          <div className="td">Feeds, diapers, sleep, and the timeline — so both caregivers always see the same picture.</div>
        </div>
      </div>
      <div className="trust-card">
        <span className="ic" style={{ background: "var(--diaper-tint)", color: "var(--diaper)" }}>
          <Lock />
        </span>
        <div>
          <div className="tt">Private to you</div>
          <div className="td">Your daily check-ins and reflections never leave your account — your partner can't see them.</div>
        </div>
      </div>
    </div>
  );
}

function BabySetup() {
  const [name, setName] = useState("Maya");
  const [age, setAge] = useState("0–3 mo");
  return (
    <div className="ob-step">
      <h1 className="ob-h">Tell us about<br /> your baby.</h1>
      <p className="ob-p" style={{ marginBottom: 24 }}>Just enough to start logging. The rest can wait.</p>

      <label className="field-label" style={{ marginTop: 0 }}>Name</label>
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Baby's name" />

      <label className="field-label">Age</label>
      <div className="chips">
        {["0–3 mo", "3–6 mo", "6–9 mo"].map((a) => (
          <button
            key={a}
            className="chip"
            data-on={age === a}
            onClick={() => setAge(a)}
            style={age === a ? { borderColor: "var(--accent)", color: "var(--ink)" } : undefined}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

function InviteStep() {
  return (
    <div className="ob-step">
      <div className="ob-art" style={{ minHeight: 140 }}>
        <div style={{ display: "flex", alignItems: "center", gap: -8 }}>
          <span className="avatar" style={{ width: 64, height: 64, fontSize: 24, background: "var(--feed)" }}>A</span>
          <span style={{ width: 28, height: 2, background: "var(--line-strong)" }} />
          <span className="avatar" style={{ width: 64, height: 64, fontSize: 24, background: "var(--sleep)", opacity: 0.55, borderStyle: "dashed" }}>+</span>
        </div>
      </div>
      <h1 className="ob-h">Care is easier<br /> together.</h1>
      <p className="ob-p">
        Invite one more caregiver. They'll see the same baby record and you'll
        always know who did what.
      </p>
    </div>
  );
}

/* glyphs */
function Arrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
function Users() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-2.3-4.5" />
    </svg>
  );
}
function Lock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
