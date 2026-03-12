import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-1172-v2-core-route-shell-rollout.md");
  const adminSettingsPage = readUtf8("src", "app", "admin", "settings", "page.tsx");
  const employeeRequestsWorkspace = readUtf8("src", "app", "employee", "requests", "workspace-content.tsx");
  const employeeRequestsClient = readUtf8("src", "app", "employee", "requests", "page-client.tsx");
  const sharedPrimitives = readUtf8("src", "components", "workspace", "RouteWorkspacePrimitives.tsx");
  const globalsCss = readUtf8("src", "app", "globals.css");

  assert.match(wi, /WI-1172/);
  assert.match(wi, /V2/i);

  assert.match(adminSettingsPage, /v2-route-shell v2-admin-settings-shell/);
  assert.match(adminSettingsPage, /v2-page-header/);
  assert.match(adminSettingsPage, /v2-tab-row/);

  assert.match(employeeRequestsWorkspace, /RouteWorkspaceShell/);
  assert.match(employeeRequestsWorkspace, /RouteWorkspaceHeader/);
  assert.match(employeeRequestsWorkspace, /RouteWorkspaceTabs/);
  assert.match(employeeRequestsWorkspace, /v2-requests-shell/);
  assert.match(employeeRequestsWorkspace, /v2-request-type-grid/);
  assert.match(employeeRequestsWorkspace, /요청 허브|Requests hub/);
  assert.match(employeeRequestsWorkspace, /요청 모니터링|Request monitoring/);
  assert.match(employeeRequestsWorkspace, /재제출 작업대|Resubmit workbench/);

  assert.match(employeeRequestsClient, /employee-requests-status-strip/);
  assert.match(employeeRequestsClient, /const \[pendingLabel, setPendingLabel\] = useState<string \| null>\(null\);/);

  assert.match(sharedPrimitives, /export function RouteWorkspaceShell/);
  assert.match(sharedPrimitives, /export function RouteWorkspaceTabs/);
  assert.match(globalsCss, /\.v2-route-shell \{/);
  assert.match(globalsCss, /\.v2-tab-row \{/);
  assert.match(globalsCss, /\.v2-form-layout \{/);
  assert.match(globalsCss, /\.v2-request-type-grid \{/);
}

run();
console.log("e2e-wi1172-v2-core-route-shell-rollout.test passed");
