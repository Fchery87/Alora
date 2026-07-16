import { useState } from "react";
import "../styles/flows.css";
import "../styles/screens.css";
import { Reveal } from "../components/Reveal";
import { MoonIcon, FeedIcon, DiaperIcon, SleepIcon } from "../components/icons";

export function Reminders({ onClose }: { onClose: () => void }) {
  const [reminders, setReminders] = useState({ feed: true, diaper: false, bedtime: true });
  const toggle = (k: keyof typeof reminders) => setReminders((r) => ({ ...r, [k]: !r[k] }));

  return (
    <div className="flow">
      <div className="flow-bar">
        <span style={{ fontFamily: "var(--font-display)", fontSize: 19, color: "var(--ink)" }}>
          Reminders &amp; quiet hours
        </span>
        <button className="flow-close" onClick={onClose} aria-label="Close">
          <Close />
        </button>
      </div>

      <div className="flow-body">
        {/* Quiet hours */}
        <Reveal i={0}>
          <div className="quiet-card">
            <div className="quiet-head">
              <span className="ic" style={{ background: "var(--sleep-tint)", color: "var(--sleep)" }}>
                <MoonIcon size={18} />
              </span>
              <div style={{ flex: 1 }}>
                <div className="nm">Quiet hours</div>
                <div className="rl">No reminders will fire</div>
              </div>
              <span className="switch" data-on="true"><span className="knob" /></span>
            </div>
            <div className="quiet-band" aria-hidden>
              <span className="fill" style={{ left: "0%", width: "25%" }} />
              <span className="fill" style={{ left: "83.3%", width: "16.7%" }} />
              <span className="marks">
                {["12a", "6a", "12p", "6p", "12a"].map((m) => <i key={m}>{m}</i>)}
              </span>
            </div>
            <div className="quiet-range">10:00 PM&nbsp; — &nbsp;6:00 AM</div>
          </div>
        </Reveal>

        {/* Reminders */}
        <Reveal i={1}>
          <div className="set-group">
            <div className="gl">Reminders</div>
            <div className="set-list">
              <ReminderRow on={reminders.feed} onToggle={() => toggle("feed")} tint="var(--feed-tint)" fg="var(--feed)" title="Feed reminder" sub="If no feed logged in 3h" Icon={FeedIcon} />
              <ReminderRow on={reminders.diaper} onToggle={() => toggle("diaper")} tint="var(--diaper-tint)" fg="var(--diaper)" title="Diaper check" sub="Every 3 hours" Icon={DiaperIcon} />
              <ReminderRow on={reminders.bedtime} onToggle={() => toggle("bedtime")} tint="var(--sleep-tint)" fg="var(--sleep)" title="Bedtime routine" sub="Daily at 8:30 PM" Icon={SleepIcon} />
            </div>
          </div>
        </Reveal>

        <Reveal i={2}>
          <p className="disclaimer" style={{ marginTop: 20 }}>
            Alora uses on-device notifications only — reminders are scheduled on your phone,
            nothing is sent from a server.
          </p>
        </Reveal>
      </div>
    </div>
  );
}

function ReminderRow({
  on,
  onToggle,
  tint,
  fg,
  title,
  sub,
  Icon,
}: {
  on: boolean;
  onToggle: () => void;
  tint: string;
  fg: string;
  title: string;
  sub: string;
  Icon: typeof FeedIcon;
}) {
  return (
    <button className="member" style={{ width: "100%", textAlign: "left", background: "none" }} onClick={onToggle}>
      <span className="ic" style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", background: tint, color: fg, display: "grid", placeItems: "center", flex: "none" }}>
        <Icon size={18} />
      </span>
      <div style={{ flex: 1 }}>
        <div className="nm">{title}</div>
        <div className="rl">{sub}</div>
      </div>
      <span className="switch" data-on={on}><span className="knob" /></span>
    </button>
  );
}

function Close() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
