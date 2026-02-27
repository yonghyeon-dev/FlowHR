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
  const filters = readUtf8("src", "components", "contracts", "useAdminContractsDocumentFilters.ts");
  const controls = readUtf8("src", "components", "contracts", "AdminContractsDocumentFilterControls.tsx");
  const workspace = readUtf8("src", "components", "contracts", "AdminContractsWorkspace.tsx");
  const copy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0590-admin-contracts-decision-queue-visibility.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(filters, /function isDecisionQueueDocument/);
  assert.match(filters, /const \[decisionQueueOnly, setDecisionQueueOnly\] = useState\(false\)/);
  assert.match(filters, /const decisionQueueCount = useMemo/);
  assert.match(filters, /if \(decisionQueueOnly && !isDecisionQueueDocument\(document\)\)/);

  assert.match(controls, /decisionQueueOnly: boolean/);
  assert.match(controls, /onDecisionQueueOnlyChange: \(value: boolean\) => void/);
  assert.match(controls, /decisionQueueCount: number/);
  assert.match(controls, /copy\.decisionQueueOnlyLabel/);
  assert.match(controls, /copy\.decisionQueueCountLabel/);

  assert.match(workspace, /decisionQueueOnly=\{decisionQueueOnly\}/);
  assert.match(workspace, /onDecisionQueueOnlyChange=\{setDecisionQueueOnly\}/);
  assert.match(workspace, /decisionQueueCount=\{decisionQueueCount\}/);

  assert.match(copy, /decisionQueueOnlyLabel:/);
  assert.match(copy, /decisionQueueCountLabel:/);

  assert.ok(
    countLines(workspace) <= 260,
    `AdminContractsWorkspace.tsx should stay <= 260 lines (current: ${countLines(workspace)})`
  );

  assert.match(workItem, /WI-0590/i);
  assert.match(workItem, /contracts|decision queue|visibility|filter|summary/i);
  assert.match(roadmap, /WI-0590/i);
}

run()
  .then(() => {
    console.log("e2e-wi0590-admin-contracts-decision-queue-visibility.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
