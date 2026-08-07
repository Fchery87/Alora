// Supabase Edge Function: delete-account  (transfer-then-scrub)
// ---------------------------------------------------------------------------
// Deletes the caller's account with the PRD's shared-data semantics:
//  * Owner with a partner   → ownership transfers to the partner; the owner's
//    PII + private check-ins are hard-deleted; shared baby/event history is
//    retained, with their name on past entries reattributed to "former
//    caregiver" (baby_events.created_by → NULL via ON DELETE SET NULL).
//  * Sole owner             → the whole family + its data is hard-deleted.
//  * Partner                → their PII + check-ins are deleted; family stays.
//
// Runs with the service role + admin auth API. Deploy:
//   supabase functions deploy delete-account
//
// Request:  POST {}  with Authorization: Bearer <user JWT>
// Response: { ok: true } | { error }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization." }, 401);

    const asUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: who, error: whoErr } = await asUser.auth.getUser();
    if (whoErr || !who.user) return json({ error: "Invalid session." }, 401);
    const userId = who.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Resolve ownership for every family the user owns.
    const { data: owned } = await admin
      .from("family_members")
      .select("family_id")
      .eq("user_id", userId)
      .eq("role", "owner");

    for (const { family_id } of owned ?? []) {
      // Transfer ownership to a non-limited member first (a grandparent/nanny
      // seat must not silently become owner while a partner exists). If only
      // limited seats remain, promote one rather than delete the family.
      const { data: others } = await admin
        .from("family_members")
        .select("user_id")
        .eq("family_id", family_id)
        .neq("user_id", userId)
        .neq("role", "limited")
        .limit(1);

      const fallback = others && others.length === 0 ? await admin
        .from("family_members")
        .select("user_id")
        .eq("family_id", family_id)
        .neq("user_id", userId)
        .limit(1) : null;
      const successor = (others && others.length > 0 ? others : (fallback?.data ?? []) as { user_id: string }[])[0];

      if (successor) {
        // Transfer ownership; shared history stays (events reattributed on delete).
        await admin.from("family_members").update({ role: "owner" }).eq("family_id", family_id).eq("user_id", successor.user_id);
        await admin.from("audit_logs").insert({ family_id, actor_id: userId, action: "owner.transferred", detail: { to: successor.user_id } });
      } else {
        // Sole member → remove the whole family (cascade deletes babies/events/etc.).
        await admin.from("families").delete().eq("id", family_id);
      }
    }

    await admin.from("audit_logs").insert({ actor_id: userId, action: "account.deleted", detail: {} });

    // Delete the auth user. Cascades users → family_members(self), check_ins,
    // reflections, prefs, owned tokens; baby_events.created_by → NULL.
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) return json({ error: delErr.message }, 500);

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
