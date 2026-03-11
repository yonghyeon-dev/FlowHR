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
  const adminState = readUtf8("src", "app", "admin", "page-state.ts");
  const adminPanels = readUtf8("src", "app", "admin", "page-panels.tsx");
  const workItem = readUtf8("work-items", "WI-0415-admin-dashboard-state-and-panels-decomposition.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(adminPage, /import \{ AdminDashboardPanels \} from "@\/app\/admin\/page-panels";/);
  assert.doesNotMatch(adminPage, /const pageState = useAdminDashboardState\(/);
  assert.doesNotMatch(adminPage, /<AdminDashboardPanels/);
  assert.match(adminState, /ADMIN_DASHBOARD_STATE_RETIRED_WI_1136/);
  assert.match(adminPanels, /ADMIN_DASHBOARD_PANELS_RETIRED_WI_1136/);

  assert.ok(
    countLines(adminPage) <= 650,
    `admin/page.tsx must stay <= 650 lines after WI-0415 follow-up cleanup (current: ${countLines(adminPage)})`
  );
  assert.ok(
    countLines(adminState) <= 400,
    `admin/page-state.ts must stay <= 400 lines after WI-0415 (current: ${countLines(adminState)})`
  );
  assert.ok(
    countLines(adminPanels) <= 300,
    `admin/page-panels.tsx must stay <= 300 lines after WI-0415 (current: ${countLines(adminPanels)})`
  );

  assert.match(workItem, /WI-0415/i);
  assert.match(workItem, /admin|dashboard|state|panels|decomposition/i);
  assert.match(roadmap, /WI-0415/i);
}

run()
  .then(() => {
    console.log("e2e-wi0415-admin-dashboard-state-and-panels-decomposition.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
