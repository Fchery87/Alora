import "../styles/screens.css";
import { Reveal } from "../components/Reveal";
import {
  MoonIcon,
  BellIcon,
  CloudIcon,
  CheckInIcon,
  ChevronRight,
  PlusIcon,
} from "../components/icons";

export function Settings({
  theme,
  onToggleTheme,
  onInvite,
  onDelete,
  onReplayOnboarding,
  onTrust,
  onReminders,
}: {
  theme: "dawn" | "night";
  onToggleTheme: () => void;
  onInvite: () => void;
  onDelete: () => void;
  onReplayOnboarding: () => void;
  onTrust: () => void;
  onReminders: () => void;
}) {
  const faint = { color: "var(--ink-faint)", display: "grid" } as const;
  return (
    <>
      <Reveal i={0}>
        <div className="scr-head">
          <h1 className="scr-title">Settings</h1>
          <p className="scr-sub">Maya's family · 2 caregivers</p>
        </div>
      </Reveal>

      {/* Caregivers */}
      <Reveal i={1}>
        <div className="set-group">
          <div className="gl">Caregivers</div>
          <div className="set-list">
            <div className="member">
              <span className="avatar" style={{ width: 38, height: 38, fontSize: 14, background: "var(--feed)" }}>A</span>
              <div>
                <div className="nm">Alex (you)</div>
                <div className="rl">alex@email.com</div>
              </div>
              <span className="role-tag" style={{ background: "var(--feed-tint)", color: "var(--feed)" }}>Owner</span>
            </div>
            <div className="member">
              <span className="avatar" style={{ width: 38, height: 38, fontSize: 14, background: "var(--sleep)" }}>S</span>
              <div>
                <div className="nm">Sam</div>
                <div className="rl">Joined 3 weeks ago</div>
              </div>
              <span className="role-tag" style={{ background: "var(--sleep-tint)", color: "var(--sleep)" }}>Partner</span>
            </div>
            <button className="set-row" style={{ width: "100%", textAlign: "left" }} onClick={onInvite}>
              <span className="ic" style={{ background: "var(--surface-2)", color: "var(--accent)" }}>
                <PlusIcon size={18} />
              </span>
              <span className="lbl">Invite a caregiver</span>
              <span style={faint}><ChevronRight size={18} stroke={2} /></span>
            </button>
          </div>
        </div>
      </Reveal>

      {/* Preferences */}
      <Reveal i={2}>
        <div className="set-group">
          <div className="gl">Preferences</div>
          <div className="set-list">
            <button className="set-row" style={{ width: "100%", textAlign: "left" }} onClick={onToggleTheme}>
              <span className="ic" style={{ background: "var(--sleep-tint)", color: "var(--sleep)" }}>
                <MoonIcon size={18} />
              </span>
              <span className="lbl">Night mode</span>
              <span className="switch" data-on={theme === "night"}>
                <span className="knob" />
              </span>
            </button>
            <button className="set-row" style={{ width: "100%", textAlign: "left" }} onClick={onReminders}>
              <span className="ic" style={{ background: "var(--feed-tint)", color: "var(--feed)" }}>
                <BellIcon size={18} />
              </span>
              <span className="lbl">Reminders &amp; quiet hours</span>
              <span className="val">10pm–6am</span>
              <span style={faint}><ChevronRight size={18} stroke={2} /></span>
            </button>
            <button className="set-row" style={{ width: "100%", textAlign: "left" }} onClick={onReplayOnboarding}>
              <span className="ic" style={{ background: "var(--surface-2)", color: "var(--ink-soft)" }}>
                <PlayGlyph />
              </span>
              <span className="lbl">View intro again</span>
              <span style={faint}><ChevronRight size={18} stroke={2} /></span>
            </button>
          </div>
        </div>
      </Reveal>

      {/* Privacy & trust */}
      <Reveal i={3}>
        <div className="set-group">
          <div className="gl">Privacy &amp; trust</div>
          <div className="set-list">
            <button className="set-row" style={{ width: "100%", textAlign: "left" }} onClick={onTrust}>
              <span className="ic" style={{ background: "var(--diaper-tint)", color: "var(--diaper)" }}>
                <CheckInIcon size={18} />
              </span>
              <span className="lbl">Who can see what</span>
              <span style={faint}><ChevronRight size={18} stroke={2} /></span>
            </button>
            <div className="set-row">
              <span className="ic" style={{ background: "var(--surface-2)", color: "var(--ink-soft)" }}>
                <CloudIcon size={18} />
              </span>
              <span className="lbl">Export my data</span>
              <span className="val">JSON</span>
              <span style={faint}><ChevronRight size={18} stroke={2} /></span>
            </div>
            <button className="set-row" style={{ width: "100%", textAlign: "left" }} onClick={onDelete}>
              <span className="ic" style={{ background: "color-mix(in srgb, var(--danger) 14%, transparent)", color: "var(--danger)" }}>
                <TrashGlyph />
              </span>
              <span className="lbl" style={{ color: "var(--danger)" }}>Delete account</span>
              <span style={faint}><ChevronRight size={18} stroke={2} /></span>
            </button>
          </div>
        </div>
      </Reveal>

      <Reveal i={4}>
        <p className="disclaimer" style={{ marginTop: 24 }}>
          Baby data is shared with your family. Check-ins are private to you.
          <br /> Alora · Quiet Dawn prototype
        </p>
      </Reveal>
    </>
  );
}

function TrashGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </svg>
  );
}
function PlayGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}
