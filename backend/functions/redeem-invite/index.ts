// Supabase Edge Function: redeem-invite
// ---------------------------------------------------------------------------
// Redeems a single-use, time-limited, revocable invite code and adds the
// caller to the family with the role encoded in the token. The function calls
// a security-definer database operation so token consumption and membership
// creation commit together. Deploy: `supabase functions deploy redeem-invite`.
//
// Request:  POST { "code": "A7-K9P" }  with Authorization: Bearer <user JWT>
// Response: { ok: true, family_id } | { error }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const GENERIC_INVALID_CODE =
  "That invite code is invalid or no longer available.";

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization." }, 401);

    const { code } = await req.json().catch(() => ({}));
    if (!code) return json({ error: "Missing invite code." }, 400);

    // Identify the caller from their JWT.
    const asUser = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: who, error: whoErr } = await asUser.auth.getUser();
    if (whoErr || !who.user) return json({ error: "Invalid session." }, 401);
    const user = who.user;

    // Durable limiter: the database hashes the authenticated account together
    // with this network signal, so cold starts cannot reset brute-force state.
    const networkSignal = (
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      "unknown"
    )
      .split(",")[0]
      .trim();
    const { data: allowed, error: limitError } = await asUser.rpc(
      "consume_invite_attempt",
      {
        network_signal: networkSignal,
      },
    );
    if (limitError) return json({ error: "Invite service unavailable." }, 503);
    if (!allowed)
      return json({ error: "Too many attempts. Try again later." }, 429);

    const metadataName = user.user_metadata?.display_name;
    const displayName =
      typeof metadataName === "string" ? metadataName : "Caregiver";
    const normalizedCode =
      typeof code === "string" ? code.trim().toUpperCase() : "";
    if (!normalizedCode) return json({ error: "Missing invite code." }, 400);

    // The security-definer RPC locks the token and family, enforces the seat
    // cap, inserts the member, consumes the token, and audits in one transaction.
    const { data: result, error: redeemError } = await asUser.rpc(
      "redeem_invite",
      {
        invite_code: normalizedCode,
        actor_display_name: displayName,
      },
    );
    if (redeemError || !result?.[0]?.joined_family_id) {
      return json({ error: GENERIC_INVALID_CODE }, 400);
    }

    return json({ ok: true, family_id: result[0].joined_family_id });
  } catch (e) {
    return json({ error: "Invite service unavailable." }, 500);
  }
});
