import "../styles/screens.css";
import { Reveal } from "../components/Reveal";
import {
  eventIcon,
  eventColorVar,
  eventTintVar,
  TimelineIcon,
} from "../components/icons";
import { clockLabel, type CareEvent } from "../data/mock";
import { useTimeline } from "../data/useData";

export function Timeline({ onOpenMerge }: { onOpenMerge: () => void }) {
  const { status, data, reload } = useTimeline();

  return (
    <>
      <Reveal i={0}>
        <div className="scr-head">
          <h1 className="scr-title">Timeline</h1>
          <p className="scr-sub">Everything, in order — who and when.</p>
        </div>
      </Reveal>

      {status === "loading" && <TimelineSkeleton />}
      {status === "error" && <ErrorState onRetry={reload} />}
      {status === "ready" && data.length === 0 && <EmptyState />}
      {status === "ready" && data.length > 0 && (
        <>
          <Reveal i={1}>
            <div className="day-label">Today</div>
          </Reveal>
          <div className="tl">
            {data.map((e, idx) => (
              <Reveal key={e.id} i={2 + idx}>
                <TimelineItem e={e} />
                {e.duplicateOf && <DuplicateChip e={e} onMerge={onOpenMerge} />}
              </Reveal>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function TimelineItem({ e }: { e: CareEvent }) {
  const Icon = eventIcon[e.type];
  const isMe = e.by === "You";
  return (
    <div className="tl-item">
      <div className="tl-rail">
        <span className="tl-node" style={{ background: eventTintVar[e.type], color: eventColorVar[e.type] }}>
          <Icon size={20} />
        </span>
        <span className="tl-line" />
      </div>
      <div className="tl-card">
        <div className="tl-top">
          <span className="tl-name">{e.subtype}</span>
          <span className="tl-time tnum">{clockLabel(e.at)}</span>
        </div>
        {e.detail && <div className="tl-det">{e.detail}</div>}
        <div className="tl-foot">
          <span className="tl-by">
            <span className="avatar" style={{ width: 18, height: 18, fontSize: 9, background: isMe ? "var(--feed)" : "var(--sleep)" }}>
              {e.byInitial}
            </span>
            {e.by}
          </span>
          <span className="syncpip" data-s={e.sync} style={{ marginLeft: "auto" }}>
            <i />
            {e.sync === "pending" ? "Syncing" : e.sync === "edited" ? "Edited 1m ago" : "Synced"}
          </span>
        </div>
      </div>
    </div>
  );
}

function DuplicateChip({ e, onMerge }: { e: CareEvent; onMerge: () => void }) {
  return (
    <div className="dup">
      <div className="txt">
        <b>Possible duplicate.</b> You and Sam both logged a bottle around {clockLabel(e.at)}.
      </div>
      <button className="act-btn">Keep both</button>
      <button className="act-btn primary" onClick={onMerge}>Review</button>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div style={{ marginTop: 14 }}>
      <div className="skeleton" style={{ width: 64, height: 14, margin: "0 2px 18px" }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <div className="sk-row" key={i}>
          <div className="skeleton sk-node" />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: `${55 - i * 4}%`, height: 13, marginBottom: 9 }} />
            <div className="skeleton" style={{ width: `${30 + i * 5}%`, height: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="state">
      <span className="glyph" style={{ background: "var(--sleep-tint)", color: "var(--sleep)" }}>
        <TimelineIcon size={30} stroke={1.6} />
      </span>
      <div className="st-title">No events yet today</div>
      <p className="st-sub">As you and Sam log feeds, diapers, and sleep, they'll appear here in order.</p>
      <button className="st-btn" style={{ background: "var(--accent)" }}>Log the first event</button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="state">
      <span className="glyph" style={{ background: "color-mix(in srgb, var(--danger) 14%, transparent)", color: "var(--danger)" }}>
        <Warn />
      </span>
      <div className="st-title">Couldn't load the timeline</div>
      <p className="st-sub">Your logged events are saved on this device and will sync once you're back. Nothing is lost.</p>
      <button className="st-btn" style={{ background: "var(--ink)" }} onClick={onRetry}>
        <Retry /> Try again
      </button>
    </div>
  );
}

function Warn() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4 2.5 20h19L12 4Z" />
      <path d="M12 10v4M12 17.2v.1" />
    </svg>
  );
}
function Retry() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 11A8 8 0 1 0 18 16" />
      <path d="M20 4v6h-6" />
    </svg>
  );
}
