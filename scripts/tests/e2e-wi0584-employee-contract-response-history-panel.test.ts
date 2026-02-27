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
  const workItem = readUtf8(
    "work-items",
    "WI-0584-employee-contract-response-history-panel.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const employeeAnchor = copy.indexOf("export const employeeContractsCopyByLocale");
  assert.ok(employeeAnchor >= 0, "missing employee contracts locale copy");
  const employeeKo = objectSectionByBrace(copy, "ko: {", employeeAnchor);
  const employeeEn = objectSectionByBrace(copy, "const employeeContractsCopyEn = {");

  assert.match(employeeEn, /responseHistoryTitle:\s*"Recent Response History"/);
  assert.match(employeeEn, /responseHistoryEmpty:\s*"No recent response history is available\."/);
  assert.match(employeeEn, /responseHistorySignedLabel:\s*"Signed response"/);
  assert.match(employeeEn, /responseHistoryRejectedLabel:\s*"Rejected response"/);
  assert.match(employeeEn, /responseHistoryEvidenceLoadedLabel:\s*"Evidence loaded"/);

  assert.match(employeeKo, /responseHistoryTitle:\s*"최근 응답 이력"/);
  assert.match(employeeKo, /responseHistoryEmpty:\s*"최근 응답 이력이 없습니다\."/);
  assert.match(employeeKo, /responseHistorySignedLabel:\s*"서명 응답"/);
  assert.match(employeeKo, /responseHistoryRejectedLabel:\s*"거절 응답"/);
  assert.match(employeeKo, /responseHistoryEvidenceLoadedLabel:\s*"증빙 로드"/);

  assert.match(responsePanel, /const responseHistoryEntries = useMemo\(/);
  assert.match(responsePanel, /copy\.responseHistorySignedLabel/);
  assert.match(responsePanel, /copy\.responseHistoryRejectedLabel/);
  assert.match(responsePanel, /copy\.responseHistoryEvidenceLoadedLabel/);
  assert.match(responsePanel, /copy\.responseHistoryTitle/);
  assert.match(responsePanel, /copy\.responseHistoryEmpty/);

  assert.match(workItem, /WI-0584/i);
  assert.match(workItem, /contract|response|history|panel|timeline/i);
  assert.match(roadmap, /WI-0584/i);
}

run()
  .then(() => {
    console.log("e2e-wi0584-employee-contract-response-history-panel.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
