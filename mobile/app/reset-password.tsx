import { useState } from "react";
import { TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../theme/ThemeProvider";
import { AppText } from "../components/Themed";
import { PrimaryButton } from "../components/buttons";
import { ModalScreen } from "../components/ModalScreen";
import { getSupabase } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: updateError } = await getSupabase().auth.updateUser({ password });
      if (updateError) throw updateError;
      await signOut();
      router.replace("/sign-in");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't update your password.");
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surface,
    borderWidth: theme.border.emphasis,
    borderColor: theme.color.line,
    color: theme.color.ink,
    fontFamily: theme.fonts.bodyRegular,
    fontSize: 16,
  } as const;

  return (
    <ModalScreen title="Choose a new password">
      <View style={{ gap: 12 }}>
        <AppText variant="body" color="inkSoft">
          Your new password protects your family space on every device.
        </AppText>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="New password"
          placeholderTextColor={theme.color.inkFaint}
          style={inputStyle}
          accessibilityLabel="New password"
        />
        <TextInput
          value={confirmation}
          onChangeText={setConfirmation}
          secureTextEntry
          placeholder="Repeat password"
          placeholderTextColor={theme.color.inkFaint}
          style={inputStyle}
          accessibilityLabel="Repeat password"
        />
        {error && <AppText color="danger">{error}</AppText>}
        <PrimaryButton
          label="Save password"
          loading={busy}
          disabled={busy || !password || !confirmation}
          onPress={submit}
        />
      </View>
    </ModalScreen>
  );
}
