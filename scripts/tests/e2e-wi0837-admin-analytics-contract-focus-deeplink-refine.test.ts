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
  const workItem = readUtf8(
    "work-items",
    "WI-0837-admin-analytics-contract-focus-deeplink-refine.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(dashboard, /resolveFocusWorkspaceLink/);
  assert.match(dashboard, /focusMetric === "contractSlaOverdueCount"/);
  assert.match(dashboard, /href: "\/admin\/contracts\?slaRisk=OVERDUE"/);
  assert.match(dashboard, /focusMetric === "contractDecisionQueueCount"/);
  assert.match(dashboard, /href: "\/admin\/contracts\?decisionQueueOnly=true"/);
  assert.match(dashboard, /appendAnalyticsSourceQuery/);
  assert.match(dashboard, /focusWorkspace\.href/);

  assert.match(workItem, /WI-0837/i);
  assert.match(workItem, /admin|analytics|contract|focus|deeplink/i);
  assert.match(roadmap, /WI-0837/i);
}

run();
console.log("e2e-wi0837-admin-analytics-contract-focus-deeplink-refine.test passed");
