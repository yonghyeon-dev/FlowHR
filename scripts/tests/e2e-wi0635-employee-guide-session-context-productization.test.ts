import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const hookSource = readUtf8("src", "components", "employee-guide", "useEmployeeGuideData.ts");
  const dashboardSource = readUtf8("src", "components", "employee-guide", "EmployeeGuideDashboard.tsx");
  const sectionsSource = readUtf8("src", "components", "employee-guide", "EmployeeGuideSections.tsx");
  const workItem = readUtf8("work-items", "WI-0635-employee-guide-session-context-productization.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(hookSource, /useStickyStringState/);
  assert.doesNotMatch(hookSource, /const \[accessToken/);
  assert.match(hookSource, /const organizationId = \(supabaseSession\?\.organizationId \?\? ""\)\.trim\(\)/);
  assert.match(hookSource, /const employeeId = \(supabaseSession\?\.actorId \?\? supabaseSession\?\.userId \?\? "EMP-1001"\)\.trim\(\) \|\| "EMP-1001"/);
  assert.match(hookSource, /const bearerToken = isProductionRuntime \? \(supabaseSession\?\.accessToken \?\? ""\) : "";/);

  assert.doesNotMatch(dashboardSource, /accessToken=\{data\.accessToken\}/);
  assert.doesNotMatch(dashboardSource, /onSetOrganizationId=/);
  assert.doesNotMatch(dashboardSource, /onSetEmployeeId=/);
  assert.doesNotMatch(dashboardSource, /onSetAccessToken=/);

  assert.match(sectionsSource, /Session organization/);
  assert.match(sectionsSource, /Session employee/);
  assert.doesNotMatch(sectionsSource, /onSetOrganizationId/);
  assert.doesNotMatch(sectionsSource, /onSetEmployeeId/);
  assert.doesNotMatch(sectionsSource, /onSetAccessToken/);
  assert.match(sectionsSource, /\{showDevTools \? \(/);

  assert.match(workItem, /WI-0635/i);
  assert.match(roadmap, /WI-0635/i);
}

run()
  .then(() => {
    console.log("e2e-wi0635-employee-guide-session-context-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
