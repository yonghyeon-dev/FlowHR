import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.trimEnd().split(/\r?\n/).length;
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0237-admin-onboarding-wizard-baseline.md");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");
  const layout = readUtf8("src", "app", "admin", "layout.tsx");
  const page = readUtf8("src", "app", "admin", "onboarding", "page.tsx");
  const dashboard = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingDashboard.tsx");
  const sections = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingSections.tsx");
  const copy = readUtf8("src", "components", "admin-onboarding", "copy.ts");
  const helpersSource = readUtf8("src", "components", "admin-onboarding", "helpers.ts");
  const hookSource = readUtf8("src", "components", "admin-onboarding", "useAdminOnboardingData.ts");
  const checklistSource = readUtf8("src", "features", "admin-onboarding", "checklist.ts");

  assert.match(roadmap, /WI-0237/);
  assert.match(workItem, /Admin Onboarding Wizard Baseline/);
  assert.match(messages, /"admin\.nav\.onboarding":/);
  assert.match(messages, /"admin\.nav\.onboarding": "Onboarding Wizard"/);
  assert.match(layout, /href:\s*"\/admin\/onboarding"/);
  assert.match(page, /AdminOnboardingDashboard/);
  assert.match(hookSource, /\/api\/people\/departments/);
  assert.match(hookSource, /\/api\/people\/employees/);
  assert.match(hookSource, /\/api\/leave\/policy/);
  assert.match(hookSource, /\/api\/auth\/invites/);
  assert.match(hookSource, /\/api\/contracts\/templates/);
  assert.match(copy, /inviteCoverageTitle/);
  assert.match(copy, /contractTemplateTitle/);
  assert.match(helpersSource, /parseDepartmentSeedInput/);
  assert.match(helpersSource, /parseEmployeeSeedInput/);
  assert.match(checklistSource, /buildOnboardingChecklist/);
  assert.match(checklistSource, /"invites"/);
  assert.match(checklistSource, /"contracts"/);

  assert.ok(
    countLines(dashboard) <= 300,
    `AdminOnboardingDashboard.tsx should stay under 300 lines (current: ${countLines(dashboard)})`
  );
  assert.ok(
    countLines(sections) <= 300,
    `AdminOnboardingSections.tsx should stay under 300 lines (current: ${countLines(sections)})`
  );

  const { buildOnboardingChecklist, onboardingProgressPercent } = await import(
    "../../src/features/admin-onboarding/checklist.ts"
  );
  const { buildQuery, parseDepartmentSeedInput, parseEmployeeSeedInput } = await import(
    "../../src/components/admin-onboarding/helpers.ts"
  );

  const checklist = buildOnboardingChecklist({
    organizationId: "ORG-1",
    departmentCount: 2,
    employeeCount: 0,
    inviteCoverageDone: false,
    leavePolicyConfigured: true,
    contractJourneyDone: false
  });
  assert.equal(checklist.length, 6);
  assert.equal(checklist.find((item) => item.key === "employees")?.done, false);
  assert.equal(checklist.find((item) => item.key === "invites")?.done, false);
  assert.equal(checklist.find((item) => item.key === "contracts")?.done, false);
  assert.equal(onboardingProgressPercent(checklist), 50);

  const completeChecklist = buildOnboardingChecklist({
    organizationId: "ORG-2",
    departmentCount: 1,
    employeeCount: 1,
    inviteCoverageDone: true,
    leavePolicyConfigured: true,
    contractJourneyDone: true
  });
  assert.equal(onboardingProgressPercent(completeChecklist), 100);

  const departments = parseDepartmentSeedInput("HR,Human Resources\nDEV,Development\nhr,Duplicate\nbad-line");
  assert.deepEqual(departments, [
    { code: "HR", name: "Human Resources" },
    { code: "DEV", name: "Development" }
  ]);

  const employees = parseEmployeeSeedInput(
    "EMP-1,Alice,alice@example.com,HR\nEMP-2,,bob@example.com,\nemp-1,Dup,dup@example.com,DEV\ninvalid"
  );
  assert.deepEqual(employees, [
    { id: "EMP-1", name: "Alice", email: "alice@example.com", departmentCode: "HR" },
    { id: "EMP-2", name: "EMP-2", email: "bob@example.com", departmentCode: null }
  ]);

  assert.equal(
    buildQuery({ organizationId: "ORG-1", active: "true", empty: "  " }),
    "?organizationId=ORG-1&active=true"
  );
}

run()
  .then(() => {
    console.log("e2e-wi0237-admin-onboarding-wizard-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
