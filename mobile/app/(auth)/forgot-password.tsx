import { useState } from "react";
import { TextInput, View } from "react-native";
import * as Linking from "expo-linking";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText } from "../../components/Themed";
import { PrimaryButton } from "../../components/buttons";
import { ModalScreen } from "../../components/ModalScreen";
import { getSupabase } from "../../lib/supabase";

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy || !email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const { error: resetError } = await getSupabase().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: Linking.createURL("/reset-password"),
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't send a reset link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalScreen title="Reset your password">
      <View style={{ gap: 14 }}>
        <AppText variant="body" color="inkSoft">
          Enter your email and we’ll send a secure link to choose a new password.
        </AppText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder="Email"
          placeholderTextColor={theme.color.inkFaint}
          style={{
            padding: 16,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.color.surface,
            borderWidth: theme.border.emphasis,
            borderColor: theme.color.line,
            color: theme.color.ink,
            fontFamily: theme.fonts.bodyRegular,
            fontSize: 16,
          }}
          accessibilityLabel="Email address"
        />
        {error && <AppText color="danger">{error}</AppText>}
        {sent && (
          <AppText variant="body" color="positive">
            Check your inbox. The link opens Alora and expires shortly.
          </AppText>
        )}
        <PrimaryButton
          label={sent ? "Send again" : "Email reset link"}
          loading={busy}
          disabled={busy || !email.trim()}
          onPress={submit}
        />
      </View>
    </ModalScreen>
  );
}
