import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const peoplePage = readUtf8("src", "app", "admin", "people", "page.tsx");
  const peopleView = readUtf8("src", "app", "admin", "people", "page-view.tsx");
  const orgChartPanel = readUtf8(
    "src",
    "app",
    "admin",
    "people",
    "page-view-org-chart-panel.tsx"
  );
  const readinessPanel = readUtf8(
    "src",
    "components",
    "admin-onboarding",
    "AdminOnboardingReadinessPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0868-admin-people-session-autoload-source-return.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(peoplePage, /const autoLoadTriggeredRef = useRef\(false\);/);
  assert.match(peoplePage, /const autoHistoryFetchKeyRef = useRef<string \| null>\(null\);/);
  assert.match(peoplePage, /if \(isProductionRuntime && !usesBearerToken\)/);
  assert.match(peoplePage, /void refreshDirectory\(\);/);
  assert.match(
    peoplePage,
    /const historyKey = `\$\{employeeId\}:\$\{historyLimit\.trim\(\) \|\| "30"\}`;/
  );
  assert.match(peoplePage, /void loadSelectedEmployeeHistory\(employeeId\);/);
  assert.match(peoplePage, /setHistory\(\[\]\);/);

  assert.match(peopleView, /const sourceContextReturnHref/);
  assert.match(peopleView, /Back to onboarding/);
  assert.match(peopleView, /Back to dashboard/);
  assert.match(peopleView, /sourceContext !== "admin-dashboard"/);

  assert.doesNotMatch(orgChartPanel, /loadSelectedEmployeeHistory/);

  assert.match(readinessPanel, /function withOnboardingSource/);
  assert.match(readinessPanel, /source=admin-onboarding/);
  assert.match(readinessPanel, /withOnboardingSource\(checklistHrefByKey\[item\.key\]\)/);

  assert.match(workItem, /WI-0868/i);
  assert.match(workItem, /session|autoload|source|return/i);
  assert.match(roadmap, /WI-0868/i);
}

run();
console.log("e2e-wi0868-admin-people-session-autoload-source-return.test passed");
