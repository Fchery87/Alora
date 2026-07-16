import { useEffect, useState } from "react";
import "../styles/home.css";
import { Reveal } from "../components/Reveal";
import {
  FeedIcon,
  DiaperIcon,
  SleepIcon,
  BellIcon,
  ChevronRight,
  CloudIcon,
  eventIcon,
  eventColorVar,
  eventTintVar,
} from "../components/icons";
import { durationLabel, sinceLabel, clockLabel, type CareEvent } from "../data/mock";
import { useBabyStatus, useRecentActivity } from "../data/useData";

export function Home({ onGoToLog }: { onGoToLog: () => void; onGoToCheckIn?: () => void }) {
  // Live-ticking timer so the hero feels alive.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const status = useBabyStatus();
  const activity = useRecentActivity(3);

  if (status.status === "loading") return <HomeSkeleton />;
  if (status.status === "error") {
    return (
      <div className="state">
        <span className="glyph" style={{ background: "color-mix(in srgb, var(--danger) 14%, transparent)", color: "var(--danger)" }}>
          <CloudIcon size={30} />
        </span>
        <div className="st-title">Can't reach sync right now</div>
        <p className="st-sub">Your on-device data is safe. Reconnect to refresh the dashboard.</p>
        <button className="st-btn" style={{ background: "var(--ink)" }} onClick={status.reload}>Try again</button>
      </div>
    );
  }

  const s = status.data;
  return (
    <>
      <Reveal i={0}>
        <div className="home-head">
          <div>
            <h1 className="home-greet">
              Good morning,
              <br /> Alex.
            </h1>
            <p className="home-handoff">
              {s.putDownBy ? `${s.putDownBy} handed off 14m ago · all calm.` : "Your shift · all calm."}
            </p>
          </div>
        </div>
      </Reveal>

      {/* Hero status */}
      <Reveal i={1}>
        <div className="hero" data-state={s.asleep ? "asleep" : "awake"}>
          <span className="aurora" aria-hidden />
          <div className="hero-top">
            <div className="orb" data-state={s.asleep ? "asleep" : "awake"}>
              <span className="ring" />
              <span className="core">
                {s.asleep ? <SleepIcon size={22} stroke={1.9} /> : <FeedIcon size={22} stroke={1.9} />}
              </span>
            </div>
            <div className="hero-state">
              <span className="label">{s.asleep ? "Asleep" : "Awake"}</span>
              <span className="baby">{s.name} · {s.ageLabel}</span>
            </div>
          </div>

          {s.asleep && s.asleepSince ? (
            <>
              <div className="hero-timer">
                <span className="big tnum">{durationLabel(s.asleepSince)}</span>
                <span className="sub"><span className="live-dot" aria-hidden />napping</span>
              </div>
              <p className="hero-meta">
                Down since {clockLabel(s.asleepSince)} · put down drowsy by {s.putDownBy}
              </p>
            </>
          ) : (
            <>
              <div className="hero-timer">
                <span className="big" style={{ fontSize: 34 }}>Awake & happy</span>
              </div>
              <p className="hero-meta">Log a feed or diaper to start today's rhythm.</p>
            </>
          )}
        </div>
      </Reveal>

      {/* Quick log */}
      <Reveal i={2}>
        <div className="quick-row">
          <QuickButton onClick={onGoToLog} tint="var(--feed-tint)" fg="var(--feed)" Icon={FeedIcon} name="Feed" />
          <QuickButton onClick={onGoToLog} tint="var(--diaper-tint)" fg="var(--diaper)" Icon={DiaperIcon} name="Diaper" />
          <QuickButton onClick={onGoToLog} tint="var(--sleep-tint)" fg="var(--sleep)" Icon={SleepIcon} name={s.asleep ? "Wake" : "Sleep"} hint={s.asleep ? "end nap" : undefined} />
        </div>
      </Reveal>

      {/* At a glance */}
      <div className="section">
        <Reveal i={3}>
          <div className="section-head">
            <span className="section-title">At a glance</span>
          </div>
        </Reveal>
        <Reveal i={4}>
          <div className="glance">
            <div className="g">
              <span className="gh"><span className="dot" style={{ background: "var(--feed)" }} />Last feed</span>
              <div className="gv tnum">{s.lastFeed ? sinceLabel(s.lastFeed.at).replace(" ago", "") : "—"}</div>
              <div className="gd">{s.lastFeed ? `${s.lastFeed.subtype} · ${s.lastFeed.detail ?? "—"} · ${s.lastFeed.by}` : "No feeds yet"}</div>
            </div>
            <div className="g">
              <span className="gh"><span className="dot" style={{ background: "var(--diaper)" }} />Last diaper</span>
              <div className="gv tnum">{s.lastDiaper ? sinceLabel(s.lastDiaper.at).replace(" ago", "") : "—"}</div>
              <div className="gd">{s.lastDiaper ? `${s.lastDiaper.subtype} · ${s.lastDiaper.by}` : "No changes yet"}</div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Next reminder */}
      <div className="section">
        <Reveal i={5}>
          <div className="reminder">
            <span className="ic"><BellIcon size={20} /></span>
            <div style={{ flex: 1 }}>
              <div className="t1">Next feed likely around 3:15pm</div>
              <div className="t2">Based on today's rhythm · ~2h 40m between feeds</div>
            </div>
            <ChevronRight size={18} stroke={2} />
          </div>
        </Reveal>
      </div>

      {/* Recent activity */}
      <div className="section">
        <Reveal i={6}>
          <div className="section-head">
            <span className="section-title">Recent activity</span>
            <span className="link">Timeline <ChevronRight size={14} stroke={2.2} /></span>
          </div>
        </Reveal>
        <Reveal i={7}>
          <div className="card activity" style={{ padding: "2px 14px" }}>
            {activity.status === "ready" && activity.data.map((e) => <ActivityRow key={e.id} e={e} />)}
            {activity.status === "loading" && [0, 1, 2].map((i) => (
              <div className="act" key={i} style={{ gap: 13 }}>
                <span className="skeleton" style={{ width: 36, height: 36, borderRadius: "var(--r-md)" }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: "45%", height: 12, marginBottom: 7 }} />
                  <div className="skeleton" style={{ width: "28%", height: 9 }} />
                </div>
              </div>
            ))}
            {activity.status === "ready" && activity.data.length === 0 && (
              <div style={{ padding: "20px 4px", textAlign: "center", color: "var(--ink-faint)", fontSize: "var(--t-body)" }}>
                Nothing logged yet today.
              </div>
            )}
          </div>
        </Reveal>
      </div>

      <Reveal i={8}>
        <div className="synced-line">
          <CloudIcon size={14} />
          1 change syncing · last synced 14m ago
        </div>
      </Reveal>
    </>
  );
}

function QuickButton({
  onClick, tint, fg, Icon, name, hint,
}: {
  onClick: () => void; tint: string; fg: string; Icon: typeof FeedIcon; name: string; hint?: string;
}) {
  return (
    <button className="quick press" onClick={onClick}>
      <span className="ic" style={{ background: tint, color: fg }}>
        <Icon size={22} />
      </span>
      <span>
        <span className="name">{name}</span>
        {hint && <span className="hint">{hint}</span>}
      </span>
    </button>
  );
}

function ActivityRow({ e }: { e: CareEvent }) {
  const Icon = eventIcon[e.type];
  const isMe = e.by === "You";
  return (
    <div className="act">
      <span className="ic" style={{ background: eventTintVar[e.type], color: eventColorVar[e.type] }}>
        <Icon size={19} />
      </span>
      <div className="main">
        <div className="who">
          {e.subtype}
          {e.detail ? <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}> · {e.detail}</span> : null}
        </div>
        <div className="det">
          <span className="avatar" style={{ display: "inline-grid", width: 15, height: 15, fontSize: 8, marginRight: 5, verticalAlign: "-2px", background: isMe ? "var(--feed)" : "var(--sleep)" }}>
            {e.byInitial}
          </span>
          {e.by}
        </div>
      </div>
      <div className="right">
        <span className="time tnum">{clockLabel(e.at)}</span>
        <span className="syncpip" data-s={e.sync}>
          <i />
          {e.sync === "pending" ? "Syncing" : e.sync === "edited" ? "Edited" : "Synced"}
        </span>
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div style={{ paddingTop: 8 }}>
      <div className="skeleton" style={{ width: 180, height: 30, marginBottom: 10 }} />
      <div className="skeleton" style={{ width: 150, height: 14, marginBottom: 22 }} />
      <div className="skeleton" style={{ width: "100%", height: 168, borderRadius: "var(--r-xl)", marginBottom: 14 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 26 }}>
        {[0, 1, 2].map((i) => <div className="skeleton" key={i} style={{ height: 92, borderRadius: "var(--r-lg)" }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[0, 1].map((i) => <div className="skeleton" key={i} style={{ height: 92, borderRadius: "var(--r-lg)" }} />)}
      </div>
    </div>
  );
}
