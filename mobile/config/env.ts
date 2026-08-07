/**
 * Backend configuration, read from Expo public env vars.
 * Until these are set (see ../../backend/README.md), the app runs in
 * "demo mode" on mock data — no auth, no network.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
const powersyncUrl = process.env.EXPO_PUBLIC_POWERSYNC_URL ?? "";
// Public privacy-policy URL (required by both stores for beta tracks, and by
// Apple Guideline 5.1.1 as an in-app link). Empty until published — the trust
// screen hides the link then.
const privacyPolicyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? "";

export const env = { supabaseUrl, supabaseAnonKey, powersyncUrl, privacyPolicyUrl };

/** True once Supabase creds are present — flips the app from demo → live auth. */
export const isBackendConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** True once PowerSync is also configured — enables local-first sync. */
export const isSyncConfigured = isBackendConfigured && Boolean(powersyncUrl);
