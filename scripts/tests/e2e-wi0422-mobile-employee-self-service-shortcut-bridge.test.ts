import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const rootNavigator = readUtf8("apps", "mobile", "src", "navigation", "RootNavigator.js");
  const employeeHome = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");

  const workItem = readUtf8("work-items", "WI-0422-mobile-employee-self-service-shortcut-bridge.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(rootNavigator, /import \{ Linking, StyleSheet, Text, View \} from "react-native";/);
  assert.match(rootNavigator, /function resolveMobileWebUrl\(pathname\)/);
  assert.match(rootNavigator, /onOpenNotices=\{\(\) => void Linking\.openURL\(resolveMobileWebUrl\("\/employee\/notices"\)\)\}/);
  assert.match(rootNavigator, /onOpenBenefits=\{\(\) => void Linking\.openURL\(resolveMobileWebUrl\("\/employee\/benefits"\)\)\}/);
  assert.match(rootNavigator, /onOpenRecruitment=\{\(\) => void Linking\.openURL\(resolveMobileWebUrl\("\/employee\/recruitment"\)\)\}/);

  assert.match(employeeHome, /onOpenNotices/);
  assert.match(employeeHome, /onOpenBenefits/);
  assert.match(employeeHome, /onOpenRecruitment/);
  assert.match(employeeHome, /extensionsCardTitle/);
  assert.match(employeeHome, /noticesAction/);
  assert.match(employeeHome, /benefitsAction/);
  assert.match(employeeHome, /recruitmentAction/);
  assert.match(employeeHome, /resolveMobileLocale\(\)/);

  assert.match(workItem, /WI-0422/i);
  assert.match(workItem, /mobile|employee|shortcut|notice|benefit|recruitment/i);
  assert.match(roadmap, /WI-0422/i);
}

run()
  .then(() => {
    console.log("e2e-wi0422-mobile-employee-self-service-shortcut-bridge.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

