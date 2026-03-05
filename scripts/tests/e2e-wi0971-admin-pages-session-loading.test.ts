import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-0971-admin-pages-session-loading.md");
  const approvalPolicyPage = readUtf8("src", "app", "admin", "approval-policy", "page.tsx");
  const approvalTemplatesPage = readUtf8("src", "app", "admin", "approval-templates", "page.tsx");
  const approvalExecutionsPage = readUtf8("src", "app", "admin", "approval-executions", "page.tsx");
  const approvalHistoryPage = readUtf8("src", "app", "admin", "approval-history", "page.tsx");
  const peoplePage = readUtf8("src", "app", "admin", "people", "page.tsx");

  assert.match(wi, /WI-0971/);
  assert.match(wi, /WI-0969/);
  assert.match(wi, /useSupabaseSession/);
  assert.match(wi, /loading/i);

  const pageSources = [
    approvalPolicyPage,
    approvalTemplatesPage,
    approvalExecutionsPage,
    approvalHistoryPage,
    peoplePage
  ];

  for (const source of pageSources) {
    assert.match(source, /loading:\s*supabaseSessionLoading/);
    assert.match(source, /!supabaseSessionLoading\s*&&\s*isProductionRuntime\s*&&\s*!usesBearerToken/);
    assert.match(source, /supabaseSessionLoading\s*\|\|\s*requiresLoginSession/);
  }

  assert.match(approvalPolicyPage, /if \(supabaseSessionLoading \|\| requiresLoginSession \|\| !organizationId\.trim\(\)\)/);
  assert.match(approvalTemplatesPage, /if \(supabaseSessionLoading \|\| requiresLoginSession \|\| !organizationId\.trim\(\)\)/);
  assert.match(approvalExecutionsPage, /if \(supabaseSessionLoading \|\| requiresLoginSession \|\| !organizationId\.trim\(\)\)/);
  assert.match(approvalHistoryPage, /if \(supabaseSessionLoading \|\| requiresLoginSession \|\| !organizationId\.trim\(\)\)/);

  assert.match(peoplePage, /const loadOrganizationsWithSessionGuard = useCallback/);
  assert.match(peoplePage, /const refreshDirectoryWithSessionGuard = useCallback/);
  assert.match(peoplePage, /supabaseSessionLoading=\{supabaseSessionLoading\}/);
  assert.match(peoplePage, /requiresLoginSession=\{requiresLoginSession\}/);
  assert.match(peoplePage, /void refreshDirectoryWithSessionGuard\(\)/);
}

run();
console.log("e2e-wi0971-admin-pages-session-loading.test passed");
