import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const approvalExecutionsPage = readUtf8(
    "src",
    "app",
    "admin",
    "approval-executions",
    "page.tsx"
  );
  const approvalWorkConditionsPanel = readUtf8(
    "src",
    "app",
    "admin",
    "approval-executions",
    "page-sections-work-conditions.tsx"
  );
  const adminPeopleView = readUtf8("src", "app", "admin", "people", "page-view.tsx");
  const adminPeopleFiltersPanel = readUtf8(
    "src",
    "app",
    "admin",
    "people",
    "page-view-directory-filters-panel.tsx"
  );
  const leaveCalendarConsole = readUtf8(
    "src",
    "components",
    "leave-calendar",
    "LeaveCalendarConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0704-admin-session-identity-devtools-gate-expansion.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(approvalExecutionsPage, /showDevTools=\{showDevTools\}/);
  assert.match(approvalWorkConditionsPanel, /showDevTools: boolean;/);
  assert.match(
    approvalWorkConditionsPanel,
    /\{showDevTools \? \([\s\S]*Session actor[\s\S]*\) : null\}/
  );

  assert.match(adminPeopleView, /showDevTools=\{showDevTools\}/);
  assert.match(adminPeopleFiltersPanel, /showDevTools: boolean;/);
  assert.match(
    adminPeopleFiltersPanel,
    /\{showDevTools \? \([\s\S]*Session organization[\s\S]*Session actor[\s\S]*\) : null\}/
  );

  assert.match(
    leaveCalendarConsole,
    /\{showDevTools \? \([\s\S]*Session organization[\s\S]*Session admin[\s\S]*\) : null\}/
  );

  assert.match(workItem, /WI-0704/i);
  assert.match(workItem, /approval|people|leave-calendar|session|identity|devtools/i);
  assert.match(roadmap, /WI-0704/i);
}

run()
  .then(() => {
    console.log("e2e-wi0704-admin-session-identity-devtools-gate-expansion.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
