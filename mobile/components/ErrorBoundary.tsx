import { Component, type ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../theme/ThemeProvider";
import { AppText, PressableScale } from "./Themed";
import { captureError } from "../lib/crashReporting";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary — wraps the root layout so an uncaught render error
 * shows a recoverable state instead of a blank screen.
 */
export class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Forward caught render errors to the crash-reporting service.
    captureError(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={() => this.setState({ hasError: false, error: null })} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 26, justifyContent: "center", alignItems: "center" }}>
        <AppText display variant="hero" weight="medium" style={{ fontSize: 44, marginBottom: 12 }}>
          Alora
        </AppText>
        <AppText variant="heading" weight="bold" style={{ marginBottom: 8 }}>
          Something went wrong
        </AppText>
        <AppText variant="body" color="inkSoft" style={{ textAlign: "center", marginBottom: 6 }}>
          The app encountered an unexpected error. Your data is safe — it lives on your device.
        </AppText>
        {error && (
          <AppText variant="caption" color="inkFaint" style={{ textAlign: "center", marginBottom: 24 }}>
            {error.message}
          </AppText>
        )}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <PressableScale
            onPress={onReset}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.color.accent,
            }}
          >
            <AppText variant="body" weight="bold" style={{ color: theme.color.onAccent }}>
              Try again
            </AppText>
          </PressableScale>
          <PressableScale
            onPress={() => {
              onReset();
              router.replace("/");
            }}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.color.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.color.line,
            }}
          >
            <AppText variant="body" weight="bold" color="inkSoft">
              Go home
            </AppText>
          </PressableScale>
        </View>
      </View>
    </SafeAreaView>
  );
}
