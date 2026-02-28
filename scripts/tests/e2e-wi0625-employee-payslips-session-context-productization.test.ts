import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const page = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const filterPanel = readUtf8("src", "app", "employee", "payslips", "page-view-filter-panel.tsx");
  const view = readUtf8("src", "app", "employee", "payslips", "page-view.tsx");
  const viewTypes = readUtf8("src", "app", "employee", "payslips", "page-view-types.ts");
  const workItem = readUtf8("work-items", "WI-0625-employee-payslips-session-context-productization.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(page, /useStickyStringState/);
  assert.doesNotMatch(page, /const \[accessToken/);
  assert.match(page, /const organizationId = \(supabaseSession\?\.organizationId/);
  assert.match(page, /const employeeId = normalizeEmployeeIdForLocaleInput/);

  assert.doesNotMatch(filterPanel, /setOrganizationId/);
  assert.doesNotMatch(filterPanel, /setEmployeeId/);
  assert.doesNotMatch(filterPanel, /accessToken/);
  assert.match(filterPanel, /organizationIdOptional[\s\S]*employeeId/);

  assert.doesNotMatch(view, /setOrganizationId=/);
  assert.doesNotMatch(view, /setEmployeeId=/);
  assert.doesNotMatch(view, /setAccessToken=/);

  assert.doesNotMatch(viewTypes, /setOrganizationId/);
  assert.doesNotMatch(viewTypes, /setEmployeeId/);
  assert.doesNotMatch(viewTypes, /setAccessToken/);

  assert.match(workItem, /WI-0625/i);
  assert.match(roadmap, /WI-0625/i);
}

run()
  .then(() => {
    console.log("e2e-wi0625-employee-payslips-session-context-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
