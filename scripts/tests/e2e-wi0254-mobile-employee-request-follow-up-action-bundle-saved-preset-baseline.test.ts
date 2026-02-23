import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const workItem = readUtf8("work-items", "WI-0254-mobile-employee-request-follow-up-action-bundle-saved-preset-baseline.md");
  const followUpScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeRequestFollowUpScreen.js");
  const requestLib = readUtf8("apps", "mobile", "src", "lib", "employeeRequest.js");
  const requestStore = readUtf8("apps", "mobile", "src", "lib", "employeeRequestStore.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(workItem, /DEPRECATED \(WI-0258\)/);
  assert.doesNotMatch(followUpScreen, /Action bundle presets/);
  assert.doesNotMatch(followUpScreen, /Pinned presets/);
  assert.doesNotMatch(followUpScreen, /Recent presets/);
  assert.doesNotMatch(followUpScreen, /Apply preset/);
  assert.doesNotMatch(followUpScreen, /runBundleQuickAction/);

  assert.doesNotMatch(requestLib, /EMPLOYEE_REQUEST_FOLLOW_UP_BUNDLE_PRESET_OPTIONS/);
  assert.doesNotMatch(requestLib, /resolveEmployeeRequestFollowUpFilterFromPreset/);
  assert.doesNotMatch(requestLib, /toggleEmployeeRequestFollowUpPresetPin/);
  assert.doesNotMatch(requestLib, /pushEmployeeRequestFollowUpPresetRecent/);
  assert.doesNotMatch(requestLib, /buildEmployeeRequestFollowUpBundleStats/);

  assert.doesNotMatch(requestStore, /flowhr\.mobile\.employee\.request\.follow-up\.preset\.v1/);
  assert.doesNotMatch(requestStore, /loadEmployeeRequestFollowUpPresetState/);
  assert.doesNotMatch(requestStore, /saveEmployeeRequestFollowUpPresetState/);
  assert.doesNotMatch(readme, /Employee request follow-up action bundle saved preset shell/);
}

run()
  .then(() => {
    console.log("e2e-wi0254-mobile-employee-request-follow-up-action-bundle-saved-preset-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
