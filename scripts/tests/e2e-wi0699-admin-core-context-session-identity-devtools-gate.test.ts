import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const attendanceSections = readUtf8(
    "src",
    "components",
    "admin-attendance-live",
    "AdminAttendanceLiveSections.tsx"
  );
  const attendanceDashboard = readUtf8(
    "src",
    "components",
    "admin-attendance-live",
    "AdminAttendanceLiveDashboard.tsx"
  );

  const onboardingSections = readUtf8(
    "src",
    "components",
    "admin-onboarding",
    "AdminOnboardingSections.tsx"
  );
  const onboardingDashboard = readUtf8(
    "src",
    "components",
    "admin-onboarding",
    "AdminOnboardingDashboard.tsx"
  );
  const onboardingData = readUtf8(
    "src",
    "components",
    "admin-onboarding",
    "useAdminOnboardingData.ts"
  );

  const kpiSections = readUtf8("src", "components", "admin-kpi", "AdminKpiSections.tsx");
  const kpiDashboard = readUtf8("src", "components", "admin-kpi", "AdminKpiDashboard.tsx");

  const workItem = readUtf8(
    "work-items",
    "WI-0699-admin-core-context-session-identity-devtools-gate.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(attendanceSections, /showDevTools: boolean;/);
  assert.match(
    attendanceSections,
    /\{showDevTools \? \([\s\S]*<p className="small muted">[\s\S]*\{copy\.organizationIdLabel\}:/
  );
  assert.match(attendanceDashboard, /showDevTools=\{showDevTools\}/);

  assert.match(onboardingSections, /showDevTools: boolean;/);
  assert.match(
    onboardingSections,
    /\{showDevTools \? \([\s\S]*<p className="small muted">[\s\S]*\{copy\.organizationIdLabel\}:/
  );
  assert.match(onboardingDashboard, /showDevTools=\{data\.showDevTools\}/);
  assert.match(onboardingData, /const showDevTools = isTruthyFlag\(process\.env\.NEXT_PUBLIC_FLOWHR_DEV_TOOLS\)/);
  assert.match(onboardingData, /showDevTools,/);

  assert.match(kpiSections, /showDevTools: boolean;/);
  assert.match(
    kpiSections,
    /\{showDevTools \? \([\s\S]*<p className="small muted">[\s\S]*\{copy\.organizationIdLabel\}:/
  );
  assert.match(kpiDashboard, /showDevTools=\{showDevTools\}/);

  assert.match(workItem, /WI-0699/i);
  assert.match(workItem, /admin core|context|session|identity|devtools/i);
  assert.match(roadmap, /WI-0699/i);
}

run()
  .then(() => {
    console.log("e2e-wi0699-admin-core-context-session-identity-devtools-gate.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
