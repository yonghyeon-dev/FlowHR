import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function objectSectionByBrace(source: string, startToken: string, fromIndex = 0) {
  const start = source.indexOf(startToken, fromIndex);
  assert.ok(start >= 0, `missing token: ${startToken}`);
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }
  throw new Error(`failed to close section for token: ${startToken}`);
}

async function run() {
  const copy = readUtf8("src", "components", "contracts", "copy.ts");
  const inbox = readUtf8("src", "components", "contracts", "EmployeeContractsInbox.tsx");
  const responsePanel = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractsResponsePanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0582-employee-contract-evidence-metadata-copy-action.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const employeeAnchor = copy.indexOf("export const employeeContractsCopyByLocale");
  assert.ok(employeeAnchor >= 0, "missing employee contracts locale copy");
  const employeeKo = objectSectionByBrace(copy, "ko: {", employeeAnchor);
  const employeeEn = objectSectionByBrace(copy, "const employeeContractsCopyEn = {");

  assert.match(employeeEn, /copyEvidenceMetadataAction:\s*"Copy Evidence Metadata"/);
  assert.match(employeeEn, /copiedEvidenceMetadataStatus:\s*"Evidence metadata copied"/);
  assert.match(employeeEn, /copyEvidenceMetadataError:\s*"Failed to copy evidence metadata"/);
  assert.match(employeeKo, /copyEvidenceMetadataAction:\s*"증빙 메타데이터 복사"/);
  assert.match(employeeKo, /copiedEvidenceMetadataStatus:\s*"증빙 메타데이터를 복사했습니다"/);
  assert.match(employeeKo, /copyEvidenceMetadataError:\s*"증빙 메타데이터 복사에 실패했습니다"/);

  assert.match(inbox, /async function copyEvidenceMetadata\(/);
  assert.match(inbox, /navigator\.clipboard\.writeText\(metadataText\)/);
  assert.match(inbox, /setMessage\(copy\.copiedEvidenceMetadataStatus\)/);
  assert.match(inbox, /setError\(copy\.copyEvidenceMetadataError\)/);
  assert.match(inbox, /onCopyEvidenceMetadata=\{copyEvidenceMetadata\}/);

  assert.match(responsePanel, /onCopyEvidenceMetadata:/);
  assert.match(responsePanel, /copy\.copyEvidenceMetadataAction/);
  assert.match(responsePanel, /onCopyEvidenceMetadata\(signatureEvidence, evidenceDisplayFileName\)/);

  assert.match(workItem, /WI-0582/i);
  assert.match(workItem, /contract|evidence|metadata|copy|clipboard/i);
  assert.match(roadmap, /WI-0582/i);
}

run()
  .then(() => {
    console.log("e2e-wi0582-employee-contract-evidence-metadata-copy-action.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
