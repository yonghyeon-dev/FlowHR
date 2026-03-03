import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeeNoticeBoard = readUtf8("src", "components", "notices", "EmployeeNoticeBoard.tsx");
  const workItem = readUtf8("work-items", "WI-0809-employee-notices-admin-link-devtools-gate.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeeNoticeBoard, /const showDevTools = isTruthyFlag/);
  assert.match(
    employeeNoticeBoard,
    /showDevTools \? <Link className="btn btn-secondary" href="\/admin\/notices">DEV \/admin\/notices<\/Link> : null/
  );
  assert.doesNotMatch(
    employeeNoticeBoard,
    /<Link className="btn btn-secondary" href="\/admin\/notices">\s*\/admin\/notices\s*<\/Link>/
  );

  assert.match(workItem, /WI-0809/i);
  assert.match(workItem, /employee|notices|admin link|devtools|gate|product mode/i);
  assert.match(roadmap, /WI-0809/i);
}

run();
console.log("e2e-wi0809-employee-notices-admin-link-devtools-gate.test passed");
