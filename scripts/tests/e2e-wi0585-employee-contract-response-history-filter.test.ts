import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
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
    "WI-0585-employee-contract-response-history-filter.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const employeeAnchor = copy.indexOf("export const employeeContractsCopyByLocale");
  assert.ok(employeeAnchor >= 0, "missing employee contracts locale copy");
  const employeeEn = objectSectionByBrace(copy, "const employeeContractsCopyEn = {");
  const employeeKo = objectSectionByBrace(copy, "ko: {", employeeAnchor);

  assert.match(employeeEn, /responseHistoryFilterLabel:\s*"History filter"/);
  assert.match(employeeEn, /responseHistoryFilterAllAction:\s*"All"/);
  assert.match(employeeEn, /responseHistoryFilterSignedAction:\s*"Signed"/);
  assert.match(employeeEn, /responseHistoryFilterRejectedAction:\s*"Rejected"/);
  assert.match(employeeEn, /responseHistoryFilterEvidenceAction:\s*"Evidence"/);
  assert.match(employeeEn, /responseHistoryVisibleCountLabel:\s*"Visible history"/);
  assert.match(employeeEn, /responseHistoryFilteredEmpty:\s*"No history matches the selected filter\."/);

  assert.match(employeeKo, /responseHistoryFilterLabel:/);
  assert.match(employeeKo, /responseHistoryFilterAllAction:/);
  assert.match(employeeKo, /responseHistoryFilterSignedAction:/);
  assert.match(employeeKo, /responseHistoryFilterRejectedAction:/);
  assert.match(employeeKo, /responseHistoryFilterEvidenceAction:/);
  assert.match(employeeKo, /responseHistoryVisibleCountLabel:/);
  assert.match(employeeKo, /responseHistoryFilteredEmpty:/);

  assert.match(responsePanel, /type ResponseHistoryFilter = "ALL" \| ResponseHistoryEntryType;/);
  assert.match(responsePanel, /const \[responseHistoryFilter, setResponseHistoryFilter\]/);
  assert.match(responsePanel, /const filteredResponseHistoryEntries = useMemo\(/);
  assert.match(responsePanel, /copy\.responseHistoryFilterLabel/);
  assert.match(responsePanel, /copy\.responseHistoryFilterAllAction/);
  assert.match(responsePanel, /copy\.responseHistoryFilterSignedAction/);
  assert.match(responsePanel, /copy\.responseHistoryFilterRejectedAction/);
  assert.match(responsePanel, /copy\.responseHistoryFilterEvidenceAction/);
  assert.match(responsePanel, /copy\.responseHistoryVisibleCountLabel/);
  assert.match(responsePanel, /copy\.responseHistoryFilteredEmpty/);

  assert.ok(
    countLines(responsePanel) <= 300,
    `EmployeeContractsResponsePanel.tsx line budget regression: ${countLines(responsePanel)}`
  );

  assert.match(workItem, /WI-0585/i);
  assert.match(workItem, /contract|response|history|filter/i);
  assert.match(roadmap, /WI-0585/i);
}

run()
  .then(() => {
    console.log("e2e-wi0585-employee-contract-response-history-filter.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
