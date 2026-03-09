import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const inbox = readUtf8("src", "components", "contracts", "EmployeeContractsInbox.tsx");
  const inboxHeader = readUtf8("src", "components", "contracts", "EmployeeContractsInboxHeader.tsx");
  const sourceContext = readUtf8(
    "src",
    "components",
    "contracts",
    "employee-source-context.ts"
  );
  const workItem = readUtf8("work-items", "WI-0844-employee-contracts-source-entry-banner.md");
  const roadmap = readUtf8("ROADMAP.md");
  const inboxSurface = `${inbox}\n${inboxHeader}`;

  assert.match(inbox, /resolveEmployeeContractsSourceEntry\(searchParams\.get\("source"\), isKoLocale\)/);
  assert.match(inboxSurface, /sourceHint \? <p className="small muted">\{sourceHint\}<\/p> : null/);
  assert.match(sourceContext, /source !== "employee-dashboard"/);
  assert.match(sourceContext, /직원 대시보드 바로가기에서 이동했습니다\./);
  assert.match(sourceContext, /Opened from employee dashboard shortcut\./);

  assert.match(workItem, /WI-0844/i);
  assert.match(workItem, /employee|contracts|source|banner|dashboard/i);
  assert.match(roadmap, /WI-0844/i);
}

run();
console.log("e2e-wi0844-employee-contracts-source-entry-banner.test passed");
