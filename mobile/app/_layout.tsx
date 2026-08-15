import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_500Medium } from "@expo-google-fonts/playfair-display";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { ThemeProvider, useThemeContext } from "../theme/ThemeProvider";
import { AuthProvider, useAuth, useProtectedRoute } from "../lib/useAuth";
import { useFamilyMembers } from "../data/useData";
import { ErrorBoundaryClass } from "../components/ErrorBoundary";
import { RuntimeGate, RuntimeProvider } from "../runtime/RuntimeProvider";
// Initialize crash reporting (Sentry) before anything renders — no-op in dev.
import "../lib/crashReporting";
import { getPendingInviteCode } from "../lib/pendingInvite";

function ThemedStack() {
  const { theme, scheme } = useThemeContext();
  const { status } = useAuth();
  const members = useFamilyMembers();
  const router = useRouter();
  const segments = useSegments();
  useProtectedRoute(); // redirects to /sign-in when signed out (no-op in demo mode)
  const memberCount = members.status === "ready" ? members.data.length : null;

  useEffect(() => {
    const pendingInvite = getPendingInviteCode();
    if (status === "signedIn" && pendingInvite && segments[0] !== "invite") {
      router.replace(`/invite/${pendingInvite}` as never);
      return;
    }
    if (status !== "signedIn" || memberCount !== 0 || pendingInvite) return;
    if (segments[0] !== "onboarding") router.replace("/onboarding");
  }, [memberCount, router, segments, status]);

  return (
    <>
      <StatusBar style={scheme === "night" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.color.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="reset-password" options={{ presentation: "modal" }} />
        <Stack.Screen name="invite" options={{ presentation: "modal" }} />
        <Stack.Screen name="delete-account" options={{ presentation: "modal" }} />
        <Stack.Screen name="trust" options={{ presentation: "modal" }} />
        <Stack.Screen name="reminders" options={{ presentation: "modal" }} />
        <Stack.Screen name="merge" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundaryClass>
      <FontBoundary />
    </ErrorBoundaryClass>
  );
}

function FontBoundary() {
  const [attempt, setAttempt] = useState(0);
  return <FontLoader key={attempt} onRetry={() => setAttempt((value) => value + 1)} />;
}

function FontLoader({ onRetry }: { onRetry: () => void }) {
  const [loaded, error] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (error) return <BootFailure message="Alora could not load its fonts." onRetry={onRetry} />;
  if (!loaded) return <BootLoading />;

  return (
    <SafeAreaProvider>
      <ThemeProvider initial="dawn">
        <AuthProvider>
          <RuntimeProvider>
            <RuntimeGate>
              <ThemedStack />
            </RuntimeGate>
          </RuntimeProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function BootLoading() {
  return (
    <View style={bootStyles.container} accessibilityRole="progressbar" accessibilityLabel="Loading Alora">
      <Text style={bootStyles.brand}>Alora</Text>
      <Text style={bootStyles.body}>Preparing your private care space…</Text>
    </View>
  );
}

function BootFailure({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={bootStyles.container}>
      <Text style={bootStyles.brand}>Alora</Text>
      <Text style={bootStyles.heading}>Alora could not start</Text>
      <Text style={bootStyles.body}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry font loading"
        onPress={onRetry}
        style={bootStyles.button}
      >
        <Text style={bootStyles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const bootStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    backgroundColor: "#FAF8F5",
  },
  brand: { color: "#141113", fontSize: 44, fontWeight: "500", marginBottom: 12 },
  heading: { color: "#141113", fontSize: 22, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  body: { color: "#5F5759", textAlign: "center", marginBottom: 20 },
  button: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16, backgroundColor: "#6A5AE0" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
