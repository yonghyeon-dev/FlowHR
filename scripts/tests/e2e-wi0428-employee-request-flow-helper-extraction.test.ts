import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const derivedHelpers = readUtf8("src", "app", "employee", "page-derived-helpers.ts");
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");

  const workItem = readUtf8("work-items", "WI-0428-employee-request-flow-helper-extraction.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(derivedHelpers, /export function buildRequestFlowStats\(/);
  assert.match(derivedHelpers, /requestCompletionRatePercent/);
  assert.match(derivedHelpers, /export function resolveSelectedResubmitCandidate\(/);

  assert.match(employeePage, /buildRequestFlowStats,/);
  assert.match(employeePage, /resolveSelectedResubmitCandidate,/);
  assert.match(employeePage, /const requestFlowStats = useMemo\(/);
  assert.match(employeePage, /resolveSelectedResubmitCandidate\(resubmitCandidates, selectedResubmitCandidateKey\)/);
  assert.match(employeePage, /requestCompletionRatePercent: requestFlowStats\.requestCompletionRatePercent/);

  assert.match(workItem, /WI-0428/i);
  assert.match(workItem, /employee|request flow|helper|extraction|decomposition/i);
  assert.match(roadmap, /WI-0428/i);
}

run()
  .then(() => {
    console.log("e2e-wi0428-employee-request-flow-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
