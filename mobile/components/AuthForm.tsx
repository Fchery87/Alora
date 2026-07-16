import { useState } from "react";
import { View, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { AppText, PressableScale } from "./Themed";
import { Backdrop } from "./Backdrop";
import { getSupabase } from "../lib/supabase";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const theme = useTheme();
  const router = useRouter();
  const signUp = mode === "sign-up";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const supabase = getSupabase();
      if (signUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name || "Caregiver" } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      // On success, onAuthStateChange drives the redirect (useProtectedRoute).
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.line,
    fontFamily: theme.fonts.bodyRegular,
    fontSize: 16,
    color: theme.color.ink,
    marginTop: 12,
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.bg }}>
      <Backdrop />
      <View style={{ flex: 1, paddingHorizontal: 26, justifyContent: "center" }}>
        <AppText display variant="hero" weight="medium" style={{ fontSize: 44, lineHeight: 46 }}>Alora</AppText>
        <AppText variant="heading" color="inkSoft" style={{ marginTop: 8, marginBottom: 26 }}>
          {signUp ? "Create your family's calm, shared home." : "Welcome back."}
        </AppText>

        {signUp && (
          <TextInput
            placeholder="Your name"
            placeholderTextColor={theme.color.inkFaint}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            style={inputStyle}
          />
        )}
        <TextInput
          placeholder="Email"
          placeholderTextColor={theme.color.inkFaint}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          style={inputStyle}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={theme.color.inkFaint}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={inputStyle}
        />

        {error && (
          <AppText variant="caption" style={{ color: theme.color.danger, marginTop: 12 }}>{error}</AppText>
        )}

        <PressableScale
          onPress={submit}
          disabled={busy || !email || !password}
          style={{ marginTop: 22, paddingVertical: 17, borderRadius: theme.radius.lg, backgroundColor: theme.color.accent, alignItems: "center", opacity: busy || !email || !password ? 0.6 : 1 }}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <AppText variant="heading" weight="bold" style={{ color: "#fff" }}>{signUp ? "Create account" : "Sign in"}</AppText>}
        </PressableScale>

        <PressableScale
          scale={1}
          onPress={() => router.replace(signUp ? "/sign-in" : "/sign-up")}
          style={{ marginTop: 18, alignItems: "center" }}
        >
          <AppText variant="body" color="inkSoft">
            {signUp ? "Already have an account? " : "New to Alora? "}
            <AppText variant="body" weight="bold" color="accent">{signUp ? "Sign in" : "Create one"}</AppText>
          </AppText>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}
