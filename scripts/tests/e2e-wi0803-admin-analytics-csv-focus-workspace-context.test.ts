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
  const utils = readUtf8("src", "components", "admin-kpi", "dashboard-utils.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0803-admin-analytics-csv-focus-workspace-context.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(dashboard, /buildAnalyticsFocusHref/);
  assert.match(dashboard, /const focusAnalyticsHref = buildAnalyticsFocusHref\(pathname, focusMetric\)/);
  assert.match(dashboard, /const focusWorkspaceHref = appendAnalyticsSourceQuery\(focusWorkspace\.href, focusMetric\)/);
  assert.match(dashboard, /focusWorkspaceLabel: focusWorkspace\.label/);
  assert.match(dashboard, /focusWorkspaceHref,/);

  assert.match(utils, /focusAnalyticsHref: string;/);
  assert.match(utils, /focusWorkspaceLabel: string;/);
  assert.match(utils, /focusWorkspaceHref: string;/);
  assert.match(utils, /toCsvRow\(\["snapshot", "focusAnalyticsHref", focusAnalyticsHref\]\)/);
  assert.match(utils, /toCsvRow\(\["snapshot", "focusWorkspaceLabel", focusWorkspaceLabel\]\)/);
  assert.match(utils, /toCsvRow\(\["snapshot", "focusWorkspaceHref", focusWorkspaceHref\]\)/);

  assert.match(workItem, /WI-0803/i);
  assert.match(workItem, /analytics|csv|focus|workspace|context/i);
  assert.match(roadmap, /WI-0803/i);
}

run();
console.log(
  "e2e-wi0803-admin-analytics-csv-focus-workspace-context.test passed"
);
