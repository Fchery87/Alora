import { Tabs } from "expo-router";
import { FloatingTabBar } from "../../components/FloatingTabBar";
import { useCaregiverCapabilities } from "../../domains/useCaregiverCapabilities";

export default function TabsLayout() {
  const { capabilities } = useCaregiverCapabilities();
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="log" options={{ title: "Log" }} />
      <Tabs.Screen name="timeline" options={{ title: "Timeline" }} />
      <Tabs.Screen
        name="checkin"
        options={{ title: "Check-In", href: capabilities.canViewCheckIn ? undefined : null }}
      />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
