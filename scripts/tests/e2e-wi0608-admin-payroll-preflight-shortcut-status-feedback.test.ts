import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const consoleFile = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0608-admin-payroll-preflight-shortcut-status-feedback.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(consoleFile, /const shortcutStatusCopy =/);
  assert.match(consoleFile, /openedPendingQueue/);
  assert.match(consoleFile, /openedRejectedQueue/);

  assert.match(consoleFile, /runOpenPendingSubmissionsFromPreflight\(\)[\s\S]*setStatusMessage\(shortcutStatusCopy\.openedPendingQueue\)/);
  assert.match(consoleFile, /runOpenRejectedSubmissionsFromPreflight\(\)[\s\S]*setStatusMessage\(shortcutStatusCopy\.openedRejectedQueue\)/);
  assert.match(consoleFile, /runOpenPendingSubmissionsFromPreflight\(\)[\s\S]*setTimeout\(\(\) => setStatusMessage\(""\), 3000\)/);
  assert.match(consoleFile, /runOpenRejectedSubmissionsFromPreflight\(\)[\s\S]*setTimeout\(\(\) => setStatusMessage\(""\), 3000\)/);

  assert.match(workItem, /WI-0608/i);
  assert.match(workItem, /shortcut|status|feedback|preflight|queue/i);
  assert.match(roadmap, /WI-0608/i);
}

run()
  .then(() => {
    console.log("e2e-wi0608-admin-payroll-preflight-shortcut-status-feedback.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
