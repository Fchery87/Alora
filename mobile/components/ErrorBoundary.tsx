import { Component, type ReactNode } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.brand}>Alora</Text>
        <Text style={styles.heading}>Something went wrong</Text>
        <Text style={styles.body}>
          The app encountered an unexpected error. Your data is safe — it lives on your device.
        </Text>
        {error && <Text style={styles.error}>{error.message}</Text>}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try again"
            onPress={onReset}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAF8F5" },
  content: { flex: 1, paddingHorizontal: 26, justifyContent: "center", alignItems: "center" },
  brand: { color: "#141113", fontSize: 44, fontWeight: "500", marginBottom: 12 },
  heading: { color: "#141113", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  body: { color: "#5F5759", textAlign: "center", marginBottom: 6 },
  error: { color: "#8A8081", textAlign: "center", marginBottom: 24 },
  actions: { flexDirection: "row", gap: 12 },
  primaryButton: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16, backgroundColor: "#6A5AE0" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
