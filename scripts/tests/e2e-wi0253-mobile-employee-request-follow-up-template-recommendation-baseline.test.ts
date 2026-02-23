import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.trimEnd().split(/\r?\n/).length;
}

async function run() {
  const workItem = readUtf8("work-items", "WI-0253-mobile-employee-request-follow-up-template-recommendation-baseline.md");
  const followUpScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeRequestFollowUpScreen.js");
  const requestLib = readUtf8("apps", "mobile", "src", "lib", "employeeRequest.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(workItem, /DEPRECATED \(WI-0258\)/);
  assert.doesNotMatch(followUpScreen, /Recommendation templates/);
  assert.doesNotMatch(followUpScreen, /recommended template:/);
  assert.doesNotMatch(followUpScreen, /applyTemplateActionToFirst/);
  assert.doesNotMatch(requestLib, /EMPLOYEE_REQUEST_FOLLOW_UP_TEMPLATE_OPTIONS/);
  assert.doesNotMatch(requestLib, /recommendEmployeeRequestFollowUpTemplate/);
  assert.doesNotMatch(requestLib, /buildEmployeeRequestFollowUpTemplateStats/);
  assert.doesNotMatch(readme, /Employee request follow-up recommendation template shell/);

  assert.ok(
    countLines(followUpScreen) <= 430,
    `EmployeeRequestFollowUpScreen.js should stay under 430 lines after cleanup (current: ${countLines(followUpScreen)})`
  );
}

run()
  .then(() => {
    console.log("e2e-wi0253-mobile-employee-request-follow-up-template-recommendation-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
