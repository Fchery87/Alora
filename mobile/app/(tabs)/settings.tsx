import { useState } from "react";
import { Share, View, StyleSheet } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useTheme, useThemeContext } from "../../theme/ThemeProvider";
import { AppText, PressableScale, ScreenScroll } from "../../components/Themed";
import { MoonIcon, BellIcon, CloudIcon, CheckInIcon, ChevronRight, PlusIcon, TimelineIcon } from "../../components/icons";
import { exportMyData } from "../../data/useData";

export default function SettingsScreen() {
  const theme = useTheme();
  const { scheme, toggleScheme } = useThemeContext();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

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
        <AppText display variant="display" weight="medium">Settings</AppText>
        <AppText variant="body" color="inkSoft" style={{ marginTop: 4 }}>Maya's family · 2 caregivers</AppText>
      </View>

      <GroupLabel>Caregivers</GroupLabel>
      <List>
        <Member initial="A" color={theme.color.feed} name="Alex (you)" sub="alex@email.com" role="Owner" roleBg={theme.color.feedTint} roleFg={theme.color.feed} />
        <Divider />
        <Member initial="S" color={theme.color.sleep} name="Sam" sub="Joined 3 weeks ago" role="Partner" roleBg={theme.color.sleepTint} roleFg={theme.color.sleep} />
        <Divider />
        <Row iconBg={theme.color.surface2} iconFg={theme.color.accent} Icon={PlusIcon} label="Invite a caregiver" chevron onPress={() => router.push("/invite")} />
      </List>

      <GroupLabel>Preferences</GroupLabel>
      <List>
        <Row iconBg={theme.color.sleepTint} iconFg={theme.color.sleep} Icon={MoonIcon} label="Night mode"
          right={<Switch on={scheme === "night"} onToggle={toggleScheme} />} onPress={toggleScheme} />
        <Divider />
        <Row iconBg={theme.color.feedTint} iconFg={theme.color.feed} Icon={BellIcon} label="Reminders & quiet hours" value="10pm–6am" chevron onPress={() => router.push("/reminders")} />
        <Divider />
        <Row iconBg={theme.color.surface2} iconFg={theme.color.inkSoft} Icon={TimelineIcon} label="View intro again" chevron onPress={() => router.push("/onboarding")} />
      </List>

      <GroupLabel>Privacy & trust</GroupLabel>
      <List>
        <Row iconBg={theme.color.diaperTint} iconFg={theme.color.diaper} Icon={CheckInIcon} label="Who can see what" chevron onPress={() => router.push("/trust")} />
        <Divider />
        <Row iconBg={theme.color.surface2} iconFg={theme.color.inkSoft} Icon={CloudIcon} label="Export my data" value={exporting ? "Preparing..." : "JSON"} chevron onPress={shareDataExport} />
        <Divider />
        <Row danger iconBg={theme.color.danger + "22"} iconFg={theme.color.danger} Icon={TrashIcon} label="Delete account" chevron onPress={() => router.push("/delete-account")} />
      </List>

      {exportError && <AppText variant="caption" color="danger" style={{ marginTop: 16, textAlign: "center", lineHeight: 17 }}>{exportError}</AppText>}

      <AppText variant="caption" color="inkFaint" style={{ marginTop: 24, textAlign: "center", lineHeight: 17 }}>
        Baby data is shared with your family. Check-ins are private to you.{"\n"}Alora · Quiet Dawn
      </AppText>
    </ScreenScroll>
  );
}

function GroupLabel({ children }: { children: string }) {
  return <AppText variant="label" weight="bold" color="inkFaint" style={{ letterSpacing: 0.6, marginTop: 22, marginBottom: 10, marginHorizontal: 4 }}>{children.toUpperCase()}</AppText>;
}

function List({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.color.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.color.line, borderRadius: theme.radius.lg, overflow: "hidden" }}>
      {children}
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.color.line }} />;
}

function Row({
  iconBg, iconFg, Icon, label, value, chevron, right, onPress, danger,
}: {
  iconBg: string; iconFg: string; Icon: (p: { size?: number; color?: string }) => React.ReactElement;
  label: string; value?: string; chevron?: boolean; right?: React.ReactNode; onPress?: () => void; danger?: boolean;
}) {
  const theme = useTheme();
  const content = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 15 }}>
      <View style={{ width: 34, height: 34, borderRadius: theme.radius.sm, backgroundColor: iconBg, alignItems: "center", justifyContent: "center" }}>
        <Icon size={18} color={iconFg} />
      </View>
      <AppText variant="body" weight="medium" style={{ flex: 1, color: danger ? theme.color.danger : theme.color.ink }}>{label}</AppText>
      {value && <AppText variant="body" color="inkFaint">{value}</AppText>}
      {right}
      {chevron && <ChevronRight size={18} color={theme.color.inkFaint} strokeWidth={2} />}
    </View>
  );
  return onPress ? <PressableScale scale={0.99} onPress={onPress}>{content}</PressableScale> : content;
}

function TrashIcon({ size = 18, color = "#000" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Member({ initial, color, name, sub, role, roleBg, roleFg }: { initial: string; color: string; name: string; sub: string; role: string; roleBg: string; roleFg: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 15 }}>
      <View style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: color, alignItems: "center", justifyContent: "center" }}>
        <AppText weight="bold" style={{ color: "#fff", fontSize: 14 }}>{initial}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="body" weight="semibold">{name}</AppText>
        <AppText variant="caption" color="inkSoft">{sub}</AppText>
      </View>
      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: roleBg }}>
        <AppText weight="bold" style={{ color: roleFg, fontSize: 10, letterSpacing: 0.3 }}>{role.toUpperCase()}</AppText>
      </View>
    </View>
  );
}

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const theme = useTheme();
  return (
    <PressableScale scale={1} onPress={onToggle}
      style={{ width: 46, height: 28, borderRadius: 999, padding: 3, backgroundColor: on ? theme.color.diaper : theme.color.surfaceSunken, borderWidth: StyleSheet.hairlineWidth, borderColor: on ? theme.color.diaper : theme.color.line }}>
      <View style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: "#fff", transform: [{ translateX: on ? 18 : 0 }] }} />
    </PressableScale>
  );
}
