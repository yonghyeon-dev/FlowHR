import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const panel = readUtf8("src", "components", "admin-kpi", "AdminContractKpiPanel.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0841-admin-analytics-contract-kpi-source-context-links.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(panel, /function withAnalyticsSourceContext/);
  assert.ok(
    /source=admin-analytics/.test(panel) ||
      /source:\s*"admin-analytics"/.test(panel)
  );
  assert.match(panel, /"contractDecisionQueueCount"/);
  assert.match(panel, /"contractSlaOverdueCount"/);
  assert.match(
    panel,
    /withAnalyticsSourceContext\(\s*"\/admin\/contracts\?decisionQueueOnly=true"/
  );
  assert.match(
    panel,
    /withAnalyticsSourceContext\(\s*"\/admin\/contracts\?slaRisk=OVERDUE"/
  );
  assert.match(panel, /withAnalyticsSourceContext\(\s*"\/admin\/contracts\?status=SENT"/);

  assert.match(workItem, /WI-0841/i);
  assert.match(workItem, /analytics|contract|kpi|source|context|link/i);
  assert.match(roadmap, /WI-0841/i);
}

run();
console.log("e2e-wi0841-admin-analytics-contract-kpi-source-context-links.test passed");
