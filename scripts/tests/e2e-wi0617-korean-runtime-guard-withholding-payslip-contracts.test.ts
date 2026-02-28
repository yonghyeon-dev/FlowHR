import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const withholdingRuntimeLabels = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "runtime-label-helpers.ts"
  );
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
  const contractsResponsePanel = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractsResponsePanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0617-korean-runtime-guard-withholding-payslip-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(withholdingRuntimeLabels, /"preview receipt": "원천징수영수증 미리보기"/);
  assert.match(withholdingRuntimeLabels, /"load issued document": "원천징수영수증 문서 조회"/);
  assert.match(withholdingRuntimeLabels, /"load finalized settlement": "연말 확정 정산 조회"/);
  assert.match(withholdingRuntimeLabels, /return hasLatinText\(normalized\) \? "요청 실행" : normalized;/);

  assert.match(contractsCopy, /responseHistoryEvidenceFormatJsonLabel: "JSON evidence"/);
  assert.match(contractsCopy, /responseHistoryEvidenceFormatTextLabel: "Text evidence"/);
  assert.match(contractsCopy, /responseHistoryEvidenceFormatJsonLabel: "구조 데이터 증빙"/);
  assert.match(contractsCopy, /responseHistoryEvidenceFormatTextLabel: "텍스트 증빙"/);

  assert.match(contractsResponsePanel, /const evidenceFormatDetail =/);
  assert.match(
    contractsResponsePanel,
    /signatureEvidence\.format === "json"\s*\?\s*copy\.responseHistoryEvidenceFormatJsonLabel\s*:\s*copy\.responseHistoryEvidenceFormatTextLabel/
  );
  assert.doesNotMatch(contractsResponsePanel, /signatureEvidence\.format\.toUpperCase\(\)/);

  assert.match(workItem, /WI-0617/i);
  assert.match(workItem, /korean|runtime|guard|withholding|payslip|contracts/i);
  assert.match(roadmap, /WI-0617/i);
}

run()
  .then(() => {
    console.log("e2e-wi0617-korean-runtime-guard-withholding-payslip-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
