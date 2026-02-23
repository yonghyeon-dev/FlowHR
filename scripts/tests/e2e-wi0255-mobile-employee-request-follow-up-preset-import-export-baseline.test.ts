import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const workItem = readUtf8("work-items", "WI-0255-mobile-employee-request-follow-up-preset-import-export-baseline.md");
  const followUpScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeRequestFollowUpScreen.js");
  const requestLib = readUtf8("apps", "mobile", "src", "lib", "employeeRequest.js");
  const readme = readUtf8("apps", "mobile", "README.md");
  const transferCardPath = join(
    process.cwd(),
    "apps",
    "mobile",
    "src",
    "components",
    "EmployeeRequestFollowUpPresetTransferCard.js"
  );

  assert.match(workItem, /DEPRECATED \(WI-0258\)/);
  assert.doesNotMatch(followUpScreen, /EmployeeRequestFollowUpPresetTransferCard/);
  assert.doesNotMatch(followUpScreen, /onImportPresetState/);
  assert.doesNotMatch(requestLib, /serializeEmployeeRequestFollowUpPresetState/);
  assert.doesNotMatch(requestLib, /parseEmployeeRequestFollowUpPresetState/);
  assert.doesNotMatch(requestLib, /EMPLOYEE_REQUEST_FOLLOW_UP_PRESET_TRANSFER_TYPE/);
  assert.equal(existsSync(transferCardPath), false, "EmployeeRequestFollowUpPresetTransferCard should be removed");
  assert.doesNotMatch(readme, /Employee request follow-up preset import\/export transfer shell/);
}

run()
  .then(() => {
    console.log("e2e-wi0255-mobile-employee-request-follow-up-preset-import-export-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
