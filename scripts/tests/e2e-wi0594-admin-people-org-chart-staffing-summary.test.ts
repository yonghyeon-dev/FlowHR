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
  const workItem = readUtf8("work-items", "WI-0594-admin-people-org-chart-staffing-summary.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(orgChartPanel, /type OrgChartSummary =/);
  assert.match(orgChartPanel, /function buildOrgChartSummary\(tree: OrgTreeNode\[]\)/);
  assert.match(orgChartPanel, /unassignedOrganizationEmployees/);
  assert.match(orgChartPanel, /unassignedDepartmentEmployees/);
  assert.match(orgChartPanel, /Employees \(active\/inactive\)/);
  assert.match(orgChartPanel, /department\.employees\.filter\(\(employee\) => employee\.active\)\.length/);
  assert.match(orgChartPanel, /Unassigned organization/);
  assert.match(orgChartPanel, /Department unassigned employees/);

  assert.ok(
    countLines(orgChartPanel) <= 240,
    `admin/people/page-view-org-chart-panel.tsx should stay <= 240 lines (current: ${countLines(orgChartPanel)})`
  );

  assert.match(workItem, /WI-0594/i);
  assert.match(workItem, /admin|people|org chart|staffing|summary|unassigned|inactive/i);
  assert.match(roadmap, /WI-0594/i);
}

run()
  .then(() => {
    console.log("e2e-wi0594-admin-people-org-chart-staffing-summary.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
