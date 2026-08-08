import { Linking, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useTheme } from "../theme/ThemeProvider";
import { ModalScreen } from "../components/ModalScreen";
import { AppText, PressableScale, Skeleton } from "../components/Themed";
import { Reveal } from "../components/Reveal";
import { sinceLabel } from "../data/mock";
import type { AuditLogEntry, SupportResource } from "../data/repository";
import { useAuditLog, useBabyStatus, useFamilyMembers, useSupportResources } from "../data/useData";
import { env } from "../config/env";
import type { ColorTokens } from "../theme/tokens";

export default function TrustScreen() {
  const theme = useTheme();
  const resources = useSupportResources();
  const auditLog = useAuditLog();
  const baby = useBabyStatus();
  const members = useFamilyMembers();
  const babyName = baby.status === "ready" ? baby.data.name : "your baby";
  const partnerName =
    members.status === "ready"
      ? (members.data.find((m) => !m.isSelf)?.displayName ?? "your caregiver")
      : "your caregiver";
  const sharedWho = `You + ${partnerName}`;

  return (
    <ModalScreen title="Who can see what">
      <AppText variant="body" color="inkSoft" style={{ marginBottom: 6 }}>
        No ads. No data selling. Export and leave anytime — here’s exactly where everything lives.
      </AppText>

      <Reveal index={0}>
        <Group label="Shared with your family" labelColor="feed">
          <TrustRow tone="feed" title="Feeds, diapers & sleep" sub="Every logged event" who={sharedWho} />
          <Divider />
          <TrustRow tone="feed" title="Timeline & history" sub="Who did what, when" who={sharedWho} />
          <Divider />
          <TrustRow tone="feed" title={`${babyName}'s profile`} sub="Name, age, basics" who="You + caregiver" />
        </Group>
      </Reveal>

      <Reveal index={1}>
        <Group label="Private to you" labelColor="diaper">
          <TrustRow tone="diaper" title="Daily check-ins" sub="Your mood entries" who="Only you" />
          <Divider />
          <TrustRow tone="diaper" title="Reflections" sub="Anything you write" who="Only you" />
        </Group>
      </Reveal>

      <Reveal index={2}>
        <Group label="Owner only" labelColor="inkFaint">
          <TrustRow tone="neutral" title="Account & family settings" sub="Invites, deletion, roles" who="Owner" />
        </Group>
      </Reveal>

      <Reveal index={3}>
        <Group label="Recent audit log" labelColor="feed">
          {auditLog.status === "loading" ? (
            <ListSkeleton />
          ) : auditLog.status === "error" ? (
            <ErrorRow title="Couldn't load audit log" message={auditLog.error.message} />
          ) : (
            auditLog.data.map((entry, index) => (
              <View key={entry.id}>
                {index > 0 && <Divider />}
                <AuditRow entry={entry} />
              </View>
            ))
          )}
        </Group>
      </Reveal>

      <Reveal index={4}>
        <Group label="Support resources" labelColor="sleep">
          {resources.status === "loading" ? (
            <ListSkeleton />
          ) : resources.status === "error" ? (
            <ErrorRow title="Couldn't load resources" message={resources.error.message} />
          ) : (
            resources.data.map((resource, index) => (
              <View key={resource.id}>
                {index > 0 && <Divider />}
                <ResourceRow resource={resource} />
              </View>
            ))
          )}
        </Group>
      </Reveal>

      <Reveal index={5}>
        {env.privacyPolicyUrl ? (
          <PressableScale
            scale={0.99}
            onPress={() => Linking.openURL(env.privacyPolicyUrl)}
            style={{
              marginTop: 18,
              paddingVertical: 13,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.color.surface,
              borderWidth: theme.border.hairline,
              borderColor: theme.color.line,
              alignItems: "center",
            }}
          >
            <AppText variant="body" weight="semibold" style={{ color: theme.color.inkSoft }}>
              Privacy policy
            </AppText>
          </PressableScale>
        ) : null}
        <AppText variant="caption" color="inkFaint" style={{ marginTop: 20, textAlign: "center", lineHeight: 17 }}>
          Your check-ins are stored privately and never sync to another caregiver’s device.{"\n"}
          No ads. No data selling. Export and leave anytime.
        </AppText>
      </Reveal>
    </ModalScreen>
  );
}

function Group({
  label,
  labelColor,
  children,
}: {
  label: string;
  labelColor: keyof ColorTokens;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={{ marginTop: 20 }}>
      <AppText
        variant="label"
        weight="bold"
        style={{ color: theme.color[labelColor], letterSpacing: 0.6, marginBottom: 10, marginHorizontal: 4 }}
      >
        {label.toUpperCase()}
      </AppText>
      <View
        style={{
          backgroundColor: theme.color.surface,
          borderWidth: theme.border.hairline,
          borderColor: theme.color.line,
          borderRadius: theme.radius.lg,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={{ height: theme.border.hairline, backgroundColor: theme.color.line }} />;
}

function TrustRow({
  tone,
  title,
  sub,
  who,
}: {
  tone: "feed" | "diaper" | "neutral";
  title: string;
  sub: string;
  who: string;
}) {
  const theme = useTheme();
  const map = {
    feed: { bg: theme.color.feedTint, fg: theme.color.feed },
    diaper: { bg: theme.color.diaperTint, fg: theme.color.diaper },
    neutral: { bg: theme.color.surface2, fg: theme.color.inkSoft },
  }[tone];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 15 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: theme.radius.sm,
          backgroundColor: map.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {tone === "diaper" ? (
          <Lock color={map.fg} />
        ) : tone === "feed" ? (
          <Users color={map.fg} />
        ) : (
          <Key color={map.fg} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="semibold">
          {title}
        </AppText>
        <AppText variant="caption" color="inkSoft">
          {sub}
        </AppText>
      </View>
      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: map.bg }}>
        <AppText weight="bold" style={{ color: map.fg, fontSize: 10, letterSpacing: 0.3 }}>
          {who.toUpperCase()}
        </AppText>
      </View>
    </View>
  );
}

function AuditRow({ entry }: { entry: AuditLogEntry }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 15 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.color.feedTint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Key color={theme.color.feed} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <AppText variant="body" weight="semibold" style={{ flex: 1 }}>
            {entry.action}
          </AppText>
          <AppText variant="caption" color="inkFaint">
            {sinceLabel(entry.at)}
          </AppText>
        </View>
        <AppText variant="caption" color="inkSoft" style={{ marginTop: 3, lineHeight: 17 }}>
          {entry.detail}
        </AppText>
        <AppText weight="bold" style={{ color: theme.color.feed, fontSize: 10, letterSpacing: 0.3, marginTop: 7 }}>
          {entry.actor.toUpperCase()}
        </AppText>
      </View>
    </View>
  );
}

function ResourceRow({ resource }: { resource: SupportResource }) {
  const theme = useTheme();
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 15 }}>
      <AppText variant="body" weight="semibold">
        {resource.title}
      </AppText>
      <AppText variant="caption" color="inkSoft" style={{ marginTop: 3, lineHeight: 17 }}>
        {resource.description}
      </AppText>
      <PressableScale
        scale={0.98}
        style={{
          alignSelf: "flex-start",
          marginTop: 10,
          paddingHorizontal: 11,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: theme.color.sleepTint,
        }}
      >
        <AppText weight="bold" style={{ color: theme.color.sleep, fontSize: 11 }}>
          {resource.actionLabel}
        </AppText>
      </PressableScale>
    </View>
  );
}

function ErrorRow({ title, message }: { title: string; message: string }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 15 }}>
      <AppText variant="body" weight="semibold" color="danger">
        {title}
      </AppText>
      <AppText variant="caption" color="inkSoft" style={{ marginTop: 4 }}>
        {message}
      </AppText>
    </View>
  );
}

function ListSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 15, gap: 8 }}>
      <Skeleton style={{ width: "72%", height: 14 }} />
      <Skeleton style={{ width: "94%", height: 10 }} />
      <Skeleton style={{ width: 92, height: 26, borderRadius: 999, marginTop: 3 }} />
      <View style={{ height: theme.border.hairline, backgroundColor: theme.color.line, marginVertical: 4 }} />
      <Skeleton style={{ width: "58%", height: 14 }} />
      <Skeleton style={{ width: "88%", height: 10 }} />
    </View>
  );
}

function Users({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="3" stroke={color} strokeWidth={1.7} />
      <Path
        d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.2a3 3 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-2.3-4.5"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Lock({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect
        x="5"
        y="11"
        width="14"
        height="9"
        rx="2"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Key({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="15" r="3.5" stroke={color} strokeWidth={1.7} />
      <Path
        d="M10.5 12.5 19 4M16 7l2 2M14 9l1.5 1.5"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
