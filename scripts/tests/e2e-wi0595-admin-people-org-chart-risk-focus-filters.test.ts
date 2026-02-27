import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const orgChartPanel = readUtf8("src", "app", "admin", "people", "page-view-org-chart-panel.tsx");
  const workItem = readUtf8("work-items", "WI-0595-admin-people-org-chart-risk-focus-filters.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(orgChartPanel, /type OrgChartFocusMode = "all" \| "inactive" \| "unassigned"/);
  assert.match(orgChartPanel, /const \[focusMode, setFocusMode\] = useState<OrgChartFocusMode>\("all"\)/);
  assert.match(orgChartPanel, /function filterByFocusMode\(/);
  assert.match(orgChartPanel, /focusCountByMode: Record<OrgChartFocusMode, number>/);
  assert.match(orgChartPanel, /No employee matches the current focus filter\./);
  assert.match(orgChartPanel, /btn-primary/);
  assert.match(orgChartPanel, /btn-secondary/);

  assert.ok(
    countLines(orgChartPanel) <= 240,
    `admin/people/page-view-org-chart-panel.tsx should stay <= 240 lines (current: ${countLines(orgChartPanel)})`
  );

  assert.match(workItem, /WI-0595/i);
  assert.match(workItem, /admin|people|org chart|focus|inactive|unassigned|filter/i);
  assert.match(roadmap, /WI-0595/i);
}

run()
  .then(() => {
    console.log("e2e-wi0595-admin-people-org-chart-risk-focus-filters.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
