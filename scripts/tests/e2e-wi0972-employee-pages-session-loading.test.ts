import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-0972-employee-pages-session-loading.md");
  const sessionHelpers = readUtf8("src", "app", "employee", "page-session-helpers.ts");
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const payslipsPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const employeeOnboardingPage = readUtf8("src", "app", "employee", "onboarding", "page.tsx");
  const protectedOnboardingPage = readUtf8(
    "src",
    "app",
    "(protected)",
    "onboarding",
    "page.tsx"
  );
  const adminSettingsPage = readUtf8("src", "app", "admin", "settings", "page.tsx");

  assert.match(wi, /WI-0972/);
  assert.match(wi, /WI-0971/);
  assert.match(wi, /useSupabaseSession/);
  assert.match(wi, /loading/i);

  assert.match(sessionHelpers, /loading:\s*supabaseSessionLoading/);
  assert.match(sessionHelpers, /supabaseSessionLoading,/);

  assert.match(employeePage, /supabaseSessionLoading/);
  assert.match(
    employeePage,
    /const requiresLoginSession = !supabaseSessionLoading && isProductionRuntime && !usesBearerToken && !showDevTools;/
  );

  assert.match(payslipsPage, /const \{ snapshot: supabaseSession, error: supabaseSessionError, loading \} = useSupabaseSession\(\);/);
  assert.match(
    payslipsPage,
    /const requiresLoginSession = !loading && isProductionRuntime && !usesBearerToken && !showDevTools;/
  );

  assert.match(employeeOnboardingPage, /loading:\s*supabaseSessionLoading/);
  assert.match(
    employeeOnboardingPage,
    /const requiresLoginSession = !supabaseSessionLoading && isProductionRuntime && accessToken\.length === 0;/
  );
  assert.match(
    employeeOnboardingPage,
    /if \(supabaseSessionLoading\) \{[\s\S]*?return;[\s\S]*?\}[\s\S]*?void loadTasks\(\);/
  );

  assert.match(protectedOnboardingPage, /loading:\s*supabaseSessionLoading/);
  assert.match(
    protectedOnboardingPage,
    /if \(supabaseSessionLoading\) \{[\s\S]*?return;[\s\S]*?\}[\s\S]*?let active = true;/
  );
  assert.match(
    protectedOnboardingPage,
    /\[accessToken, organizationId, role, router, snapshot, supabaseSessionLoading\]/
  );

  assert.match(adminSettingsPage, /import \{ useSupabaseSession \} from "@\/lib\/client\/useSupabaseSession";/);
  assert.match(adminSettingsPage, /const \{ loading: supabaseSessionLoading \} = useSupabaseSession\(\);/);
  assert.match(
    adminSettingsPage,
    /if \(supabaseSessionLoading\) \{[\s\S]*?return;[\s\S]*?\}[\s\S]*?void loadSettings\(\);/
  );
}

run();
console.log("e2e-wi0972-employee-pages-session-loading.test passed");
