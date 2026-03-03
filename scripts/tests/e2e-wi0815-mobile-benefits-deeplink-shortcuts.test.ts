import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const rootNavigator = readUtf8("apps", "mobile", "src", "navigation", "RootNavigator.js");
  const employeeHome = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const workItem = readUtf8("work-items", "WI-0815-mobile-benefits-deeplink-shortcuts.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(employeeHome) <= 300,
    `EmployeeHomeScreen.js should stay under 300 lines (current: ${countLines(employeeHome)})`
  );

  assert.match(employeeHome, /onOpenBenefitsPending/);
  assert.match(employeeHome, /onOpenBenefitsApproved/);
  assert.match(employeeHome, /benefitsPendingAction/);
  assert.match(employeeHome, /benefitsApprovedAction/);

  assert.match(
    rootNavigator,
    /resolveMobileWebUrl\("\/employee\/benefits\?status=SUBMITTED&risk=pending_3d"\)/
  );
  assert.match(rootNavigator, /resolveMobileWebUrl\("\/employee\/benefits\?status=APPROVED"\)/);

  assert.match(workItem, /WI-0815/i);
  assert.match(workItem, /mobile|benefits|deeplink|shortcut|pending|approved/i);
  assert.match(roadmap, /WI-0815/i);
}

run()
  .then(() => {
    console.log("e2e-wi0815-mobile-benefits-deeplink-shortcuts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
