import { useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import "./styles/app.css";
import {
  HomeIcon,
  LogIcon,
  TimelineIcon,
  CheckInIcon,
  SettingsIcon,
  MoonIcon,
  SunIcon,
} from "./components/icons";
import { Home } from "./screens/Home";
import { Log } from "./screens/Log";
import { Timeline } from "./screens/Timeline";
import { CheckIn } from "./screens/CheckIn";
import { Settings } from "./screens/Settings";
import { Onboarding } from "./screens/Onboarding";
import { Invite } from "./screens/Invite";
import { DeleteAccount } from "./screens/DeleteAccount";
import { TrustCenter } from "./screens/TrustCenter";
import { Reminders } from "./screens/Reminders";
import { MergeSheet } from "./screens/MergeSheet";

type Tab = "home" | "log" | "timeline" | "checkin" | "settings";
type Theme = "dawn" | "night";
type Flow = null | "onboarding" | "invite" | "delete" | "trust" | "reminders" | "merge";

const OUT = [0.23, 1, 0.32, 1] as const;
const DRAWER = [0.32, 0.72, 0, 1] as const;

const TABS: { id: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "log", label: "Log", Icon: LogIcon },
  { id: "timeline", label: "Timeline", Icon: TimelineIcon },
  { id: "checkin", label: "Check-In", Icon: CheckInIcon },
  { id: "settings", label: "Settings", Icon: SettingsIcon },
];

const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
const initialTab = (params.get("screen") as Tab) || "home";
const initialTheme: Theme = params.get("theme") === "night" ? "night" : "dawn";
const initialFlow = (params.get("flow") as Flow) || null;

export function App() {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [flow, setFlow] = useState<Flow>(initialFlow);
  const toggleTheme = () => setTheme((t) => (t === "dawn" ? "night" : "dawn"));

  return (
    <MotionConfig reducedMotion="user">
      <div className="stage">
        <div className="phone">
          <div className="screen" data-theme={theme === "night" ? "night" : undefined}>
            <StatusBar theme={theme} onToggleTheme={toggleTheme} />

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                className="body"
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(4px)", transition: { duration: 0.18, ease: OUT } }}
                transition={{ duration: 0.32, ease: OUT }}
              >
                {tab === "home" && <Home onGoToLog={() => setTab("log")} onGoToCheckIn={() => setTab("checkin")} />}
                {tab === "log" && <Log />}
                {tab === "timeline" && <Timeline onOpenMerge={() => setFlow("merge")} />}
                {tab === "checkin" && <CheckIn />}
                {tab === "settings" && (
                  <Settings
                    theme={theme}
                    onToggleTheme={toggleTheme}
                    onInvite={() => setFlow("invite")}
                    onDelete={() => setFlow("delete")}
                    onReplayOnboarding={() => setFlow("onboarding")}
                    onTrust={() => setFlow("trust")}
                    onReminders={() => setFlow("reminders")}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <nav className="tabbar">
              {TABS.map(({ id, label, Icon }) => {
                const active = tab === id;
                return (
                  <button key={id} className="tab" data-active={active} onClick={() => setTab(id)}>
                    {active && (
                      <motion.span
                        layoutId="tab-pip"
                        className="pip"
                        transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                      />
                    )}
                    <Icon size={21} stroke={active ? 1.9 : 1.6} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Flow overlays */}
            <AnimatePresence>
              {flow === "onboarding" && (
                <motion.div
                  key="onboarding"
                  style={overlayStyle}
                  initial={{ opacity: 0, scale: 1.03, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.02, filter: "blur(6px)", transition: { duration: 0.2, ease: OUT } }}
                  transition={{ duration: 0.34, ease: OUT }}
                >
                  <Onboarding onDone={() => setFlow(null)} />
                </motion.div>
              )}
              {(flow === "invite" || flow === "delete" || flow === "trust" || flow === "reminders" || flow === "merge") && (
                <motion.div
                  key={flow}
                  style={overlayStyle}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%", transition: { duration: 0.28, ease: DRAWER } }}
                  transition={{ duration: 0.4, ease: DRAWER }}
                >
                  {flow === "invite" && <Invite onClose={() => setFlow(null)} />}
                  {flow === "delete" && <DeleteAccount onClose={() => setFlow(null)} />}
                  {flow === "trust" && <TrustCenter onClose={() => setFlow(null)} />}
                  {flow === "reminders" && <Reminders onClose={() => setFlow(null)} />}
                  {flow === "merge" && <MergeSheet onClose={() => setFlow(null)} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button className="replay" onClick={() => setFlow("onboarding")}>
          ▶ Replay onboarding · tap the {theme === "dawn" ? "moon" : "sun"} for Night mode
        </button>
      </div>
    </MotionConfig>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 90,
};

function StatusBar({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  return (
    <div className="statusbar">
      <span className="tnum">9:41</span>
      <div className="right">
        <button className="theme-toggle press" onClick={onToggleTheme} aria-label="Toggle night mode">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ opacity: 0, rotate: -40, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 40, scale: 0.7 }}
              transition={{ duration: 0.22, ease: OUT }}
              style={{ display: "grid", placeItems: "center" }}
            >
              {theme === "dawn" ? <MoonIcon size={17} /> : <SunIcon size={17} />}
            </motion.span>
          </AnimatePresence>
        </button>
        <span className="signal" aria-hidden>
          <i /><i /><i /><i />
        </span>
        <span className="battery" aria-hidden>
          <i />
        </span>
      </div>
    </div>
  );
}
