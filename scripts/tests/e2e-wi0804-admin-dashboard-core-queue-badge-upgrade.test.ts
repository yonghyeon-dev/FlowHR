import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0804-admin-dashboard-core-queue-badge-upgrade.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPage, /const queueBadges = useMemo/);
  assert.match(adminPage, /label: isKoLocale \? "결재 대기함" : "Approval queue"/);
  assert.match(adminPage, /label: isKoLocale \? "급여 대기함" : "Payroll queue"/);
  assert.match(adminPage, /label: isKoLocale \? "계약 대기함" : "Contract queue"/);
  assert.match(adminPage, /pendingApprovalExecutionCount/);
  assert.match(adminPage, /stalledApprovalExecutionCount/);
  assert.match(adminPage, /undistributedPayrollCount/);
  assert.match(adminPage, /contractDecisionQueueCount/);
  assert.match(adminPage, /contractSlaOverdueCount/);
  assert.match(adminPage, /refresh approval executions/);
  assert.match(adminPage, /refresh contracts/);
  assert.match(adminPage, /resolveAdminContractDocumentNextStep/);
  assert.match(adminPage, /Core queue badges/);
  assert.match(adminPage, /Open queue/);

  assert.match(workItem, /WI-0804/i);
  assert.match(workItem, /admin|dashboard|queue|badge|approval|payroll|contract/i);
  assert.match(roadmap, /WI-0804/i);
}

run();
console.log("e2e-wi0804-admin-dashboard-core-queue-badge-upgrade.test passed");
