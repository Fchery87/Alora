import { type ReactNode } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import type { CaregiverCapabilities } from "../domains/caregiverCapabilities";
import { useCaregiverCapabilities } from "../domains/useCaregiverCapabilities";
import { AppText, PressableScale } from "./Themed";
import { ModalScreen } from "./ModalScreen";

export function CapabilityGate({
  allowed,
  children,
  title = "This space is private",
  message = "Your caregiver role does not include this action.",
}: {
  allowed: keyof CaregiverCapabilities;
  children: ReactNode;
  title?: string;
  message?: string;
}) {
  const { capabilities, members } = useCaregiverCapabilities();
  const router = useRouter();

  if (members.status !== "ready") return null;
  if (capabilities[allowed]) return <>{children}</>;

  return (
    <ModalScreen title={title}>
      <View style={{ paddingVertical: 16, gap: 14 }}>
        <AppText variant="body" color="inkSoft">
          {message}
        </AppText>
        <PressableScale onPress={() => router.back()} style={{ alignItems: "center", paddingVertical: 14 }}>
          <AppText variant="body" weight="semibold" color="accent">
            Go back
          </AppText>
        </PressableScale>
      </View>
    </ModalScreen>
  );
}

export function useCapability(allowed: keyof CaregiverCapabilities): boolean {
  const { capabilities, members } = useCaregiverCapabilities();
  return members.status === "ready" && capabilities[allowed];
}
