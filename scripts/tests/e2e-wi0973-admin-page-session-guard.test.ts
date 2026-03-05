import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-0973-admin-page-session-guard.md");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");

  assert.match(wi, /WI-0973/);
  assert.match(wi, /useSupabaseSession/);
  assert.match(wi, /return `?null`?/i);
  assert.match(wi, /supabaseSessionLoading/i);

  assert.match(adminPage, /const \{ snapshot: supabaseSession, loading: supabaseSessionLoading \} = useSupabaseSession\(\);/);
  assert.match(
    adminPage,
    /if \(supabaseSessionLoading\) \{[\s\S]*?return null;[\s\S]*?\}[\s\S]*?return \([\s\S]*?<main className="saas-content">/
  );
}

run();
console.log("e2e-wi0973-admin-page-session-guard.test passed");
