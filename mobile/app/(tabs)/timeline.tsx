import { useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText, Card, CenterState, PressableScale, ScreenScroll, Skeleton } from "../../components/Themed";
import { eventIcon, eventColorKey, eventTintKey, TimelineIcon, WarnIcon, RetryIcon } from "../../components/icons";
import { clockLabel } from "../../data/mock";
import type { CareEvent } from "../../data/repository";
import { updateCareEvent, usePagedTimeline } from "../../data/useData";
import { Reveal } from "../../components/Reveal";

export default function TimelineScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { items: data, status, error, hasMore, loadingMore, reload, loadMore } = usePagedTimeline(30);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  if (status === "loading") {
    return (
      <ScreenScroll>
        <Header />
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              gap: 15,
              alignItems: "center",
              marginBottom: 12,
              padding: 13,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.color.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.color.line,
            }}
          >
            <Skeleton style={{ width: 40, height: 40, borderRadius: theme.radius.md }} />
            <View style={{ flex: 1, gap: 9 }}>
              <Skeleton style={{ width: `${55 - i * 4}%`, height: 13 }} />
              <Skeleton style={{ width: `${30 + i * 5}%`, height: 10 }} />
            </View>
          </View>
        ))}
      </ScreenScroll>
    );
  }

  if (status === "error") {
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
          <WarnIcon size={30} color={theme.color.danger} />
        </View>
        <AppText display variant="title" weight="medium">
          Couldn’t load the timeline
        </AppText>
        <AppText variant="body" color="inkSoft" style={{ textAlign: "center", marginTop: 8 }}>
          Your logged events are saved on this device and will sync once you’re back. Nothing is lost.
        </AppText>
        <PressableScale
          onPress={reload}
          style={{
            marginTop: 22,
            flexDirection: "row",
            gap: 8,
            alignItems: "center",
            backgroundColor: theme.color.ink,
            paddingVertical: 13,
            paddingHorizontal: 22,
            borderRadius: 999,
          }}
        >
          <RetryIcon size={16} color={theme.color.surface} />
          <AppText weight="bold" style={{ color: theme.color.surface }}>
            Try again
          </AppText>
        </PressableScale>
      </CenterState>
    );
  }

  if (data.length === 0) {
    return (
      <CenterState>
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 999,
            backgroundColor: theme.color.sleepTint,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <TimelineIcon size={30} color={theme.color.sleep} />
        </View>
        <AppText display variant="title" weight="medium">
          No events yet today
        </AppText>
        <AppText variant="body" color="inkSoft" style={{ textAlign: "center", marginTop: 8 }}>
          As you and your co-caregiver log feeds, diapers, and sleep, they’ll appear here in order.
        </AppText>
        <PressableScale
          onPress={() => router.push("/log")}
          style={{
            marginTop: 22,
            backgroundColor: theme.color.accent,
            paddingVertical: 13,
            paddingHorizontal: 22,
            borderRadius: 999,
          }}
        >
          <AppText weight="bold" style={{ color: theme.color.onAccent }}>
            Log the first event
          </AppText>
        </PressableScale>
      </CenterState>
    );
  }

  return (
    <ScreenScroll>
      <Header />
      <AppText
        variant="label"
        weight="bold"
        color="inkFaint"
        style={{ letterSpacing: 0.6, marginVertical: 6, marginBottom: 14 }}
      >
        TODAY
      </AppText>
      {data.map((e, i) => (
        <Reveal key={e.id} index={i}>
          <TimelineItem e={e} />
          {e.duplicateOf && <DuplicateChip e={e} onResolved={reload} />}
        </Reveal>
      ))}
      {hasMore && (
        <PressableScale
          disabled={loadingMore}
          scale={0.99}
          onPress={loadMore}
          style={{
            marginTop: 6,
            marginBottom: 18,
            paddingVertical: 14,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.color.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.color.line,
            alignItems: "center",
            opacity: loadingMore ? 0.7 : 1,
          }}
        >
          <AppText variant="body" weight="semibold" color="inkSoft">
            {loadingMore ? "Loading earlier…" : "Load earlier events"}
          </AppText>
        </PressableScale>
      )}
      {error && status === "ready" && (
        <AppText variant="caption" color="danger" style={{ marginBottom: 14, textAlign: "center" }}>
          {error.message}
        </AppText>
      )}
    </ScreenScroll>
  );
}

function Header() {
  return (
    <View style={{ paddingTop: 8, paddingBottom: 14 }}>
      <AppText display variant="display" weight="medium">
        Timeline
      </AppText>
      <AppText variant="body" color="inkSoft" style={{ marginTop: 4 }}>
        Everything, in order — who and when.
      </AppText>
    </View>
  );
}

function TimelineItem({ e }: { e: CareEvent }) {
  const theme = useTheme();
  const Icon = eventIcon[e.type];
  const isMe = e.by === "You";
  return (
    <View style={{ flexDirection: "row", gap: 15, marginBottom: 12 }}>
      <View style={{ width: 40, alignItems: "center" }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.md,
            backgroundColor: theme.color[eventTintKey[e.type]],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color={theme.color[eventColorKey[e.type]]} />
        </View>
      </View>
      <Card style={{ flex: 1, padding: 15 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <AppText variant="heading" weight="semibold">
            {e.subtype}
          </AppText>
          <AppText variant="caption" color="inkFaint">
            {clockLabel(e.at)}
          </AppText>
        </View>
        {e.detail && (
          <AppText variant="body" color="inkSoft" style={{ marginTop: 3 }}>
            {e.detail}
          </AppText>
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 11,
            paddingTop: 10,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.color.line,
          }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              backgroundColor: isMe ? theme.color.feed : theme.color.sleep,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText weight="bold" style={{ color: theme.color.onAccent, fontSize: 9 }}>
              {e.byInitial}
            </AppText>
          </View>
          <AppText variant="caption" color="inkSoft" weight="medium">
            {e.by}
          </AppText>
          <View style={{ flex: 1 }} />
          <SyncPip sync={e.sync} />
        </View>
      </Card>
    </View>
  );
}

function SyncPip({ sync }: { sync: CareEvent["sync"] }) {
  const theme = useTheme();
  const map = {
    pending: { c: theme.color.warning, t: "Syncing" },
    edited: { c: theme.color.sleep, t: "Edited 1m ago" },
    synced: { c: theme.color.positive, t: "Synced" },
  }[sync];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: map.c + "22",
      }}
    >
      <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: map.c }} />
      <AppText weight="semibold" style={{ color: map.c, fontSize: 10 }}>
        {map.t}
      </AppText>
    </View>
  );
}

function DuplicateChip({ e, onResolved }: { e: CareEvent; onResolved: () => void }) {
  const theme = useTheme();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function keepBoth() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateCareEvent(e.id, { duplicateOf: null });
      onResolved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update this duplicate.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ marginLeft: 55, marginBottom: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 11,
          padding: 11,
          borderRadius: theme.radius.md,
          backgroundColor: theme.color.sleepTint,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.color.sleep,
        }}
      >
        <AppText variant="caption" color="inkSoft" style={{ flex: 1 }}>
          <AppText variant="caption" weight="semibold">
            Possible duplicate.{" "}
          </AppText>
          You and another caregiver both logged a bottle around {clockLabel(e.at)}.
        </AppText>
        <PressableScale
          disabled={saving}
          onPress={keepBoth}
          style={{
            paddingHorizontal: 11,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.color.lineStrong,
            opacity: saving ? 0.65 : 1,
          }}
        >
          <AppText weight="bold" style={{ fontSize: 11 }}>
            {saving ? "Saving" : "Keep both"}
          </AppText>
        </PressableScale>
        <PressableScale
          disabled={saving}
          onPress={() => router.push({ pathname: "/merge", params: { id: e.id, duplicateOf: e.duplicateOf } })}
          style={{
            paddingHorizontal: 11,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: theme.color.sleep,
            opacity: saving ? 0.65 : 1,
          }}
        >
          <AppText weight="bold" style={{ fontSize: 11, color: theme.color.onAccent }}>
            Review
          </AppText>
        </PressableScale>
      </View>
      {error && (
        <AppText variant="caption" color="danger" style={{ marginTop: 6, textAlign: "center" }}>
          {error}
        </AppText>
      )}
    </View>
  );
}
