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
  const responsePanel = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractsResponsePanel.tsx"
  );
  const workItem = readUtf8("work-items", "WI-0583-employee-contract-hash-copy-actions.md");
  const roadmap = readUtf8("ROADMAP.md");

  const employeeAnchor = copy.indexOf("export const employeeContractsCopyByLocale");
  assert.ok(employeeAnchor >= 0, "missing employee contracts locale copy");
  const employeeKo = objectSectionByBrace(copy, "ko: {", employeeAnchor);
  const employeeEn = objectSectionByBrace(copy, "const employeeContractsCopyEn = {");

  assert.match(employeeEn, /copySignatureHashAction:\s*"Copy Signature Hash"/);
  assert.match(employeeEn, /copyEvidenceHashAction:\s*"Copy Evidence Hash"/);
  assert.match(employeeEn, /copiedSignatureHashStatus:\s*"Signature hash copied"/);
  assert.match(employeeEn, /copiedEvidenceHashStatus:\s*"Evidence hash copied"/);
  assert.match(employeeEn, /copyHashClipboardError:\s*"Failed to copy hash"/);

  assert.match(employeeKo, /copySignatureHashAction:\s*"서명 해시 복사"/);
  assert.match(employeeKo, /copyEvidenceHashAction:\s*"증빙 해시 복사"/);
  assert.match(employeeKo, /copiedSignatureHashStatus:\s*"서명 해시를 복사했습니다"/);
  assert.match(employeeKo, /copiedEvidenceHashStatus:\s*"증빙 해시를 복사했습니다"/);
  assert.match(employeeKo, /copyHashClipboardError:\s*"해시 복사에 실패했습니다"/);

  assert.match(responsePanel, /async function copyHash\(hashType: "signature" \| "evidence"\)/);
  assert.match(responsePanel, /navigator\.clipboard\?\.writeText/);
  assert.match(responsePanel, /copy\.copySignatureHashAction/);
  assert.match(responsePanel, /copy\.copyEvidenceHashAction/);
  assert.match(responsePanel, /copy\.copiedSignatureHashStatus/);
  assert.match(responsePanel, /copy\.copiedEvidenceHashStatus/);
  assert.match(responsePanel, /copy\.copyHashClipboardError/);
  assert.match(responsePanel, /void copyHash\("signature"\)/);
  assert.match(responsePanel, /void copyHash\("evidence"\)/);

  assert.match(workItem, /WI-0583/i);
  assert.match(workItem, /contract|hash|copy|signature|evidence/i);
  assert.match(roadmap, /WI-0583/i);
}

run()
  .then(() => {
    console.log("e2e-wi0583-employee-contract-hash-copy-actions.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
