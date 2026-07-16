import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_500Medium,
} from "@expo-google-fonts/fraunces";
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from "@expo-google-fonts/hanken-grotesk";
import { ThemeProvider, useThemeContext } from "../theme/ThemeProvider";
import { AuthProvider, useProtectedRoute } from "../lib/useAuth";

function ThemedStack() {
  const { theme, scheme } = useThemeContext();
  useProtectedRoute(); // redirects to /sign-in when signed out (no-op in demo mode)
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
  const [loaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider initial="dawn">
        <AuthProvider>
          <ThemedStack />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
