import { useState } from "react";
import { View, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { AppText, PressableScale } from "./Themed";
import { PrimaryButton } from "./buttons";
import { Backdrop } from "./Backdrop";
import { getSupabase } from "../lib/supabase";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required.";
  if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  return null;
}

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const theme = useTheme();
  const router = useRouter();
  const signUp = mode === "sign-up";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<"name" | "email" | "password" | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);

    // Client-side validation before submission
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      setBusy(false);
      return;
    }
    const passwordErr = validatePassword(password);
    if (passwordErr) {
      setError(passwordErr);
      setBusy(false);
      return;
    }

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

  const inputStyle = (field: "name" | "email" | "password") =>
    ({
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.color.surface,
      borderWidth: theme.border.emphasis,
      borderColor: focused === field ? theme.color.accent : theme.color.line,
      fontFamily: theme.fonts.bodyRegular,
      fontSize: 16,
      color: theme.color.ink,
      marginTop: 12,
    }) as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.bg }}>
      <Backdrop />
      <View style={{ flex: 1, paddingHorizontal: 26, justifyContent: "center" }}>
        <AppText display variant="hero" weight="medium" style={{ fontSize: 44, lineHeight: 46 }}>
          Alora
        </AppText>
        <AppText
          variant="caption"
          color="inkFaint"
          weight="medium"
          style={{ letterSpacing: 1.2, marginTop: 6, textTransform: "uppercase" }}
        >
          The calm in the chaos.
        </AppText>
        <AppText display variant="title" color="inkSoft" style={{ marginTop: 22, marginBottom: 14 }}>
          {signUp ? "Create your family's calm, shared home." : "Welcome back."}
        </AppText>

        {signUp && (
          <TextInput
            placeholder="Your name"
            placeholderTextColor={theme.color.inkFaint}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            style={inputStyle("name")}
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused(null)}
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
          style={inputStyle("email")}
          onFocus={() => setFocused("email")}
          onBlur={() => setFocused(null)}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={theme.color.inkFaint}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={inputStyle("password")}
          onFocus={() => setFocused("password")}
          onBlur={() => setFocused(null)}
        />

        {error && (
          <AppText variant="caption" style={{ color: theme.color.danger, marginTop: 12 }}>
            {error}
          </AppText>
        )}

        <PrimaryButton
          label={signUp ? "Create account" : "Sign in"}
          loading={busy}
          disabled={busy || !email.trim() || !password}
          onPress={submit}
          style={{ marginTop: 22 }}
        />

        {!signUp && (
          <PressableScale
            scale={1}
            onPress={() => router.push("/forgot-password" as never)}
            style={{ marginTop: 14, alignItems: "center" }}
          >
            <AppText variant="caption" weight="semibold" color="accent">
              Forgot password?
            </AppText>
          </PressableScale>
        )}

        <PressableScale
          scale={1}
          onPress={() => router.replace(signUp ? "/sign-in" : "/sign-up")}
          style={{ marginTop: 18, alignItems: "center" }}
        >
          <AppText variant="body" color="inkSoft">
            {signUp ? "Already have an account? " : "New to Alora? "}
            <AppText variant="body" weight="bold" color="accent">
              {signUp ? "Sign in" : "Create one"}
            </AppText>
          </AppText>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}
