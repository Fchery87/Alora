import type { ReactNode } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../theme/ThemeProvider";
import { AppText, PressableScale } from "./Themed";
import { Backdrop } from "./Backdrop";

/** Sheet/modal chrome: title + close, scrollable body. Used by the flow modals. */
export function ModalScreen({
  title,
  children,
  scroll = true,
}: {
  title: string;
  children: ReactNode;
  scroll?: boolean;
}) {
  const theme = useTheme();
  const router = useRouter();

  const header = (
    <View style={styles.bar}>
      <AppText display variant="title" weight="medium">{title}</AppText>
      <PressableScale
        scale={0.9}
        onPress={() => router.back()}
        style={{ width: 36, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: theme.color.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.color.line }}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M6 6l12 12M18 6 6 18" stroke={theme.color.ink} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </PressableScale>
    </View>
  );

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: theme.color.bg }}>
      <Backdrop />
      {header}
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 30 }}>
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 24 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 10,
  },
});
