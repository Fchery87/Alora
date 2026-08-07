import { useCallback, useEffect, useState, type ComponentType } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText, Card, CenterState, PressableScale, ScreenScroll, Skeleton } from "../../components/Themed";
import {
  FeedIcon,
  DiaperIcon,
  SleepIcon,
  BellIcon,
  CloudIcon,
  ChevronRight,
  eventIcon,
  eventColorKey,
  eventTintKey,
  type IconProps,
} from "../../components/icons";
import { durationLabel, sinceLabel, clockLabel } from "../../data/mock";
import type { CareEvent, EventType } from "../../data/repository";
import {
  createCareEvent,
  startSleep,
  stopSleep,
  useBabyStatus,
  useFamilyMembers,
  useRecentActivity,
  useTimeline,
} from "../../data/useData";
import { buildHandoffBrief } from "../../lib/handoff";
import { getStoredHandoff, saveStoredHandoff } from "../../data/localHandoffStore";
import { Reveal } from "../../components/Reveal";
import { BreathingOrb, LiveDot } from "../../components/Motion";

export default function HomeScreen() {
  const theme = useTheme();
  const [, tick] = useState(0);
  const [quickSaving, setQuickSaving] = useState<EventType | "wake" | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const status = useBabyStatus();
  const activity = useRecentActivity(3);
  const timeline = useTimeline();
  const members = useFamilyMembers();
  const [handoffMarker, setHandoffMarker] = useState<Date | null | undefined>(undefined);
  const selfName = members.status === "ready" ? members.data.find((m) => m.isSelf)?.displayName : undefined;
  const greetingName = selfName ?? "there";

  useEffect(() => {
    let cancelled = false;
    getStoredHandoff().then((marker) => {
      if (!cancelled) setHandoffMarker(marker);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  // reload fns are stable (useCallback in useAsync); destructure so the focus
  // effect depends on the functions, not the recreated hook result objects.
  const { reload: reloadStatus } = status;
  const { reload: reloadActivity } = activity;
  const { reload: reloadTimeline } = timeline;

  useFocusEffect(
    useCallback(() => {
      reloadStatus();
      reloadActivity();
      reloadTimeline();
    }, [reloadActivity, reloadStatus, reloadTimeline]),
  );

  async function quickLog(type: "feed" | "diaper") {
    if (quickSaving) return;
    setQuickSaving(type);
    setQuickError(null);
    try {
      await createCareEvent({ type, subtype: type === "feed" ? "Bottle" : "Wet" });
      status.reload();
      activity.reload();
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : "Couldn't save this event.");
    } finally {
      setQuickSaving(null);
    }
  }

  async function quickSleep(statusData: NonNullable<typeof status.data>) {
    if (quickSaving) return;
    const action = statusData.asleep ? "wake" : "sleep";
    setQuickSaving(action);
    setQuickError(null);
    try {
      if (statusData.asleep && statusData.activeSleepId) await stopSleep(statusData.activeSleepId);
      else await startSleep();
      status.reload();
      activity.reload();
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : "Couldn't update sleep.");
    } finally {
      setQuickSaving(null);
    }
  }

  if (status.status === "loading") return <HomeSkeleton />;
  if (status.status === "error") {
    return (
      <CenterState>
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 999,
            backgroundColor: theme.color.surface2,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <CloudIcon size={30} color={theme.color.danger} />
        </View>
        <AppText display variant="title" weight="medium">
          Can’t reach sync right now
        </AppText>
        <AppText variant="body" color="inkSoft" style={{ textAlign: "center", marginTop: 8 }}>
          Your on-device data is safe. Reconnect to refresh the dashboard.
        </AppText>
        <PressableScale
          onPress={status.reload}
          style={{
            marginTop: 22,
            backgroundColor: theme.color.ink,
            paddingVertical: 13,
            paddingHorizontal: 22,
            borderRadius: 999,
          }}
        >
          <AppText weight="bold" style={{ color: "#fff" }}>
            Try again
          </AppText>
        </PressableScale>
      </CenterState>
    );
  }

  const s = status.data;
  return (
    <ScreenScroll>
      <Reveal index={0}>
        <AppText display variant="display" weight="medium" style={{ marginTop: 8, lineHeight: 33 }}>
          Good morning,{"\n"}
          {greetingName}.
        </AppText>
        <AppText variant="body" color="inkSoft" style={{ marginTop: 5, marginBottom: 18 }}>
          {s.putDownBy ? `${s.putDownBy} handed off 14m ago · all calm.` : "Your shift · all calm."}
        </AppText>
      </Reveal>

      {/* Hero status */}
      <Reveal index={1}>
        <Card
          style={{
            padding: 24,
            borderRadius: theme.radius.xl,
            backgroundColor: s.asleep ? theme.color.sleepTint : theme.color.feedTint,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={[s.asleep ? theme.color.sleepTint : theme.color.feedTint, theme.color.surface]}
            start={{ x: 0.85, y: 0 }}
            end={{ x: 0.15, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <BreathingOrb
              coreColor={s.asleep ? theme.color.sleep : theme.color.feed}
              ringColor={s.asleep ? theme.color.sleep : theme.color.feed}
              durationMs={s.asleep ? 2300 : 1500}
            >
              {s.asleep ? (
                <SleepIcon size={22} color="#fff" strokeWidth={1.9} />
              ) : (
                <FeedIcon size={22} color="#fff" strokeWidth={1.9} />
              )}
            </BreathingOrb>
            <View>
              <AppText
                variant="label"
                weight="semibold"
                style={{ color: s.asleep ? theme.color.sleep : theme.color.feed, letterSpacing: 0.6 }}
              >
                {s.asleep ? "ASLEEP" : "AWAKE"}
              </AppText>
              <AppText display variant="title" style={{ marginTop: 1 }}>
                {s.name} · {s.ageLabel}
              </AppText>
            </View>
          </View>

          {s.asleep && s.asleepSince ? (
            <>
              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 18 }}>
                <AppText display variant="hero" weight="medium" style={{ lineHeight: 56 }}>
                  {durationLabel(s.asleepSince)}
                </AppText>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <LiveDot color={theme.color.sleep} />
                  <AppText variant="body" color="inkSoft">
                    napping
                  </AppText>
                </View>
              </View>
              <AppText variant="body" color="inkSoft" style={{ marginTop: 8 }}>
                Down since {clockLabel(s.asleepSince)} · put down drowsy by {s.putDownBy}
              </AppText>
            </>
          ) : (
            <>
              <AppText display variant="display" weight="medium" style={{ marginTop: 16 }}>
                Awake & happy
              </AppText>
              <AppText variant="body" color="inkSoft" style={{ marginTop: 8 }}>
                Log a feed or diaper to start today’s rhythm.
              </AppText>
            </>
          )}
        </Card>
      </Reveal>

      {/* Shift-handoff briefing */}
      <Reveal index={2}>
        <HandoffCard
          events={timeline.data ?? []}
          marker={handoffMarker}
          baby={s}
          onMarked={() => {
            setHandoffMarker(new Date());
            reloadStatus();
            reloadActivity();
            reloadTimeline();
          }}
        />
      </Reveal>

      {/* Quick log */}
      <Reveal index={3}>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <QuickButton
            tint={theme.color.feedTint}
            fg={theme.color.feed}
            Icon={FeedIcon}
            name="Feed"
            hint={quickSaving === "feed" ? "saving" : undefined}
            disabled={Boolean(quickSaving)}
            onPress={() => quickLog("feed")}
          />
          <QuickButton
            tint={theme.color.diaperTint}
            fg={theme.color.diaper}
            Icon={DiaperIcon}
            name="Diaper"
            hint={quickSaving === "diaper" ? "saving" : undefined}
            disabled={Boolean(quickSaving)}
            onPress={() => quickLog("diaper")}
          />
          <QuickButton
            tint={theme.color.sleepTint}
            fg={theme.color.sleep}
            Icon={SleepIcon}
            name={s.asleep ? "Wake" : "Sleep"}
            hint={quickSaving === "sleep" || quickSaving === "wake" ? "saving" : s.asleep ? "end nap" : "start nap"}
            disabled={Boolean(quickSaving)}
            onPress={() => quickSleep(s)}
          />
        </View>
        {quickError && (
          <AppText variant="caption" color="danger" style={{ marginTop: 10, textAlign: "center" }}>
            {quickError}
          </AppText>
        )}
      </Reveal>

      {/* At a glance */}
      <SectionTitle>At a glance</SectionTitle>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <GlanceCard
          dot={theme.color.feed}
          label="Last feed"
          value={s.lastFeed ? sinceLabel(s.lastFeed.at).replace(" ago", "") : "—"}
          detail={
            s.lastFeed ? `${s.lastFeed.subtype} · ${s.lastFeed.detail ?? "—"} · ${s.lastFeed.by}` : "No feeds yet"
          }
        />
        <GlanceCard
          dot={theme.color.diaper}
          label="Last diaper"
          value={s.lastDiaper ? sinceLabel(s.lastDiaper.at).replace(" ago", "") : "—"}
          detail={s.lastDiaper ? `${s.lastDiaper.subtype} · ${s.lastDiaper.by}` : "No changes yet"}
        />
      </View>

      {/* Reminder */}
      <View style={{ marginTop: 26 }}>
        <Card
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            padding: 15,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.color.feedTint,
            borderColor: theme.color.feed,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.radius.md,
              backgroundColor: theme.color.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BellIcon size={20} color={theme.color.feed} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="body" weight="semibold">
              Next feed likely around 3:15pm
            </AppText>
            <AppText variant="caption" color="inkSoft" style={{ marginTop: 2 }}>
              Based on today’s rhythm · ~2h 40m between feeds
            </AppText>
          </View>
          <ChevronRight size={18} color={theme.color.inkFaint} strokeWidth={2} />
        </Card>
      </View>

      {/* Recent activity */}
      <SectionTitle right="Timeline">Recent activity</SectionTitle>
      <Card style={{ paddingHorizontal: 14 }}>
        {activity.status === "loading" &&
          [0, 1, 2].map((i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 13 }}>
              <Skeleton style={{ width: 36, height: 36, borderRadius: theme.radius.md }} />
              <View style={{ flex: 1, gap: 7 }}>
                <Skeleton style={{ width: "45%", height: 12 }} />
                <Skeleton style={{ width: "28%", height: 9 }} />
              </View>
            </View>
          ))}
        {activity.status === "ready" && activity.data.map((e, i) => <ActivityRow key={e.id} e={e} first={i === 0} />)}
        {activity.status === "ready" && activity.data.length === 0 && (
          <AppText variant="body" color="inkFaint" style={{ textAlign: "center", paddingVertical: 20 }}>
            Nothing logged yet today.
          </AppText>
        )}
      </Card>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 22 }}>
        <CloudIcon size={14} color={theme.color.inkFaint} />
        <AppText variant="caption" color="inkFaint">
          {timeline.status === "ready"
            ? (() => {
                const pending = timeline.data.filter((e) => e.sync === "pending").length;
                if (pending === 0) return "All changes synced";
                return `${pending} change${pending > 1 ? "s" : ""} syncing`;
              })()
            : "Checking sync status..."}
        </AppText>
      </View>
    </ScreenScroll>
  );
}

function SectionTitle({ children, right }: { children: string; right?: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 26,
        marginBottom: 12,
        paddingHorizontal: 2,
      }}
    >
      <AppText variant="heading" weight="semibold">
        {children}
      </AppText>
      {right && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <AppText variant="label" weight="semibold" color="inkSoft">
            {right}
          </AppText>
          <ChevronRight size={14} color={theme.color.inkSoft} strokeWidth={2.2} />
        </View>
      )}
    </View>
  );
}

function QuickButton({
  tint,
  fg,
  Icon,
  name,
  hint,
  onPress,
  disabled,
}: {
  tint: string;
  fg: string;
  Icon: ComponentType<IconProps>;
  name: string;
  hint?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        padding: 15,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.color.surface,
        borderWidth: 1,
        borderColor: theme.color.line,
        gap: 14,
        opacity: disabled ? 0.65 : 1,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: theme.radius.md,
          backgroundColor: tint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={22} color={fg} />
      </View>
      <View>
        <AppText variant="body" weight="semibold">
          {name}
        </AppText>
        {hint && (
          <AppText variant="caption" color="inkFaint" style={{ marginTop: -2 }}>
            {hint}
          </AppText>
        )}
      </View>
    </PressableScale>
  );
}

function GlanceCard({ dot, label, value, detail }: { dot: string; label: string; value: string; detail: string }) {
  return (
    <Card style={{ flex: 1, padding: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ width: 9, height: 9, borderRadius: 999, backgroundColor: dot }} />
        <AppText variant="label" weight="semibold" color="inkSoft">
          {label}
        </AppText>
      </View>
      <AppText display variant="title" style={{ marginTop: 8 }}>
        {value}
      </AppText>
      <AppText variant="caption" color="inkFaint" style={{ marginTop: 2 }}>
        {detail}
      </AppText>
    </Card>
  );
}

function ActivityRow({ e, first }: { e: CareEvent; first: boolean }) {
  const theme = useTheme();
  const Icon = eventIcon[e.type];
  const isMe = e.by === "You";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 13,
        paddingVertical: 13,
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        borderTopColor: theme.color.line,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: theme.radius.md,
          backgroundColor: theme.color[eventTintKey[e.type]],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={19} color={theme.color[eventColorKey[e.type]]} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="semibold">
          {e.subtype}
          {e.detail ? (
            <AppText variant="body" color="inkSoft">
              {" "}
              · {e.detail}
            </AppText>
          ) : null}
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 }}>
          <View
            style={{
              width: 15,
              height: 15,
              borderRadius: 999,
              backgroundColor: isMe ? theme.color.feed : theme.color.sleep,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText weight="bold" style={{ color: "#fff", fontSize: 8 }}>
              {e.byInitial}
            </AppText>
          </View>
          <AppText variant="caption" color="inkSoft">
            {e.by}
          </AppText>
        </View>
      </View>
      <AppText variant="caption" color="inkFaint">
        {clockLabel(e.at)}
      </AppText>
    </View>
  );
}

function HomeSkeleton() {
  const theme = useTheme();
  return (
    <ScreenScroll>
      <Skeleton style={{ width: 180, height: 30, marginTop: 8, marginBottom: 10 }} />
      <Skeleton style={{ width: 150, height: 14, marginBottom: 22 }} />
      <Skeleton style={{ width: "100%", height: 168, borderRadius: theme.radius.xl, marginBottom: 14 }} />
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 26 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} style={{ flex: 1, height: 92, borderRadius: theme.radius.lg }} />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {[0, 1].map((i) => (
          <Skeleton key={i} style={{ flex: 1, height: 92, borderRadius: theme.radius.lg }} />
        ))}
      </View>
    </ScreenScroll>
  );
}

function HandoffCard({
  events,
  marker,
  baby,
  onMarked,
}: {
  events: CareEvent[];
  marker: Date | null | undefined;
  baby: NonNullable<ReturnType<typeof useBabyStatus>["data"]>;
  onMarked: () => void;
}) {
  const theme = useTheme();
  const [, tick] = useState(0);
  const [marking, setMarking] = useState(false);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const brief = buildHandoffBrief(events, marker ?? null, new Date());

  async function markHandoff() {
    if (marking) return;
    setMarking(true);
    try {
      await saveStoredHandoff(new Date());
      onMarked();
    } finally {
      setMarking(false);
    }
  }

  const rows: ({ dot: string; label: string; value: string } | null)[] = [
    brief.lastFeed
      ? {
          dot: theme.color.feed,
          label: "Feed",
          value: `${brief.lastFeed.subtype} · ${brief.lastFeed.by} · ${sinceLabel(brief.lastFeed.at)}`,
        }
      : null,
    brief.lastDiaper
      ? {
          dot: theme.color.diaper,
          label: "Diaper",
          value: `${brief.lastDiaper.subtype} · ${brief.lastDiaper.by} · ${sinceLabel(brief.lastDiaper.at)}`,
        }
      : null,
    brief.openSleep
      ? {
          dot: theme.color.sleep,
          label: "Sleeping",
          value: `${baby.name} is down · since ${clockLabel(brief.openSleep.at)}`,
        }
      : null,
  ];
  const visibleRows = rows.filter((row): row is { dot: string; label: string; value: string } => row !== null);

  const sinceLabelText = marker ? `Since the handoff at ${clockLabel(marker)}` : "Since the last 24 hours";

  return (
    <Card style={{ marginTop: 16, padding: 16, borderStyle: "dashed", borderColor: theme.color.lineStrong }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <AppText variant="label" weight="bold" color="inkFaint" style={{ letterSpacing: 0.6, flex: 1 }}>
          CARE BRIEFING
        </AppText>
        <PressableScale
          scale={0.96}
          disabled={marking}
          onPress={markHandoff}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: theme.color.surface2,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.color.line,
            opacity: marking ? 0.6 : 1,
          }}
        >
          <AppText weight="bold" variant="label">
            {marker ? "Mark shift start" : "Start my shift"}
          </AppText>
        </PressableScale>
      </View>
      <AppText variant="caption" color="inkSoft" style={{ marginTop: 4 }}>
        {sinceLabelText} · {brief.eventsSince} event{brief.eventsSince === 1 ? "" : "s"} logged
      </AppText>
      <View style={{ marginTop: 10, gap: 8 }}>
        {visibleRows.length === 0 ? (
          <AppText variant="body" color="inkSoft">
            Nothing logged yet since then — all quiet.
          </AppText>
        ) : (
          visibleRows.map((row) => (
            <View key={row.label} style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
              <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: row.dot }} />
              <AppText variant="body" weight="semibold" style={{ width: 76 }}>
                {row.label}
              </AppText>
              <AppText variant="caption" color="inkSoft" style={{ flex: 1 }}>
                {row.value}
              </AppText>
            </View>
          ))
        )}
      </View>
    </Card>
  );
}
