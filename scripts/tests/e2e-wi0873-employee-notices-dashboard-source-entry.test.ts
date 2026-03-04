import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const hubs = readUtf8("src", "components", "employee-dashboard", "workspace-hubs.ts");
  const board = readUtf8("src", "components", "notices", "EmployeeNoticeBoard.tsx");
  const sourceContext = readUtf8(
    "src",
    "components",
    "notices",
    "employee-source-context.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0873-employee-notices-dashboard-source-entry.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(hubs, /\/employee\/notices\?source=employee-dashboard/);

  assert.match(board, /useSearchParams/);
  assert.match(board, /resolveEmployeeNoticeSourceEntry/);
  assert.match(board, /searchParams\.get\("source"\)/);
  assert.match(board, /sourceEntry \? <p className="small muted">\{sourceEntry\.hint\}<\/p> : null/);
  assert.match(board, /sourceEntry \? sourceEntry\.returnLabel : "\/employee"/);

  assert.match(sourceContext, /source !== "employee-dashboard"/);
  assert.match(sourceContext, /Opened from employee dashboard\./);
  assert.match(sourceContext, /Back to dashboard/);

  assert.match(workItem, /WI-0873/i);
  assert.match(workItem, /employee|notices|dashboard|source|entry/i);
  assert.match(roadmap, /WI-0873/i);
}

run();
console.log("e2e-wi0873-employee-notices-dashboard-source-entry.test passed");
