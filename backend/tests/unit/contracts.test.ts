import { assert, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("invite redemption delegates atomic work to the database RPC", async () => {
  const source = await Deno.readTextFile("functions/redeem-invite/index.ts");
  assertStringIncludes(source, 'rpc("consume_invite_attempt"');
  assertStringIncludes(source, 'rpc("redeem_invite"');
  assert(!source.includes("const SERVICE_ROLE"));
});

Deno.test("account deletion treats auth deletion as the irreversible boundary", async () => {
  const source = await Deno.readTextFile("functions/delete-account/index.ts");
  assertStringIncludes(source, 'rpc("request_account_deletion"');
  assertStringIncludes(source, "admin.auth.admin.deleteUser");
  assertStringIncludes(source, 'state?.status !== "completed"');
});
