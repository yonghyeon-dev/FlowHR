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
  const withholdingCopyRuntime = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
  const withholdingRuntimeLabels = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "runtime-label-helpers.ts"
  );
  const withholdingPanels = readUtf8("src", "components", "withholding-receipt", "WithholdingReceiptPanels.tsx");
  const contractsInbox = readUtf8("src", "components", "contracts", "EmployeeContractsInbox.tsx");
  const contractsInboxList = readUtf8("src", "components", "contracts", "EmployeeContractsInboxList.tsx");
  const payslipRunListPanel = readUtf8("src", "app", "employee", "payslips", "page-view-run-list-panel.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0596-korean-residual-bugpack-withholding-payslips-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(withholdingRuntimeLabels, /const withholdingActivityLabelKoMap: Record<string, string> = \{/);
  assert.match(withholdingRuntimeLabels, /"withholding receipt preview": "원천징수영수증 미리보기"/);
  assert.match(withholdingRuntimeLabels, /export function normalizeWithholdingActivityLabel\(/);

  assert.match(withholdingPanels, /normalizeWithholdingActivityLabel\(pendingLabel, locale\)/);
  assert.match(withholdingPanels, /normalizeWithholdingActivityLabel\(log\.label, locale\)/);

  assert.match(contractsInboxList, /function resolveDocumentStatusLabel\(/);
  assert.match(contractsInboxList, /function resolveApprovalStatusLabel\(/);
  assert.match(contractsInboxList, /"알 수 없는 상태"/);
  assert.match(contractsInboxList, /"알 수 없는 승인 상태"/);
  assert.doesNotMatch(contractsInbox, /isPendingResponseStatus,/);

  assert.match(
    payslipRunListPanel,
    /pageCopy\.payslipList\.gross[\s\S]*formatKrw\(run\.grossPayKrw\)[\s\S]*\//
  );
  assert.match(
    payslipRunListPanel,
    /pageCopy\.payslipList\.deduction[\s\S]*formatKrw\(run\.totalDeductionsKrw\)[\s\S]*\//
  );
  assert.match(
    payslipRunListPanel,
    /pageCopy\.payslipList\.net[\s\S]*formatKrw\(run\.netPayKrw\)[\s\S]*\//
  );

  assert.ok(
    countLines(withholdingCopyRuntime) <= 380,
    `withholding-receipt/copy-runtime.ts should stay <= 380 lines (current: ${countLines(withholdingCopyRuntime)})`
  );
  assert.ok(
    countLines(withholdingPanels) <= 220,
    `WithholdingReceiptPanels.tsx should stay <= 220 lines (current: ${countLines(withholdingPanels)})`
  );
  assert.ok(
    countLines(contractsInbox) <= 300,
    `EmployeeContractsInbox.tsx should stay <= 300 lines (current: ${countLines(contractsInbox)})`
  );

  assert.match(workItem, /WI-0596/i);
  assert.match(workItem, /korean|residual|withholding|payslip|contracts|bugpack/i);
  assert.match(roadmap, /WI-0596/i);
}

run()
  .then(() => {
    console.log("e2e-wi0596-korean-residual-bugpack-withholding-payslips-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
