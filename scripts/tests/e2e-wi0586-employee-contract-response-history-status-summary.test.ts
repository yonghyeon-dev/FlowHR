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
  const responsePanel = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractsResponsePanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0586-employee-contract-response-history-status-summary.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(responsePanel, /const responseHistoryCounts = useMemo\(\(\) => \{/);
  assert.match(responsePanel, /counts\[entry\.type\] \+= 1/);
  assert.match(responsePanel, /const responseHistoryFilterOptions = \[/);
  assert.match(responsePanel, /count: responseHistoryEntries\.length/);
  assert.match(responsePanel, /count: responseHistoryCounts\.SIGNED/);
  assert.match(responsePanel, /count: responseHistoryCounts\.REJECTED/);
  assert.match(responsePanel, /count: responseHistoryCounts\.EVIDENCE/);
  assert.match(responsePanel, /\{option\.label\} \(\{option\.count\}\)/);
  assert.match(responsePanel, /copy\.responseHistorySignedLabel\}: \{responseHistoryCounts\.SIGNED\}/);
  assert.match(responsePanel, /copy\.responseHistoryRejectedLabel\}: \{responseHistoryCounts\.REJECTED\}/);
  assert.match(responsePanel, /copy\.responseHistoryEvidenceLoadedLabel\}: \{responseHistoryCounts\.EVIDENCE\}/);

  assert.ok(
    countLines(responsePanel) <= 300,
    `EmployeeContractsResponsePanel.tsx line budget regression: ${countLines(responsePanel)}`
  );

  assert.match(workItem, /WI-0586/i);
  assert.match(workItem, /contract|response|history|status|summary|filter/i);
  assert.match(roadmap, /WI-0586/i);
}

run()
  .then(() => {
    console.log("e2e-wi0586-employee-contract-response-history-status-summary.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
