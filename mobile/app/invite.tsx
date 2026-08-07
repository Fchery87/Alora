import { useEffect, useState } from "react";
import { Share as NativeShare, View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../theme/ThemeProvider";
import { ModalScreen } from "../components/ModalScreen";
import { AppText, PressableScale } from "../components/Themed";
import { ChevronRight } from "../components/icons";
import type { InviteCode } from "../data/repository";
import { generateInvite, revokeInvite, useBabyStatus, useInvite } from "../data/useData";

type InviteAction = null | "share" | "revoke" | "generate";

export default function InviteScreen() {
  const theme = useTheme();
  const inviteState = useInvite();
  const baby = useBabyStatus();
  const familyName = baby.status === "ready" && baby.data.name ? `${baby.data.name}’s family` : "your family";
  const [invite, setInvite] = useState<InviteCode | null>(null);
  const [action, setAction] = useState<InviteAction>(null);
  const [error, setError] = useState<string | null>(null);

  const loadedInvite = inviteState.status === "ready" ? inviteState.data : null;

  useEffect(() => {
    if (loadedInvite) setInvite(loadedInvite);
  }, [loadedInvite]);

  const busy = inviteState.status === "loading" || action !== null;
  const revoked = invite?.revoked ?? false;

  async function shareInvite() {
    if (!invite || busy) return;
    setAction("share");
    setError(null);
    try {
      await NativeShare.share({
        message: `Join ${familyName} on Alora with invite code ${invite.code}: ${invite.link}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't share this invite.");
    } finally {
      setAction(null);
    }
  }

  async function revokeCurrentInvite() {
    if (busy) return;
    setAction("revoke");
    setError(null);
    try {
      setInvite(await revokeInvite());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't revoke this code.");
    } finally {
      setAction(null);
    }
  }

  async function generateNewInvite() {
    if (busy) return;
    setAction("generate");
    setError(null);
    try {
      setInvite(await generateInvite());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate a new code.");
    } finally {
      setAction(null);
    }
  }

  return (
    <ModalScreen title="Invite a caregiver">
      <AppText variant="body" color="inkSoft">
        Share this code with someone you trust to add them to {familyName}.
      </AppText>

      {inviteState.status === "error" ? (
        <View
          style={{
            marginTop: 16,
            padding: 18,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.color.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.color.line,
          }}
        >
          <AppText variant="body" weight="semibold" color="danger">
            Couldn’t load invite
          </AppText>
          <AppText variant="caption" color="inkSoft" style={{ marginTop: 6 }}>
            {inviteState.error.message}
          </AppText>
        </View>
      ) : !revoked ? (
        <>
          <View
            style={{
              marginTop: 16,
              padding: 26,
              borderRadius: theme.radius.xl,
              backgroundColor: theme.color.feedTint,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.color.line,
              alignItems: "center",
              opacity: busy ? 0.7 : 1,
            }}
          >
            <AppText variant="label" weight="bold" color="inkFaint" style={{ letterSpacing: 0.6, marginBottom: 12 }}>
              INVITE CODE
            </AppText>
            <AppText display variant="hero" weight="medium" style={{ fontSize: 40, letterSpacing: 6 }}>
              {invite?.code ?? "••-•••"}
            </AppText>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                marginTop: 14,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: theme.color.warning + "22",
              }}
            >
              <Clock color={theme.color.warning} />
              <AppText variant="caption" weight="semibold" style={{ color: theme.color.warning }}>
                Expires in 24h · single use
              </AppText>
            </View>
            <QrArt />
          </View>

          {error && (
            <AppText variant="caption" color="danger" style={{ marginTop: 12, textAlign: "center" }}>
              {error}
            </AppText>
          )}

          <PressableScale
            disabled={!invite || busy}
            onPress={shareInvite}
            style={{
              marginTop: 18,
              paddingVertical: 17,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.color.accent,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: !invite || busy ? 0.7 : 1,
            }}
          >
            <ShareIcon />
            <AppText variant="heading" weight="bold" style={{ color: "#fff" }}>
              {action === "share" ? "Opening share..." : "Share invite link"}
            </AppText>
          </PressableScale>
          <PressableScale
            disabled={busy}
            scale={0.98}
            onPress={revokeCurrentInvite}
            style={{ marginTop: 8, paddingVertical: 14, alignItems: "center", opacity: busy ? 0.7 : 1 }}
          >
            <AppText variant="body" weight="semibold" style={{ color: theme.color.danger }}>
              {action === "revoke" ? "Revoking..." : "Revoke this code"}
            </AppText>
          </PressableScale>
        </>
      ) : (
        <>
          <View
            style={{
              marginTop: 16,
              padding: 26,
              borderRadius: theme.radius.xl,
              backgroundColor: theme.color.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.color.line,
              alignItems: "center",
            }}
          >
            <AppText display variant="title" weight="medium" color="inkSoft">
              Code revoked
            </AppText>
            <AppText variant="body" color="inkSoft" style={{ marginTop: 8, textAlign: "center" }}>
              That code can no longer be used. Generate a fresh one whenever you’re ready.
            </AppText>
          </View>
          {error && (
            <AppText variant="caption" color="danger" style={{ marginTop: 12, textAlign: "center" }}>
              {error}
            </AppText>
          )}
          <PressableScale
            disabled={busy}
            onPress={generateNewInvite}
            style={{
              marginTop: 18,
              paddingVertical: 17,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.color.accent,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: busy ? 0.7 : 1,
            }}
          >
            <AppText variant="heading" weight="bold" style={{ color: "#fff" }}>
              {action === "generate" ? "Generating..." : "Generate new code"}
            </AppText>
            <ChevronRight size={18} color="#fff" strokeWidth={2.4} />
          </PressableScale>
        </>
      )}

      <AppText variant="caption" color="inkFaint" style={{ marginTop: 20, textAlign: "center", lineHeight: 17 }}>
        Invite codes are single-use and time-limited. You can revoke an unused code at any time.
      </AppText>
    </ModalScreen>
  );
}

function QrArt() {
  const theme = useTheme();
  const on = new Set([0, 1, 2, 6, 7, 8, 12, 14, 16, 18, 20, 24, 28, 30, 33, 36, 40, 42, 46, 47, 48, 5, 11, 23, 35]);
  return (
    <View
      style={{
        width: 132,
        height: 132,
        marginTop: 20,
        padding: 12,
        borderRadius: theme.radius.md,
        backgroundColor: theme.color.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.color.line,
      }}
    >
      <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap" }}>
        {Array.from({ length: 49 }).map((_, i) => (
          <View key={i} style={{ width: `${100 / 7}%`, height: `${100 / 7}%`, padding: 1.5 }}>
            <View style={{ flex: 1, borderRadius: 2, backgroundColor: on.has(i) ? theme.color.ink : "transparent" }} />
          </View>
        ))}
      </View>
    </View>
  );
}

function Clock({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function ShareIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15V4M8.5 7.5 12 4l3.5 3.5M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
