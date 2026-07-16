import "../styles/flows.css";
import "../styles/screens.css";
import { Reveal } from "../components/Reveal";

export function TrustCenter({ onClose }: { onClose: () => void }) {
  return (
    <div className="flow">
      <div className="flow-bar">
        <span style={{ fontFamily: "var(--font-display)", fontSize: 19, color: "var(--ink)" }}>
          Who can see what
        </span>
        <button className="flow-close" onClick={onClose} aria-label="Close">
          <Close />
        </button>
      </div>

      <div className="flow-body">
        <p className="ob-p" style={{ marginTop: 0, fontSize: "var(--t-body)", marginBottom: 6 }}>
          Two simple boundaries — here's exactly where everything lives.
        </p>

        <Reveal i={0}>
          <div className="set-group">
            <div className="gl" style={{ color: "var(--feed)" }}>Shared with your family</div>
            <div className="set-list">
              <TrustRow title="Feeds, diapers & sleep" sub="Every logged event" who="You + Sam" tone="feed" />
              <TrustRow title="Timeline & history" sub="Who did what, when" who="You + Sam" tone="feed" />
              <TrustRow title="Maya's profile" sub="Name, age, basics" who="You + Sam" tone="feed" />
            </div>
          </div>
        </Reveal>

        <Reveal i={1}>
          <div className="set-group">
            <div className="gl" style={{ color: "var(--diaper)" }}>Private to you</div>
            <div className="set-list">
              <TrustRow title="Daily check-ins" sub="Your mood entries" who="Only you" tone="diaper" />
              <TrustRow title="Reflections" sub="Anything you write" who="Only you" tone="diaper" />
            </div>
          </div>
        </Reveal>

        <Reveal i={2}>
          <div className="set-group">
            <div className="gl">Owner only</div>
            <div className="set-list">
              <TrustRow title="Account & family settings" sub="Invites, deletion, roles" who="Owner" tone="neutral" />
            </div>
          </div>
        </Reveal>

        <Reveal i={3}>
          <p className="disclaimer" style={{ marginTop: 20 }}>
            Your check-ins are stored privately and never sync to another caregiver's device —
            not even Sam's.
          </p>
        </Reveal>
      </div>
    </div>
  );
}

function TrustRow({
  title,
  sub,
  who,
  tone,
}: {
  title: string;
  sub: string;
  who: string;
  tone: "feed" | "diaper" | "neutral";
}) {
  const map = {
    feed: { bg: "var(--feed-tint)", fg: "var(--feed)" },
    diaper: { bg: "var(--diaper-tint)", fg: "var(--diaper)" },
    neutral: { bg: "var(--surface-2)", fg: "var(--ink-soft)" },
  }[tone];
  return (
    <div className="member">
      <span className="ic" style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", background: map.bg, color: map.fg, display: "grid", placeItems: "center", flex: "none" }}>
        {tone === "diaper" ? <Lock /> : tone === "feed" ? <Users /> : <Key />}
      </span>
      <div>
        <div className="nm">{title}</div>
        <div className="rl">{sub}</div>
      </div>
      <span className="role-tag" style={{ background: map.bg, color: map.fg }}>{who}</span>
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
function Users() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.2a3 3 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-2.3-4.5" />
    </svg>
  );
}
function Lock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function Key() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="15" r="3.5" />
      <path d="M10.5 12.5 19 4M16 7l2 2M14 9l1.5 1.5" />
    </svg>
  );
}
