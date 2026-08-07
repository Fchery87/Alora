/**
 * Crash-reporting integration (Sentry).
 *
 * Initializes Sentry in production builds only, and only when a DSN is
 * configured (EXPO_PUBLIC_SENTRY_DSN). In development / without a DSN every
 * call degrades to a console log — the app never depends on Sentry being
 * present.
 *
 * Import this module once, near the top of app/_layout.tsx, so unhandled
 * JS errors are captured from the first render. The ErrorBoundary component
 * forwards caught render errors here, and the sync boundary in
 * powersync/system.ts emits breadcrumbs + failure exceptions.
 *
 * Setup:
 *   1. Create a Sentry project and copy its DSN.
 *   2. Add EXPO_PUBLIC_SENTRY_DSN=<dsn> to your .env (never commit it).
 *   3. EAS Build uploads debug symbols via the @sentry/react-native config
 *      plugin (see app.json).
 */
import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (dsn && !__DEV__) {
  Sentry.init({
    dsn,
    enableAutoPerformanceTracing: true,
    tracesSampleRate: 0.2,
  });
}

/** True when Sentry is actually capturing (prod + DSN configured). */
export const isCrashReportingActive = Boolean(dsn) && !__DEV__;

export function captureError(error: Error, context?: Record<string, unknown>) {
  if (!isCrashReportingActive) {
    console.error("[crashReporting]", error.message, context ?? {});
    return;
  }
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export function captureMessage(message: string, context?: Record<string, unknown>) {
  if (!isCrashReportingActive) {
    console.log("[crashReporting]", message, context ?? {});
    return;
  }
  Sentry.captureMessage(message, { extra: context });
}

/** Record a step in a user flow (e.g. sync lifecycle) as a breadcrumb. */
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
  if (!isCrashReportingActive) {
    console.log(`[breadcrumb:${category}]`, message, data ?? {});
    return;
  }
  Sentry.addBreadcrumb({ message, category, level: "info", data: data as Record<string, string> });
}
