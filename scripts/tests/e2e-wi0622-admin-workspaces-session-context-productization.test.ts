import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const attendanceDashboard = readUtf8(
    "src",
    "components",
    "admin-attendance-live",
    "AdminAttendanceLiveDashboard.tsx"
  );
  const attendanceSections = readUtf8(
    "src",
    "components",
    "admin-attendance-live",
    "AdminAttendanceLiveSections.tsx"
  );
  const onboardingHook = readUtf8(
    "src",
    "components",
    "admin-onboarding",
    "useAdminOnboardingData.ts"
  );
  const onboardingSections = readUtf8(
    "src",
    "components",
    "admin-onboarding",
    "AdminOnboardingSections.tsx"
  );
  const kpiDashboard = readUtf8("src", "components", "admin-kpi", "AdminKpiDashboard.tsx");
  const kpiSections = readUtf8("src", "components", "admin-kpi", "AdminKpiSections.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0622-admin-attendance-onboarding-analytics-session-context-productization.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(attendanceDashboard, /useStickyStringState/);
  assert.doesNotMatch(attendanceDashboard, /const \[accessToken/);
  assert.match(attendanceDashboard, /const organizationId = \(supabaseSession\?\.organizationId/);
  assert.match(attendanceDashboard, /\{showDevTools \? <AdminAttendanceLiveLogsPanel/);

  assert.doesNotMatch(attendanceSections, /onSetOrganizationId/);
  assert.doesNotMatch(attendanceSections, /onSetAdminActorId/);
  assert.doesNotMatch(attendanceSections, /onSetAccessToken/);

  assert.doesNotMatch(onboardingHook, /useStickyStringState/);
  assert.doesNotMatch(onboardingHook, /const \[accessToken/);
  assert.match(onboardingHook, /const organizationId = \(supabaseSession\?\.organizationId/);

  assert.doesNotMatch(onboardingSections, /onSetOrganizationId/);
  assert.doesNotMatch(onboardingSections, /onSetAdminActorId/);
  assert.doesNotMatch(onboardingSections, /onSetAccessToken/);

  assert.doesNotMatch(kpiDashboard, /useStickyStringState/);
  assert.doesNotMatch(kpiDashboard, /const \[accessToken/);
  assert.match(kpiDashboard, /const organizationId = \(supabaseSession\?\.organizationId/);
  assert.match(kpiDashboard, /\{showDevTools \? <AdminKpiLogsPanel/);

  assert.doesNotMatch(kpiSections, /onSetOrganizationId/);
  assert.doesNotMatch(kpiSections, /onSetAdminActorId/);
  assert.doesNotMatch(kpiSections, /onSetAccessToken/);

  assert.match(workItem, /WI-0622/i);
  assert.match(roadmap, /WI-0622/i);
}

run()
  .then(() => {
    console.log("e2e-wi0622-admin-workspaces-session-context-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
