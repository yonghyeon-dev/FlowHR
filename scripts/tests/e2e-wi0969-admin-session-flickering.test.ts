import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-0969-admin-session-flickering.md");
  const sessionHook = readUtf8("src", "lib", "client", "useSupabaseSession.ts");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const sessionMenu = readUtf8("src", "components", "SessionMenu.tsx");

  assert.match(wi, /WI-0969/);
  assert.match(wi, /useSupabaseSession/);
  assert.match(wi, /loading/);
  assert.match(wi, /ADR/);
  assert.match(wi, /Not required/);

  assert.match(sessionHook, /loading:\s*boolean/);
  assert.match(sessionHook, /const \[loading, setLoading\] = useState\(true\)/);
  assert.match(sessionHook, /setLoading\(false\)/);

  assert.match(adminPage, /loading:\s*supabaseSessionLoading/);
  assert.match(adminPage, /!supabaseSessionLoading\s*&&\s*isProductionRuntime\s*&&\s*!usesBearerToken\s*&&\s*!showDevTools/);
  assert.match(adminPage, /if \(supabaseSessionLoading\)\s*\{\s*return;\s*\}/);

  assert.match(sessionMenu, /const \{ snapshot, error, loading \} = useSupabaseSession\(\)/);
  assert.match(sessionMenu, /\) : loading \? \(/);
  assert.match(sessionMenu, /admin\.onboarding\.loading/);
}

run();
console.log("e2e-wi0969-admin-session-flickering.test passed");
