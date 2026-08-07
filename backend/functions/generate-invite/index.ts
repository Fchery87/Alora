// Supabase Edge Function: generate-invite
// ---------------------------------------------------------------------------
// Generates a single-use, time-limited, revocable invite code for the caller's
// family. Only the family owner may issue invites. The inviter chooses the
// seat role: 'partner' (full access, default) or 'limited' (grandparent/nanny
// seat — care events + timeline only).
//
// Deploy:  supabase functions deploy generate-invite
//
// Request:  POST { "role": "partner" | "limited" }  with Authorization: Bearer <user JWT>
// Response: { ok: true, code, expires_at } | { error }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Generate a human-shareable code from crypto-random bytes. */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code.slice(0, 3) + "-" + code.slice(3);
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization." }, 401);

    // Identify the caller from their JWT.
    const asUser = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: who, error: whoErr } = await asUser.auth.getUser();
    if (whoErr || !who.user) return json({ error: "Invalid session." }, 401);
    const user = who.user;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Only family owners may issue invites.
    const { data: membership } = await admin
      .from("family_members")
      .select("family_id, role")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .maybeSingle();

    if (!membership) {
      return json({ error: "Only the family owner can generate invite codes." }, 403);
    }

    // Generate a unique code (retry on collision — unlikely but safe).
    let code = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      code = generateCode();
      const { data: existing } = await admin
        .from("invitation_tokens")
        .select("id")
        .eq("code", code)
        .maybeSingle();
      if (!existing) break;
      code = "";
    }
    if (!code) return json({ error: "Could not generate a unique invite code. Try again." }, 500);

    const { role } = await req.json().catch(() => ({}));
    // Only two seat roles can be invited: partner (full) or limited.
    const inviteRole: "partner" | "limited" = role === "limited" ? "limited" : "partner";

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: insertErr } = await admin.from("invitation_tokens").insert({
      family_id: membership.family_id,
      created_by: user.id,
      code,
      role: inviteRole,
      expires_at: expiresAt,
    });

    if (insertErr) return json({ error: insertErr.message }, 500);

    // Audit
    await admin.from("audit_logs").insert({
      family_id: membership.family_id,
      actor_id: user.id,
      action: "invite.generated",
      detail: { code, role: inviteRole },
    });

    return json({ ok: true, code, expires_at: expiresAt });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
