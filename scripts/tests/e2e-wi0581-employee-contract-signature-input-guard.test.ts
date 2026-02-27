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
    "WI-0581-employee-contract-signature-input-guard.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const employeeAnchor = copy.indexOf("export const employeeContractsCopyByLocale");
  assert.ok(employeeAnchor >= 0, "missing employee contracts locale copy");
  const employeeKo = objectSectionByBrace(copy, "ko: {", employeeAnchor);
  const employeeEn = objectSectionByBrace(copy, "const employeeContractsCopyEn = {");

  assert.match(employeeEn, /signatureInputPlaceholder:\s*"Type your signature confirmation"/);
  assert.match(employeeEn, /signatureInputRequiredHint:\s*"Enter signature input before signing\."/);
  assert.match(employeeEn, /signatureInputRequiredError:\s*"Signature input is required to sign\."/);

  assert.match(employeeKo, /signatureInputPlaceholder:\s*"서명 확인 문구를 입력해 주세요"/);
  assert.match(employeeKo, /signatureInputRequiredHint:\s*"서명 전 서명 입력값을 먼저 입력해 주세요\."/);
  assert.match(employeeKo, /signatureInputRequiredError:\s*"서명하려면 서명 입력값이 필요합니다\."/);

  assert.match(inbox, /const normalizedSignatureInput = signatureInput\.trim\(\);/);
  assert.match(inbox, /if \(action === "SIGN" && !normalizedSignatureInput\)/);
  assert.match(inbox, /setError\(copy\.signatureInputRequiredError\);/);
  assert.match(inbox, /signatureInput:\s*action === "SIGN" \? normalizedSignatureInput : undefined/);

  assert.match(responsePanel, /const isSignatureInputReady = signatureInput\.trim\(\)\.length > 0;/);
  assert.match(responsePanel, /placeholder=\{copy\.signatureInputPlaceholder\}/);
  assert.match(responsePanel, /\{copy\.signatureInputRequiredHint\}/);
  assert.match(responsePanel, /disabled=\{!canRespondSelected \|\| !isSignatureInputReady\}/);

  assert.match(workItem, /WI-0581/i);
  assert.match(workItem, /contract|signature|input|guard|respond/i);
  assert.match(roadmap, /WI-0581/i);
}

run()
  .then(() => {
    console.log("e2e-wi0581-employee-contract-signature-input-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
