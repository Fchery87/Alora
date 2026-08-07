// Supabase Edge Function: redeem-invite
// ---------------------------------------------------------------------------
// Redeems a single-use, time-limited, revocable invite code and adds the
// caller to the family as a partner. Runs with the service role (elevated)
// because joining a family + consuming a token is more than RLS should allow
// a client to do directly. Deploy: `supabase functions deploy redeem-invite`.
//
// Request:  POST { "code": "A7-K9P" }  with Authorization: Bearer <user JWT>
// Response: { ok: true, family_id } | { error }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Simple in-memory rate limiter (per Edge Function instance — resets on cold
// start). Tune for production: 5 attempts per caller per 60 seconds.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_ATTEMPTS = 5;
const rateMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(clientIp: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(clientIp);
  if (!entry || now > entry.resetAt) {
    rateMap.set(clientIp, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_MAX_ATTEMPTS) return false;
  entry.count += 1;
  return true;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  try {
    // Rate-limit by caller IP to prevent brute-force code guessing
    const clientIp = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    if (!rateLimit(clientIp)) {
      return json({ error: "Too many attempts. Try again later." }, 429);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization." }, 401);

    const { code } = await req.json().catch(() => ({}));
    if (!code) return json({ error: "Missing invite code." }, 400);

    // Identify the caller from their JWT.
    const asUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: who, error: whoErr } = await asUser.auth.getUser();
    if (whoErr || !who.user) return json({ error: "Invalid session." }, 401);
    const user = who.user;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: token } = await admin.from("invitation_tokens").select("*").eq("code", code).maybeSingle();
    if (!token) return json({ error: "That invite code doesn't exist." }, 404);
    if (token.used_at || token.revoked_at || new Date(token.expires_at) < new Date()) {
      return json({ error: "This invite code is no longer valid." }, 410);
    }

    // Enforce the two-seat MVP cap.
    const { count } = await admin
      .from("family_members")
      .select("*", { count: "exact", head: true })
      .eq("family_id", token.family_id);
    if ((count ?? 0) >= 2) return json({ error: "This family is already full." }, 409);

    const displayName = (user.user_metadata?.display_name as string | undefined) ?? "Caregiver";

    // Ensure a profile row exists, then join (display_name denormalized for attribution).
    await admin.from("users").upsert({ id: user.id, display_name: displayName });
    const { error: joinErr } = await admin.from("family_members").insert({
      family_id: token.family_id,
      user_id: user.id,
      role: token.role,
      display_name: displayName,
    });
    if (joinErr) return json({ error: joinErr.message }, 400);

    // Consume the token (single-use) + audit.
    await admin.from("invitation_tokens").update({ used_at: new Date().toISOString(), used_by: user.id }).eq("id", token.id);
    await admin.from("audit_logs").insert({ family_id: token.family_id, actor_id: user.id, action: "member.joined", detail: { role: token.role } });

    return json({ ok: true, family_id: token.family_id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
