import { useState, type ComponentType } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { ModalScreen } from "../components/ModalScreen";
import { AppText, Card, CenterState, PressableScale, Skeleton } from "../components/Themed";
import { Reveal } from "../components/Reveal";
import { MoonIcon, FeedIcon, DiaperIcon, SleepIcon, WarnIcon, RetryIcon, type IconProps } from "../components/icons";
import { setReminder, useReminderPreferences } from "../data/useData";
import type { ReminderKind, ReminderPreference } from "../data/repository";
import { syncReminderNotifications } from "../lib/notifications";

const REMINDER_ORDER: ReminderKind[] = ["feed", "diaper", "bedtime"];

export default function RemindersScreen() {
  const theme = useTheme();
  const reminders = useReminderPreferences();
  const [saving, setSaving] = useState<ReminderKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Partial<Record<ReminderKind, boolean>>>({});

  async function toggleReminder(reminder: ReminderPreference) {
    if (saving || reminders.status !== "ready") return;
    const previousEnabled = overrides[reminder.kind] ?? reminder.enabled;
    const nextEnabled = !previousEnabled;
    const previousPreferences = reminders.data;
    const nextPreferences = previousPreferences.map((item) =>
      item.kind === reminder.kind ? { ...item, enabled: nextEnabled } : item,
    );
    setSaving(reminder.kind);
    setError(null);
    setOverrides((current) => ({ ...current, [reminder.kind]: nextEnabled }));
    try {
      await setReminder(reminder.kind, reminder.config, nextEnabled);
      await syncReminderNotifications(nextPreferences);
      reminders.reload();
    } catch (err) {
      setOverrides((current) => ({ ...current, [reminder.kind]: previousEnabled }));
      try {
        await setReminder(reminder.kind, reminder.config, previousEnabled);
        await syncReminderNotifications(previousPreferences);
      } catch {
      }
      setError(err instanceof Error ? err.message : "Couldn't save reminder.");
    } finally {
      setSaving(null);
    }
  }

  if (reminders.status === "loading") {
    return (
      <ModalScreen title="Reminders & quiet hours">
        <Card style={{ padding: 18, borderRadius: theme.radius.xl, backgroundColor: theme.color.sleepTint, marginTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Skeleton style={{ width: 38, height: 38, borderRadius: theme.radius.md }} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton style={{ width: "45%", height: 14 }} />
              <Skeleton style={{ width: "60%", height: 10 }} />
            </View>
            <Skeleton style={{ width: 46, height: 28, borderRadius: 999 }} />
          </View>
        </Card>
      </ModalScreen>
    );
  }

  if (reminders.status === "error") {
    return (
      <CenterState>
        <View style={{ width: 68, height: 68, borderRadius: 999, backgroundColor: theme.color.surface2, alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <WarnIcon size={30} color={theme.color.danger} />
        </View>
        <AppText display variant="title" weight="medium">Couldn't load reminders</AppText>
        <AppText variant="body" color="inkSoft" style={{ textAlign: "center", marginTop: 8 }}>
          Your saved preferences are still on this device. Try again to refresh them.
        </AppText>
        <PressableScale onPress={reminders.reload} style={{ marginTop: 22, flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: theme.color.ink, paddingVertical: 13, paddingHorizontal: 22, borderRadius: 999 }}>
          <RetryIcon size={16} color="#fff" />
          <AppText weight="bold" style={{ color: "#fff" }}>Try again</AppText>
        </PressableScale>
      </CenterState>
    );
  }

  const quietHours = findReminder(reminders.data, "quietHours");
  const reminderRows = REMINDER_ORDER.map((kind) => findReminder(reminders.data, kind)).filter(
    (reminder): reminder is ReminderPreference => Boolean(reminder),
  );

  return (
    <ModalScreen title="Reminders & quiet hours">
      <Reveal index={0}>
        <Card style={{ padding: 18, borderRadius: theme.radius.xl, backgroundColor: theme.color.sleepTint, marginTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 38, height: 38, borderRadius: theme.radius.md, backgroundColor: theme.color.surface, alignItems: "center", justifyContent: "center" }}>
              <MoonIcon size={18} color={theme.color.sleep} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="body" weight="semibold">{quietHours?.config.label ?? "Quiet hours"}</AppText>
              <AppText variant="caption" color="inkSoft">No reminders will fire</AppText>
            </View>
            {quietHours && (
              <Switch
                on={overrides.quietHours ?? quietHours.enabled}
                onToggle={() => toggleReminder(quietHours)}
                disabled={saving !== null}
              />
            )}
          </View>

          <View style={{ height: 12, borderRadius: 999, backgroundColor: theme.color.surfaceSunken, marginTop: 20, marginBottom: 26, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.color.line, overflow: "hidden" }}>
            <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "25%", backgroundColor: theme.color.sleep, opacity: 0.85 }} />
            <View style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "16.7%", backgroundColor: theme.color.sleep, opacity: 0.85 }} />
          </View>
          <AppText display variant="title" style={{ textAlign: "center" }}>{quietHours?.config.schedule ?? "10:00 PM — 6:00 AM"}</AppText>
        </Card>
      </Reveal>

      <Reveal index={1}>
        <AppText variant="label" weight="bold" color="inkFaint" style={{ letterSpacing: 0.6, marginTop: 22, marginBottom: 10, marginHorizontal: 4 }}>REMINDERS</AppText>
        <View style={{ backgroundColor: theme.color.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.color.line, borderRadius: theme.radius.lg, overflow: "hidden" }}>
          {reminderRows.map((reminder, index) => (
            <View key={reminder.kind}>
              {index > 0 && <Divider />}
              <ReminderRow
                reminder={reminder}
                on={overrides[reminder.kind] ?? reminder.enabled}
                onToggle={() => toggleReminder(reminder)}
                saving={saving === reminder.kind}
                disabled={saving !== null}
              />
            </View>
          ))}
        </View>
        {error && <AppText variant="caption" color="danger" style={{ marginTop: 12, textAlign: "center" }}>{error}</AppText>}
      </Reveal>

      <Reveal index={2}>
        <AppText variant="caption" color="inkFaint" style={{ marginTop: 20, textAlign: "center", lineHeight: 17 }}>
          Alora uses on-device notifications only. With quiet hours off, feed and diaper repeat every 3 hours and bedtime repeats daily; quiet hours schedule the next safe reminder after 6:00 AM.
        </AppText>
      </Reveal>
    </ModalScreen>
  );
}

function findReminder(reminders: ReminderPreference[], kind: ReminderKind) {
  return reminders.find((reminder) => reminder.kind === kind);
}

function Divider() {
  const theme = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.color.line }} />;
}

function ReminderRow({ reminder, on, onToggle, saving, disabled }: { reminder: ReminderPreference; on: boolean; onToggle: () => void; saving: boolean; disabled: boolean }) {
  const theme = useTheme();
  const Icon = reminderIcon[reminder.kind];
  const color = reminderColor(theme, reminder.kind);
  return (
    <PressableScale scale={0.99} haptic="selection" disabled={disabled} onPress={onToggle} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 15, opacity: disabled && !saving ? 0.6 : 1 }}>
      <View style={{ width: 34, height: 34, borderRadius: theme.radius.sm, backgroundColor: color.tint, alignItems: "center", justifyContent: "center" }}>
        <Icon size={18} color={color.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="semibold">{reminder.config.label}</AppText>
        <AppText variant="caption" color="inkSoft">{saving ? "Saving..." : reminder.config.schedule}</AppText>
      </View>
      <Switch on={on} onToggle={onToggle} disabled={disabled} />
    </PressableScale>
  );
}

function Switch({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  const theme = useTheme();
  return (
    <PressableScale scale={1} disabled={disabled} onPress={onToggle} style={{ width: 46, height: 28, borderRadius: 999, padding: 3, backgroundColor: on ? theme.color.diaper : theme.color.surfaceSunken, borderWidth: StyleSheet.hairlineWidth, borderColor: on ? theme.color.diaper : theme.color.line, opacity: disabled ? 0.65 : 1 }}>
      <View style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: "#fff", transform: [{ translateX: on ? 18 : 0 }] }} />
    </PressableScale>
  );
}

const reminderIcon: Record<ReminderKind, ComponentType<IconProps>> = {
  feed: FeedIcon,
  diaper: DiaperIcon,
  bedtime: SleepIcon,
  quietHours: MoonIcon,
};

function reminderColor(theme: ReturnType<typeof useTheme>, kind: ReminderKind) {
  if (kind === "feed") return { tint: theme.color.feedTint, fg: theme.color.feed };
  if (kind === "diaper") return { tint: theme.color.diaperTint, fg: theme.color.diaper };
  return { tint: theme.color.sleepTint, fg: theme.color.sleep };
}
