import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const peopleFiltersPanel = readUtf8(
    "src",
    "app",
    "admin",
    "people",
    "page-view-directory-filters-panel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0618-admin-dashboard-productization-and-session-context.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(adminPage, /AdminDashboardPanels/);
  assert.doesNotMatch(adminPage, /useAdminDashboardState/);
  assert.match(adminPage, /href="\/admin\/approval-executions"/);
  assert.match(adminPage, /href="\/admin\/people"/);
  assert.match(adminPage, /href="\/admin\/scheduling"/);
  assert.match(adminPage, /href="\/admin\/payroll-year-end"/);

  assert.doesNotMatch(adminLayout, /\/admin#approvals/);
  assert.doesNotMatch(adminLayout, /\/admin#payroll/);
  assert.doesNotMatch(adminLayout, /\/admin\/payroll-year-end-filing\/ops\/alert/);
  assert.match(adminLayout, /href: "\/admin\/approval-executions"/);

  assert.doesNotMatch(peopleFiltersPanel, /setOrganizationId/);
  assert.doesNotMatch(peopleFiltersPanel, /setAdminActorId/);
  assert.doesNotMatch(peopleFiltersPanel, /setAccessToken/);
  assert.match(peopleFiltersPanel, /Workspace status|\uC791\uC5C5 \uACF5\uAC04 \uC0C1\uD0DC/);
  assert.match(peopleFiltersPanel, /Admin session status|\uAD00\uB9AC\uC790 \uC138\uC158 \uC0C1\uD0DC/);

  assert.match(workItem, /WI-0618/i);
  assert.match(workItem, /dashboard|session|admin|people/i);
  assert.match(roadmap, /WI-0618/i);
}

run()
  .then(() => {
    console.log("e2e-wi0618-admin-dashboard-productization-and-session-context.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
