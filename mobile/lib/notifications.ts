import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { ReminderKind, ReminderPreference } from "../data/repository";
import { reminderSchedulePlans, type ReminderSchedulePlan } from "./reminderSchedule";

const CHANNEL_ID = "alora-reminders";
const SCHEDULABLE_REMINDERS: ReminderKind[] = ["feed", "diaper", "bedtime"];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function syncReminderNotifications(preferences: ReminderPreference[]) {
  const quietHours = preferences.find((reminder) => reminder.kind === "quietHours");
  const quietHoursEnabled = quietHours?.enabled ?? false;
  const enabledReminders = preferences.filter((reminder) => reminder.enabled && SCHEDULABLE_REMINDERS.includes(reminder.kind));
  if (!enabledReminders.length) {
    await cancelAllReminderNotifications();
    return "off";
  }

  const permissionGranted = await ensureNotificationPermission();
  if (!permissionGranted) throw new Error("Notifications are off. Enable them in system settings to schedule reminders.");

  await cancelAllReminderNotifications();
  const requests = enabledReminders.flatMap((reminder) => notificationRequestsFor(reminder, quietHoursEnabled));
  for (const request of requests) {
    await Notifications.scheduleNotificationAsync(request);
  }
  return requests.length > 0 ? "scheduled" : "quiet-hours";
}

export async function syncReminderNotification(reminder: ReminderPreference, enabled: boolean) {
  return syncReminderNotifications([{ ...reminder, enabled }]);
}

export async function cancelReminderNotification(kind: ReminderKind) {
  await Promise.all(requestIdentifiersFor(kind).map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

async function cancelAllReminderNotifications() {
  await Promise.all(SCHEDULABLE_REMINDERS.flatMap(requestIdentifiersFor).map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

async function ensureNotificationPermission() {
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

function notificationRequestsFor(reminder: ReminderPreference, quietHoursEnabled: boolean): Notifications.NotificationRequestInput[] {
  const content = notificationContentFor(reminder.kind);
  const channelId = Platform.OS === "android" ? CHANNEL_ID : undefined;
  return reminderSchedulePlans(reminder.kind, quietHoursEnabled).map((plan, index) => ({
    identifier: requestIdentifierFor(reminder.kind, index),
    content,
    trigger: triggerForPlan(plan, channelId),
  }));
}

function triggerForPlan(plan: ReminderSchedulePlan, channelId: string | undefined): Notifications.NotificationTriggerInput {
  if (plan.kind === "timeInterval") {
    return { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: plan.seconds, repeats: plan.repeats, channelId };
  }

  return { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: plan.hour, minute: plan.minute, channelId };
}

function requestIdentifiersFor(kind: ReminderKind) {
  return [`alora-reminder-${kind}`, ...reminderSchedulePlans(kind, true).map((_, index) => requestIdentifierFor(kind, index))];
}

function requestIdentifierFor(kind: ReminderKind, index: number) {
  return `alora-reminder-${kind}-${index}`;
}

function notificationContentFor(kind: ReminderKind): Notifications.NotificationContentInput {
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
    body: "Start Maya's bedtime wind-down.",
    sound: true,
    data: { reminderKind: kind, route: "/reminders" },
  };
}
