import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const dashboard = readUtf8(
    "src",
    "components",
    "admin-kpi",
    "AdminKpiDashboard.tsx"
  );
  const panel = readUtf8(
    "src",
    "components",
    "admin-kpi",
    "AdminOnboardingKpiPanel.tsx"
  );
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0796-admin-analytics-onboarding-kpi-panel.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    dashboard,
    /loadOnboardingKpi/,
    "admin KPI dashboard should load onboarding KPI snapshot"
  );
  assert.match(
    dashboard,
    /\/api\/people\/employees/,
    "onboarding KPI should query employees API"
  );
  assert.match(
    dashboard,
    /\/api\/auth\/invites/,
    "onboarding KPI should query invites API"
  );
  assert.match(
    dashboard,
    /\/api\/contracts\/documents/,
    "onboarding KPI should query contracts API"
  );
  assert.match(
    dashboard,
    /<AdminOnboardingKpiPanel copy=\{copy\} snapshot=\{onboardingKpi\} \/>/,
    "analytics mode should render onboarding KPI panel"
  );

  assert.match(
    panel,
    /buildOnboardingKpiSnapshot/,
    "onboarding KPI panel should expose snapshot builder"
  );
  assert.match(
    panel,
    /inviteCoveragePercent/,
    "onboarding KPI snapshot should include invite coverage"
  );
  assert.match(
    panel,
    /contractResponseCoveragePercent/,
    "onboarding KPI snapshot should include contract response coverage"
  );
  assert.match(
    panel,
    /readinessPercent/,
    "onboarding KPI snapshot should include readiness percent"
  );

  assert.match(copy, /onboardingPanel:/);

  assert.match(workItem, /WI-0796/i);
  assert.match(workItem, /admin|analytics|onboarding|kpi/i);
  assert.match(roadmap, /WI-0796/i);
}

run();
console.log("e2e-wi0796-admin-analytics-onboarding-kpi-panel.test passed");
