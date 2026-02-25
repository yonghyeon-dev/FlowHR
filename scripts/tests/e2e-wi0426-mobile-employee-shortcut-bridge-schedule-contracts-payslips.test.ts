import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const rootNavigator = readUtf8("apps", "mobile", "src", "navigation", "RootNavigator.js");
  const employeeHome = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");

  const workItem = readUtf8(
    "work-items",
    "WI-0426-mobile-employee-shortcut-bridge-schedule-contracts-payslips.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    rootNavigator,
    /onOpenSchedule=\{\(\) => void Linking\.openURL\(resolveMobileWebUrl\("\/employee\/schedule"\)\)\}/
  );
  assert.match(
    rootNavigator,
    /onOpenContracts=\{\(\) => void Linking\.openURL\(resolveMobileWebUrl\("\/employee\/contracts"\)\)\}/
  );
  assert.match(
    rootNavigator,
    /onOpenPayslips=\{\(\) => void Linking\.openURL\(resolveMobileWebUrl\("\/employee\/payslips"\)\)\}/
  );

  assert.match(employeeHome, /onOpenSchedule/);
  assert.match(employeeHome, /onOpenContracts/);
  assert.match(employeeHome, /onOpenPayslips/);
  assert.match(employeeHome, /scheduleAction/);
  assert.match(employeeHome, /contractsAction/);
  assert.match(employeeHome, /payslipsAction/);
  assert.match(employeeHome, /onPress=\{onOpenPayslips\}/);

  assert.match(workItem, /WI-0426/i);
  assert.match(workItem, /mobile|shortcut|schedule|contracts|payslips/i);
  assert.match(roadmap, /WI-0426/i);
}

run()
  .then(() => {
    console.log("e2e-wi0426-mobile-employee-shortcut-bridge-schedule-contracts-payslips.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
