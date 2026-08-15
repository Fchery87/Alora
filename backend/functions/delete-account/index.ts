// Supabase Edge Function: delete-account  (transfer-then-scrub)
// ---------------------------------------------------------------------------
// Auth deletion is the transaction boundary. The auth.users trigger performs
// ownership transfer and PII cleanup only after the provider accepts deletion.
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
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization." }, 401);

    const asUser = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: who, error: whoErr } = await asUser.auth.getUser();
    if (whoErr || !who.user) return json({ error: "Invalid session." }, 401);
    const userId = who.user.id;

    const { data: request, error: requestError } = await asUser.rpc(
      "request_account_deletion",
    );
    if (requestError || !request?.[0]?.request_id)
      return json({ error: "Deletion service unavailable." }, 503);
    const requestId = request[0].request_id as string;
    if (request[0].request_status === "completed") return json({ ok: true });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      const { data: state } = await admin
        .from("account_deletion_requests")
        .select("status")
        .eq("id", requestId)
        .maybeSingle();
      if (state?.status === "completed") return json({ ok: true });
      await admin
        .from("account_deletion_requests")
        .update({
          status: "failed",
          failure_category: "auth_provider_error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .neq("status", "completed");
      return json({ error: "We couldn't complete deletion. Try again." }, 502);
    }

    const { data: state } = await admin
      .from("account_deletion_requests")
      .select("status")
      .eq("id", requestId)
      .maybeSingle();
    if (state?.status !== "completed")
      return json(
        { error: "Deletion is still processing. Try again shortly." },
        202,
      );
    return json({ ok: true });
  } catch (_error) {
    return json({ error: "Deletion service unavailable." }, 500);
  }
});
