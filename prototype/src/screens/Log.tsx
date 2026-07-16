import { useState } from "react";
import { motion } from "framer-motion";
import "../styles/screens.css";
import { Reveal } from "../components/Reveal";
import { FeedIcon, DiaperIcon, SleepIcon, PlusIcon, ChevronRight } from "../components/icons";
import type { EventType } from "../data/mock";

const TYPES: { id: EventType; label: string; Icon: typeof FeedIcon; color: string }[] = [
  { id: "feed", label: "Feed", Icon: FeedIcon, color: "var(--feed)" },
  { id: "diaper", label: "Diaper", Icon: DiaperIcon, color: "var(--diaper)" },
  { id: "sleep", label: "Sleep", Icon: SleepIcon, color: "var(--sleep)" },
];

const SUBTYPES: Record<EventType, string[]> = {
  feed: ["Breast", "Bottle", "Pumping"],
  diaper: ["Wet", "Dirty", "Mixed"],
  sleep: ["Nap", "Night"],
};

export function Log() {
  const [type, setType] = useState<EventType>("feed");
  const [sub, setSub] = useState("Bottle");
  const [amount, setAmount] = useState(120);
  const active = TYPES.find((t) => t.id === type)!;

  const pickType = (t: EventType) => {
    setType(t);
    setSub(SUBTYPES[t][0]);
  };

  return (
    <>
      <Reveal i={0}>
        <div className="scr-head">
          <div className="scr-head-row">
            <div>
              <h1 className="scr-title">Log</h1>
              <p className="scr-sub">One hand, a few taps.</p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Type selector */}
      <Reveal i={1}>
        <div className="seg" style={{ position: "relative" }}>
          {TYPES.map((t) => {
            const on = t.id === type;
            return (
              <button key={t.id} data-on={on} onClick={() => pickType(t.id)}>
                {on && (
                  <motion.span
                    layoutId="seg-slider"
                    className="slider"
                    style={{ background: t.color, left: 0, right: 0 }}
                    transition={{ type: "spring", duration: 0.45, bounce: 0.18 }}
                  />
                )}
                <t.Icon size={22} stroke={on ? 2 : 1.6} />
                {t.label}
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* Repeat last */}
      <Reveal i={2}>
        <div className="repeat">
          <span className="ic" style={{ background: "var(--feed-tint)", color: "var(--feed)" }}>
            <FeedIcon size={20} />
          </span>
          <div>
            <div className="t1">Repeat last</div>
            <div className="t2">Bottle · 120 ml · Sam, 2h ago</div>
          </div>
          <button className="go press">Repeat</button>
        </div>
      </Reveal>

      {/* Subtype */}
      <Reveal i={3}>
        <div>
          <div className="field-label">{type === "diaper" ? "Type" : type === "sleep" ? "Kind" : "Method"}</div>
          <div className="chips">
            {SUBTYPES[type].map((s) => {
              const on = s === sub;
              return (
                <button
                  key={s}
                  className="chip"
                  data-on={on}
                  onClick={() => setSub(s)}
                  style={on ? { borderColor: active.color, background: "color-mix(in srgb," + " var(--surface) 100%, transparent)" } : undefined}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* Contextual body */}
      {type === "feed" && (
        <Reveal i={4}>
          <div>
            <div className="field-label">Amount</div>
            <div className="stepper">
              <button onClick={() => setAmount((a) => Math.max(0, a - 10))} aria-label="less">
                <span style={{ fontSize: 24, lineHeight: 1 }}>−</span>
              </button>
              <div className="val tnum">
                {amount}
                <small>ml</small>
              </div>
              <button onClick={() => setAmount((a) => a + 10)} aria-label="more">
                <PlusIcon size={20} stroke={2} />
              </button>
            </div>
          </div>
        </Reveal>
      )}

      {type === "sleep" && (
        <Reveal i={4}>
          <div className="timer-card">
            <div className="eyebrow" style={{ color: "var(--sleep)" }}>Timer running</div>
            <div className="tnum big" style={{ marginTop: 8 }}>00:12:46</div>
            <p className="scr-sub" style={{ marginTop: 6 }}>Stays running even offline · saved on this device</p>
          </div>
        </Reveal>
      )}

      {type === "diaper" && (
        <Reveal i={4}>
          <div>
            <div className="field-label">Note (optional)</div>
            <div className="chips">
              {["No rash", "A little rash", "Leaked"].map((s) => (
                <button key={s} className="chip">{s}</button>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      <Reveal i={5}>
        <button className="cta" style={{ background: active.color }}>
          {type === "sleep" ? "Stop & save sleep" : `Save ${sub.toLowerCase()}`}
          <ChevronRight size={18} stroke={2.4} />
        </button>
      </Reveal>
    </>
  );
}
