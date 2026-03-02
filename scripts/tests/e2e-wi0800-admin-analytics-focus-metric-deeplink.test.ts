import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const dashboard = readUtf8(
    "src",
    "components",
    "admin-kpi",
    "AdminKpiDashboard.tsx"
  );
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0800-admin-analytics-focus-metric-deeplink.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(dashboard, /useSearchParams/);
  assert.match(dashboard, /searchParams\.get\("focus"\)/);
  assert.match(dashboard, /nextParams\.set\("focus", focusMetric\)/);
  assert.match(dashboard, /nextParams\.delete\("focus"\)/);
  assert.match(dashboard, /router\.replace\(/);
  assert.match(dashboard, /resolveFocusWorkspaceLink/);
  assert.match(dashboard, /\/admin\/approval-executions/);
  assert.match(dashboard, /\/admin\/attendance-live/);
  assert.match(dashboard, /\/admin\/leave-calendar/);
  assert.match(dashboard, /\/admin\/payroll-close/);
  assert.match(dashboard, /\/admin\/contracts/);
  assert.match(dashboard, /focusWorkspaceCopyLinkAction/);

  assert.match(copy, /focusWorkspaceTitle:/);
  assert.match(copy, /focusWorkspaceDescription:/);
  assert.match(copy, /focusWorkspaceOpenAction:/);
  assert.match(copy, /focusWorkspaceCopyLinkAction:/);
  assert.match(copy, /focusWorkspaceCopyDone:/);

  assert.match(workItem, /WI-0800/i);
  assert.match(workItem, /admin|analytics|focus|deeplink|workspace/i);
  assert.match(roadmap, /WI-0800/i);
}

run();
console.log("e2e-wi0800-admin-analytics-focus-metric-deeplink.test passed");
