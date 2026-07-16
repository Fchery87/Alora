import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { env, isBackendConfigured } from "../config/env";

/**
 * SecureStore-backed session storage so the auth session persists encrypted
 * on-device and survives an offline cold start (PRD: open + log while offline).
 *
 * Note: SecureStore values are capped ~2KB. Supabase sessions are normally
 * well under that; if you adopt very large custom JWT claims, switch to a
 * chunking adapter.
 */
const SecureStorageAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

let client: SupabaseClient | null = null;

/** Lazily create the Supabase client. Throws if backend isn't configured yet. */
export function getSupabase(): SupabaseClient {
  if (!isBackendConfigured) {
    throw new Error(
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and " +
        "EXPO_PUBLIC_SUPABASE_ANON_KEY (see backend/README.md).",
    );
  }
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: SecureStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
