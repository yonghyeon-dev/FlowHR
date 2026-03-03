import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const workspaceHubs = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "workspace-hubs.ts"
  );
  const payslipReceiptConsole = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "PayslipReceiptConsole.tsx"
  );
  const withholdingReceiptConsole = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0870-employee-pay-document-source-context-shortcuts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    workspaceHubs,
    /href: "\/employee\/payslips\?source=employee-dashboard"/
  );
  assert.match(
    workspaceHubs,
    /href: "\/employee\/payslip-receipts\?source=employee-dashboard"/
  );
  assert.match(
    workspaceHubs,
    /href: "\/employee\/withholding-receipt\?source=employee-dashboard"/
  );
  assert.match(workspaceHubs, /label: "명세서 수신 확인"/);
  assert.match(workspaceHubs, /label: "Payslip receipt"/);

  assert.match(payslipReceiptConsole, /useSearchParams/);
  assert.match(payslipReceiptConsole, /searchParams\.get\("source"\)/);
  assert.match(payslipReceiptConsole, /employee-dashboard/);
  assert.match(payslipReceiptConsole, /Back to dashboard/);
  assert.match(payslipReceiptConsole, /대시보드로 돌아가기/);

  assert.match(withholdingReceiptConsole, /useSearchParams/);
  assert.match(withholdingReceiptConsole, /searchParams\.get\("source"\)/);
  assert.match(withholdingReceiptConsole, /employee-dashboard/);
  assert.match(withholdingReceiptConsole, /Back to dashboard/);
  assert.match(withholdingReceiptConsole, /대시보드로 돌아가기/);

  assert.match(workItem, /WI-0870/i);
  assert.match(workItem, /employee|pay|document|source|context|shortcuts/i);
  assert.match(roadmap, /WI-0870/i);
}

run();
console.log("e2e-wi0870-employee-pay-document-source-context-shortcuts.test passed");
