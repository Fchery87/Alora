import { useState } from "react";
import { Share, View, StyleSheet } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";
import { useTheme, useThemeContext } from "../../theme/ThemeProvider";
import { AppText, PressableScale, ScreenScroll } from "../../components/Themed";
import {
  TrashIcon,
  DocIcon,
  SeatIcon,
  MoonIcon,
  BellIcon,
  CloudIcon,
  CheckInIcon,
  ChevronRight,
  PlusIcon,
  GrowthIcon,
  TimelineIcon,
} from "../../components/icons";
import {
  exportMyData,
  useBabyStatus,
  useFamilyMembers,
  useReminderPreferences,
  useSeatLimit,
} from "../../data/useData";
import { sinceLabel } from "../../data/mock";
import * as Print from "expo-print";
import { buildPediatricReportHTML } from "../../lib/pediatricReport";

export default function SettingsScreen() {
  const theme = useTheme();
  const { scheme, toggleScheme } = useThemeContext();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function sharePediatricReport() {
    if (exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      const data = await exportMyData();
      const { uri } = await Print.printToFileAsync({ html: buildPediatricReportHTML(data) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: "Alora pediatrician report",
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
        });
      } else {
        await Share.share({ title: "Alora pediatrician report", message: uri });
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Couldn't prepare the report.");
    } finally {
      setExporting(false);
    }
  }

  const baby = useBabyStatus();
  const members = useFamilyMembers();
  const prefs = useReminderPreferences();
  const seatLimitState = useSeatLimit();
  const babyName = baby.status === "ready" && baby.data.name ? baby.data.name : null;
  const memberCount = members.status === "ready" ? members.data.length : 0;
  const quietHours = prefs.status === "ready" ? prefs.data.find((p) => p.kind === "quietHours") : undefined;
  const familyLabel = babyName ? `${babyName}’s family` : "Your family";
  const myRole = members.status === "ready" ? members.data.find((m) => m.isSelf)?.role : undefined;
  const isLimited = myRole === "limited";
  const seatLimit = seatLimitState.status === "ready" ? seatLimitState.data : undefined;

  async function shareDataExport() {
    if (exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      const data = await exportMyData();
      const message = JSON.stringify(data, null, 2);
      const fileName = `alora-export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

      if (await Sharing.isAvailableAsync()) {
        const file = new File(Paths.cache, fileName);
        file.write(message);
        await Sharing.shareAsync(file.uri, {
          dialogTitle: "Alora data export",
          mimeType: "application/json",
          UTI: "public.json",
        });
      } else {
        await Share.share({
          title: "Alora data export",
          message,
        });
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Couldn't export your data.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <ScreenScroll>
      <View style={{ paddingTop: 8, paddingBottom: 18 }}>
        <AppText display variant="display" weight="medium">
          Settings
        </AppText>
        <AppText variant="body" color="inkSoft" style={{ marginTop: 4 }}>
          {familyLabel}
          {memberCount > 0 ? ` · ${memberCount} caregiver${memberCount > 1 ? "s" : ""}` : ""}
        </AppText>
      </View>

      <GroupLabel>Caregivers</GroupLabel>
      <List>
        {members.status === "ready" &&
          members.data.map((member, index) => {
            const roleLabel = member.role === "owner" ? "Owner" : member.role === "limited" ? "Limited" : "Partner";
            const roleColor =
              member.role === "owner"
                ? theme.color.feed
                : member.role === "limited"
                  ? theme.color.diaper
                  : theme.color.sleep;
            const roleBg =
              member.role === "owner"
                ? theme.color.feedTint
                : member.role === "limited"
                  ? theme.color.diaperTint
                  : theme.color.sleepTint;
            return (
              <View key={member.userId}>
                {index > 0 && <Divider />}
                <Member
                  initial={(member.displayName.charAt(0) || "C").toUpperCase()}
                  color={roleColor}
                  name={member.isSelf ? `${member.displayName} (you)` : member.displayName}
                  sub={`${roleLabel}${member.role === "limited" ? " · grandparent/nanny" : ""} · joined ${sinceLabel(member.joinedAt)}`}
                  role={roleLabel}
                  roleBg={roleBg}
                  roleFg={roleColor}
                />
              </View>
            );
          })}
        {members.status === "loading" && (
          <Member
            initial="…"
            color={theme.color.ink}
            name="Loading caregivers…"
            sub=""
            role=""
            roleBg={theme.color.surface2}
            roleFg={theme.color.inkFaint}
          />
        )}
        {!isLimited && (
          <>
            <Divider />
            <Row
              iconBg={theme.color.surface2}
              iconFg={theme.color.accent}
              Icon={PlusIcon}
              label="Invite a caregiver"
              chevron
              onPress={() => router.push("/invite")}
            />
            <Divider />
            <Row
              iconBg={theme.color.surface2}
              iconFg={theme.color.inkSoft}
              Icon={SeatIcon}
              label="Caregiver seat limit"
              value={seatLimit == null ? "No limit" : String(seatLimit)}
              chevron
              onPress={() => router.push("/seat-limit")}
            />
          </>
        )}
      </List>

      <GroupLabel>Preferences</GroupLabel>
      <List>
        <Row
          iconBg={theme.color.sleepTint}
          iconFg={theme.color.sleep}
          Icon={MoonIcon}
          label="Night mode"
          right={<Switch on={scheme === "night"} onToggle={toggleScheme} />}
          onPress={toggleScheme}
        />
        <Divider />
        <Row
          iconBg={theme.color.feedTint}
          iconFg={theme.color.feed}
          Icon={BellIcon}
          label="Reminders & quiet hours"
          value={quietHours?.config.schedule ?? "Set schedule"}
          chevron
          onPress={() => router.push("/reminders")}
        />
        <Divider />
        <Row
          iconBg={theme.color.surface2}
          iconFg={theme.color.accent}
          Icon={GrowthIcon}
          label="Growth charts"
          value="WHO reference"
          chevron
          onPress={() => router.push("/growth")}
        />
        <Divider />
        <Row
          iconBg={theme.color.surface2}
          iconFg={theme.color.inkSoft}
          Icon={TimelineIcon}
          label="View intro again"
          chevron
          onPress={() => router.push("/onboarding")}
        />
      </List>

      <GroupLabel>Privacy & trust</GroupLabel>
      <List>
        {!isLimited && (
          <>
            <Row
              iconBg={theme.color.diaperTint}
              iconFg={theme.color.diaper}
              Icon={CheckInIcon}
              label="Who can see what"
              chevron
              onPress={() => router.push("/trust")}
            />
            <Divider />
            <Row
              iconBg={theme.color.surface2}
              iconFg={theme.color.inkSoft}
              Icon={CloudIcon}
              label="Export my data"
              value={exporting ? "Preparing..." : "JSON"}
              chevron
              onPress={shareDataExport}
            />
            <Divider />
            <Row
              iconBg={theme.color.surface2}
              iconFg={theme.color.inkSoft}
              Icon={DocIcon}
              label="Pediatrician report"
              value={exporting ? "Preparing..." : "PDF"}
              chevron
              onPress={sharePediatricReport}
            />
            <Divider />
            <Row
              danger
              iconBg={theme.color.danger + "22"}
              iconFg={theme.color.danger}
              Icon={TrashIcon}
              label="Delete account"
              chevron
              onPress={() => router.push("/delete-account")}
            />
          </>
        )}
      </List>

      {exportError && (
        <AppText variant="caption" color="danger" style={{ marginTop: 16, textAlign: "center", lineHeight: 17 }}>
          {exportError}
        </AppText>
      )}

      <AppText variant="caption" color="inkFaint" style={{ marginTop: 24, textAlign: "center", lineHeight: 17 }}>
        Baby data is shared with your family. Check-ins are private to you.{"\n"}
        No ads. No data selling. Export and leave anytime.{"\n"}Alora · Quiet Dawn
      </AppText>
    </ScreenScroll>
  );
}

function GroupLabel({ children }: { children: string }) {
  return (
    <AppText
      variant="label"
      weight="bold"
      color="inkFaint"
      style={{ letterSpacing: 0.6, marginTop: 22, marginBottom: 10, marginHorizontal: 4 }}
    >
      {children.toUpperCase()}
    </AppText>
  );
}

function List({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.color.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.color.line,
        borderRadius: theme.radius.lg,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.color.line }} />;
}

function Row({
  iconBg,
  iconFg,
  Icon,
  label,
  value,
  chevron,
  right,
  onPress,
  danger,
}: {
  iconBg: string;
  iconFg: string;
  Icon: (p: { size?: number; color?: string }) => React.ReactElement;
  label: string;
  value?: string;
  chevron?: boolean;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const theme = useTheme();
  const content = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 15 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: theme.radius.sm,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color={iconFg} />
      </View>
      <AppText variant="body" weight="medium" style={{ flex: 1, color: danger ? theme.color.danger : theme.color.ink }}>
        {label}
      </AppText>
      {value && (
        <AppText variant="body" color="inkFaint">
          {value}
        </AppText>
      )}
      {right}
      {chevron && <ChevronRight size={18} color={theme.color.inkFaint} strokeWidth={2} />}
    </View>
  );
  return onPress ? (
    <PressableScale scale={0.99} onPress={onPress}>
      {content}
    </PressableScale>
  ) : (
    content
  );
}

function Member({
  initial,
  color,
  name,
  sub,
  role,
  roleBg,
  roleFg,
}: {
  initial: string;
  color: string;
  name: string;
  sub: string;
  role: string;
  roleBg: string;
  roleFg: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 15 }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 999,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppText weight="bold" style={{ color: theme.color.onAccent, fontSize: 14 }}>
          {initial}
        </AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="semibold">
          {name}
        </AppText>
        <AppText variant="caption" color="inkSoft">
          {sub}
        </AppText>
      </View>
      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: roleBg }}>
        <AppText weight="bold" style={{ color: roleFg, fontSize: 10, letterSpacing: 0.3 }}>
          {role.toUpperCase()}
        </AppText>
      </View>
    </View>
  );
}

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const theme = useTheme();
  return (
    <PressableScale
      scale={1}
      onPress={onToggle}
      style={{
        width: 46,
        height: 28,
        borderRadius: 999,
        padding: 3,
        backgroundColor: on ? theme.color.diaper : theme.color.surfaceSunken,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: on ? theme.color.diaper : theme.color.line,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          backgroundColor: theme.scheme === "night" ? theme.color.ink : "#fff",
          transform: [{ translateX: on ? 18 : 0 }],
        }}
      />
    </PressableScale>
  );
}
