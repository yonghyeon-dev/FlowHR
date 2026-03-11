import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPeopleLayout = readUtf8("src", "app", "admin", "people", "page-view-layout.tsx");
  const employeePeoplePage = readUtf8("src", "app", "employee", "people", "page.tsx");
  const workItem = readUtf8("work-items", "WI-1150-route-first-workspace-visual-wave-nine.md");

  assert.match(adminPeopleLayout, /className="saas-content workspace-shell admin-workspace-shell"/);
  assert.match(adminPeopleLayout, /className="page-header workspace-page-header"/);
  assert.match(adminPeopleLayout, /className="kpi-strip workspace-summary-strip"/);
  assert.match(adminPeopleLayout, /className="panel-grid workspace-panel-grid"/);
  assert.match(adminPeopleLayout, /workspace-source-banner/);
  assert.match(adminPeopleLayout, /workspace-side-panel/);

  assert.match(employeePeoplePage, /className="saas-content workspace-shell employee-workspace-shell"/);
  assert.match(employeePeoplePage, /className="page-header workspace-page-header employee-workspace-status-header"/);
  assert.match(employeePeoplePage, /className="kpi-strip workspace-summary-strip employee-workspace-status-strip"/);
  assert.match(employeePeoplePage, /className="panel workspace-section-card workspace-toolbar-card"/);
  assert.match(employeePeoplePage, /className="small fail workspace-inline-status"/);
  assert.match(employeePeoplePage, /직원 디렉터리/);
  assert.doesNotMatch(employeePeoplePage, /\?숇즺|\?대찓|\?꾪솕/);

  assert.match(workItem, /WI-1150/);
  assert.match(workItem, /visual/i);
}

run()
  .then(() => {
    console.log("e2e-wi1150-route-first-workspace-visual-wave-nine.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
