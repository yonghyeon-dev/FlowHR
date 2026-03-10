import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminNavigation = readUtf8("src", "app", "admin", "admin-shell-navigation.ts");
  const adminPeoplePage = readUtf8("src", "app", "admin", "people", "page.tsx");
  const adminPeopleDirectoryActions = readUtf8(
    "src",
    "app",
    "admin",
    "people",
    "page-directory-actions.ts"
  );
  const adminPeoplePageView = readUtf8("src", "app", "admin", "people", "page-view.tsx");
  const peopleSurface = `${adminPeoplePage}\n${adminPeopleDirectoryActions}\n${adminPeoplePageView}`;
  const historyRoute = readUtf8(
    "src",
    "app",
    "api",
    "people",
    "employees",
    "[employeeId]",
    "history",
    "route.ts"
  );
  const peopleContract = readUtf8("specs", "people", "contract.yaml");
  const peopleApi = readUtf8("specs", "people", "api.yaml");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(adminNavigation, /\/admin\/people/, "admin navigation should link to people directory page");

  assert.match(peopleSurface, /id="org-chart"/, "people page should include organization chart section");
  assert.match(peopleSurface, /id="employee-compare"/, "people page should include employee comparison section");
  assert.match(peopleSurface, /id="employee-history"/, "people page should include employee history section");
  assert.match(
    peopleSurface,
    /\/api\/people\/employees\/\$\{encodeURIComponent\(employeeId\)\}\/history/,
    "people page should call employee history API"
  );

  assert.match(historyRoute, /listEmployeeProfileHistory/, "history route should use people service history reader");
  assert.match(
    peopleContract,
    /path: \/people\/employees\/\{employeeId\}\/history/,
    "people contract should document history endpoint"
  );
  assert.match(peopleApi, /\/people\/employees\/\{employeeId\}\/history:/, "people api spec should define history endpoint");

  assert.match(globalCss, /\.panel-org-chart/, "org chart panel styles should exist");
  assert.match(globalCss, /\.history-card-list/, "employee history card styles should exist");
}

run();
console.log("e2e-wi0130-organization-chart-and-hr-history-ui.test passed");
