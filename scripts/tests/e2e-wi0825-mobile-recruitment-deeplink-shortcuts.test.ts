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
  const workItem = readUtf8("work-items", "WI-0825-mobile-recruitment-deeplink-shortcuts.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(employeeHome) <= 300,
    `EmployeeHomeScreen.js should stay under 300 lines (current: ${countLines(employeeHome)})`
  );

  assert.match(employeeHome, /onOpenRecruitmentStalled/);
  assert.match(employeeHome, /onOpenRecruitmentSubmitted/);
  assert.match(employeeHome, /recruitmentStalledAction/);
  assert.match(employeeHome, /recruitmentSubmittedAction/);

  assert.match(
    rootNavigator,
    /resolveMobileWebUrl\("\/employee\/recruitment\?risk=stalled_7d"\)/
  );
  assert.match(
    rootNavigator,
    /resolveMobileWebUrl\("\/employee\/recruitment\?stage=SUBMITTED"\)/
  );

  assert.match(workItem, /WI-0825/i);
  assert.match(workItem, /mobile|recruitment|deeplink|shortcut|stalled|submitted/i);
  assert.match(roadmap, /WI-0825/i);
}

run()
  .then(() => {
    console.log("e2e-wi0825-mobile-recruitment-deeplink-shortcuts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
