import { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../theme/ThemeProvider";
import { AppText, PressableScale } from "../../components/Themed";
import { ModalScreen } from "../../components/ModalScreen";
import { redeemInvite } from "../../data/useData";
import { clearPendingInviteCode, setPendingInviteCode } from "../../lib/pendingInvite";
import { useAuth } from "../../lib/useAuth";

export default function InviteAcceptanceScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { status } = useAuth();
  const params = useLocalSearchParams<{ code?: string }>();
  const code = typeof params.code === "string" ? params.code.trim().toUpperCase() : "";
  const [state, setState] = useState<"waiting" | "redeeming" | "success" | "error">("waiting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    setPendingInviteCode(code);
    if (status !== "signedIn") return;
    let cancelled = false;
    setState("redeeming");
    redeemInvite(code)
      .then(() => {
        if (cancelled) return;
        clearPendingInviteCode();
        setState("success");
        router.replace("/");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setState("error");
        setError(cause instanceof Error ? cause.message : "That invite could not be redeemed.");
      });
    return () => {
      cancelled = true;
    };
  }, [code, router, status]);

  return (
    <ModalScreen title="Join your family">
      <View style={{ gap: 14, paddingVertical: 12 }}>
        <AppText variant="body" color="inkSoft">
          Invite code
        </AppText>
        <AppText display variant="hero" weight="medium" style={{ color: theme.color.accent, letterSpacing: 4 }}>
          {code || "Invalid code"}
        </AppText>
        {status !== "signedIn" && (
          <AppText variant="body" color="inkSoft">
            Sign in or create your Alora account to join this family.
          </AppText>
        )}
        {state === "redeeming" && <AppText variant="body">Joining securely…</AppText>}
        {state === "error" && <AppText color="danger">{error}</AppText>}
        {state === "success" && <AppText color="positive">You’re in. Your family timeline is ready.</AppText>}
        {status !== "signedIn" && (
          <PressableScale
            onPress={() => router.replace("/sign-in")}
            style={{ alignItems: "center", paddingVertical: 14 }}
          >
            <AppText variant="body" weight="semibold" color="accent">
              Sign in to continue
            </AppText>
          </PressableScale>
        )}
      </View>
    </ModalScreen>
  );
}
