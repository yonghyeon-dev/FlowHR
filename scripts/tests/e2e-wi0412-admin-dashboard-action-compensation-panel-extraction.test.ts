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
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminPanels = readUtf8("src", "app", "admin", "page-panels.tsx");
  const dashboardActions = readUtf8("src", "app", "admin", "page-dashboard-actions.ts");
  const compensationPanels = readUtf8("src", "app", "admin", "page-compensation-panels.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0412-admin-dashboard-actions-and-compensation-panels-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPanels, /ADMIN_DASHBOARD_PANELS_RETIRED_WI_1136/);

  assert.doesNotMatch(adminPage, /import \{ buildAdminDashboardActions \} from "@\/app\/admin\/page-dashboard-actions";/);
  assert.doesNotMatch(adminPage, /const dashboardActions = buildAdminDashboardActions\(/);

  assert.match(dashboardActions, /ADMIN_DASHBOARD_ACTIONS_RETIRED_WI_1136/);

  assert.match(compensationPanels, /ADMIN_COMPENSATION_PANELS_RETIRED_WI_1136/);


  assert.ok(
    countLines(adminPage) < 800,
    `admin/page.tsx must stay under 800 lines after extraction (current: ${countLines(adminPage)})`
  );
  assert.ok(
    countLines(adminPanels) <= 350,
    `page-panels.tsx must stay <= 350 lines (current: ${countLines(adminPanels)})`
  );
  assert.ok(
    countLines(dashboardActions) <= 400,
    `page-dashboard-actions.ts must stay <= 400 lines (current: ${countLines(dashboardActions)})`
  );
  assert.ok(
    countLines(compensationPanels) <= 250,
    `page-compensation-panels.tsx must stay <= 250 lines (current: ${countLines(compensationPanels)})`
  );

  assert.match(workItem, /WI-0412/i);
  assert.match(workItem, /admin|dashboard|actions|compensation|extraction/i);
  assert.match(roadmap, /WI-0412/i);
}

run()
  .then(() => {
    console.log("e2e-wi0412-admin-dashboard-action-compensation-panel-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
