import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { normalizeContractsEvidenceFileName } from "@/components/contracts/runtime-copy-helpers";
import { normalizeWithholdingDocumentFileName } from "@/components/withholding-receipt/copy-runtime";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const withholdingConsoleSource = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const withholdingPanelsSource = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptPanels.tsx"
  );
  const withholdingCopyRuntimeSource = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "copy-runtime.ts"
  );
  const payslipDetailPanelSource = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-detail-panel.tsx"
  );
  const contractsInboxSource = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractsInbox.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0487-korean-surface-english-suppression-withholding-payslips-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.equal(
    normalizeWithholdingDocumentFileName("withholding-receipt-2025.json", "RCP-2025", "json", "ko"),
    "원천징수영수증-RCP-2025.json"
  );
  assert.equal(
    normalizeWithholdingDocumentFileName("원천징수영수증-RCP-2025.json", "RCP-2025", "json", "ko"),
    "원천징수영수증-RCP-2025.json"
  );
  assert.equal(
    normalizeContractsEvidenceFileName("signature-evidence-DOC-1001.txt", "DOC-1001", true),
    "계약-증빙-DOC-1001.txt"
  );

  assert.match(withholdingCopyRuntimeSource, /export function normalizeWithholdingDocumentFileName/);
  assert.match(withholdingCopyRuntimeSource, /documentPreviewHiddenNotice/);

  assert.match(withholdingConsoleSource, /normalizeWithholdingDocumentFileName/);
  assert.match(withholdingConsoleSource, /hideDocumentRawPreview=\{locale === "ko"\}/);
  assert.match(withholdingPanelsSource, /hideDocumentRawPreview: boolean/);
  assert.match(withholdingPanelsSource, /copy\.documentPreviewHiddenNotice/);

  assert.match(payslipDetailPanelSource, /selectedRun\.deductionBreakdown && !isKoLocale/);
  assert.doesNotMatch(payslipDetailPanelSource, /selectedRun\.deductionBreakdown \? \(/);

  assert.match(contractsInboxSource, /normalizeContractsEvidenceFileName\(signatureEvidence\.fileName, selected\.id, isKoLocale\)/);
  assert.match(contractsInboxSource, /anchor\.download = downloadFileName/);

  assert.match(workItem, /WI-0487/i);
  assert.match(workItem, /korean|english|withholding|payslip|contracts/i);
  assert.match(roadmap, /WI-0487/i);
}

run()
  .then(() => {
    console.log("e2e-wi0487-korean-surface-english-suppression-withholding-payslips-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
