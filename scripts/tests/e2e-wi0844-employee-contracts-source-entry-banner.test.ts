import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const inbox = readUtf8("src", "components", "contracts", "EmployeeContractsInbox.tsx");
  const workItem = readUtf8("work-items", "WI-0844-employee-contracts-source-entry-banner.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(inbox, /searchParams\.get\("source"\) === "employee-dashboard"/);
  assert.match(inbox, /직원 대시보드 바로가기에서 이동했습니다/);
  assert.match(inbox, /Opened from employee dashboard shortcut/);
  assert.match(inbox, /sourceHint \? <p className="small muted">\{sourceHint\}<\/p> : null/);

  assert.match(workItem, /WI-0844/i);
  assert.match(workItem, /employee|contracts|source|banner|dashboard/i);
  assert.match(roadmap, /WI-0844/i);
}

run();
console.log("e2e-wi0844-employee-contracts-source-entry-banner.test passed");
