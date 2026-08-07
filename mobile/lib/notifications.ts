import { Platform } from "react-native";
import type * as Notifications from "expo-notifications";
import type { ReminderKind, ReminderPreference } from "../data/repository";
import { reminderSchedulePlans, type ReminderSchedulePlan } from "./reminderSchedule";
import { repository } from "../data/useData";

const CHANNEL_ID = "alora-reminders";
const SCHEDULABLE_REMINDERS: ReminderKind[] = ["feed", "diaper", "bedtime"];

/**
 * expo-notifications throws at IMPORT time inside Expo Go on SDK 53+ (the
 * module detects the Expo Go runtime and errors out). A static import would
 * crash the whole app there, so the module is loaded lazily and guarded:
 * when it can't load, every reminder function degrades to a no-op and the
 * app keeps running. Notifications require a development build
 * (`npx expo run:android` / EAS Build).
 */
let notificationsModule: typeof import("expo-notifications") | null | undefined;

async function loadNotifications(): Promise<typeof import("expo-notifications") | null> {
  if (notificationsModule !== undefined) return notificationsModule;
  try {
    const mod = await import("expo-notifications");
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    notificationsModule = mod;
  } catch (err) {
    console.warn(
      "[notifications] expo-notifications is unavailable in this runtime (Expo Go on SDK 53+?) — reminders will not schedule.",
      err,
    );
    notificationsModule = null;
  }
  return notificationsModule;
}

export async function syncReminderNotifications(preferences: ReminderPreference[]) {
  const Notifications = await loadNotifications();
  if (!Notifications) return "unsupported";

  const quietHours = preferences.find((reminder) => reminder.kind === "quietHours");
  const quietHoursEnabled = quietHours?.enabled ?? false;
  const enabledReminders = preferences.filter(
    (reminder) => reminder.enabled && SCHEDULABLE_REMINDERS.includes(reminder.kind),
  );
  if (!enabledReminders.length) {
    await cancelAllReminderNotifications();
    return "off";
  }

  const permissionGranted = await ensureNotificationPermission(Notifications);
  if (!permissionGranted)
    throw new Error("Notifications are off. Enable them in system settings to schedule reminders.");

  await cancelAllReminderNotifications();
  const requestLists = await Promise.all(
    enabledReminders.map((reminder) => notificationRequestsFor(reminder, quietHoursEnabled)),
  );
  const requests = requestLists.flat();
  for (const request of requests) {
    await Notifications.scheduleNotificationAsync(request);
  }
  return requests.length > 0 ? "scheduled" : "quiet-hours";
}

export async function syncReminderNotification(reminder: ReminderPreference, enabled: boolean) {
  return syncReminderNotifications([{ ...reminder, enabled }]);
}

export async function cancelReminderNotification(kind: ReminderKind) {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Promise.all(requestIdentifiersFor(kind).map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

/** True when the notifications module loaded (dev builds); false in Expo Go. */
export async function isNotificationsSupported(): Promise<boolean> {
  return (await loadNotifications()) !== null;
}

async function cancelAllReminderNotifications() {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Promise.all(
    SCHEDULABLE_REMINDERS.flatMap(requestIdentifiersFor).map((id) =>
      Notifications.cancelScheduledNotificationAsync(id),
    ),
  );
}

async function ensureNotificationPermission(Notifications: typeof import("expo-notifications")) {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Alora reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: "#E9B384",
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

async function notificationRequestsFor(
  reminder: ReminderPreference,
  quietHoursEnabled: boolean,
): Promise<Notifications.NotificationRequestInput[]> {
  const name = await babyName();
  const content = notificationContentFor(reminder.kind, name);
  const channelId = Platform.OS === "android" ? CHANNEL_ID : undefined;
  return reminderSchedulePlans(reminder.kind, quietHoursEnabled).map((plan, index) => ({
    identifier: requestIdentifierFor(reminder.kind, index),
    content,
    trigger: triggerForPlan(plan, channelId),
  }));
}

function triggerForPlan(
  plan: ReminderSchedulePlan,
  channelId: string | undefined,
): Notifications.NotificationTriggerInput {
  if (plan.kind === "timeInterval") {
    return {
      // String-literal triggers: the enum is a runtime value, so it can't
      // come from the type-only import — the literals are its exact values.
      type: "timeInterval" as Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: plan.seconds,
      repeats: plan.repeats,
      channelId,
    };
  }

  return {
    type: "daily" as Notifications.SchedulableTriggerInputTypes.DAILY,
    hour: plan.hour,
    minute: plan.minute,
    channelId,
  };
}

function requestIdentifiersFor(kind: ReminderKind) {
  return [
    `alora-reminder-${kind}`,
    ...reminderSchedulePlans(kind, true).map((_, index) => requestIdentifierFor(kind, index)),
  ];
}

function requestIdentifierFor(kind: ReminderKind, index: number) {
  return `alora-reminder-${kind}-${index}`;
}

async function babyName(): Promise<string> {
  try {
    const status = await repository.getBabyStatus();
    return status.name || "your baby";
  } catch {
    return "your baby";
  }
}

function notificationContentFor(kind: ReminderKind, baby: string): Notifications.NotificationContentInput {
  if (kind === "feed") {
    return {
      title: "Feed reminder",
      body: "It has been about 3 hours since the last feed reminder.",
      sound: true,
      data: { reminderKind: kind, route: "/log" },
    };
  }

  if (kind === "diaper") {
    return {
      title: "Diaper check",
      body: "Time for a gentle diaper check.",
      sound: true,
      data: { reminderKind: kind, route: "/log" },
    };
  }

  return {
    title: "Bedtime routine",
    body: `Start ${baby}’s bedtime wind-down.`,
    sound: true,
    data: { reminderKind: kind, route: "/reminders" },
  };
}
