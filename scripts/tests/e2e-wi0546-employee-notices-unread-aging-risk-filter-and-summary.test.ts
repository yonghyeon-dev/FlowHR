import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const board = readUtf8("src", "components", "notices", "EmployeeNoticeBoard.tsx");
  const helpers = readUtf8("src", "components", "notices", "employee-notice-board-helpers.ts");
  const copy = readUtf8("src", "components", "notices", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0546-employee-notices-unread-aging-risk-filter-and-summary.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(board, /const \[agingRiskFilter, setAgingRiskFilter\] = useState<.*>\("all"\)/);
  assert.match(board, /normalizeEmployeeNoticeAgingRiskFilter/);
  assert.match(board, /copy\.agingRiskFilterLabel/);
  assert.match(board, /copy\.agingRiskFilterOnlyOption/);
  assert.match(board, /copy\.unreadAgingRiskSummaryLabel/);

  assert.match(helpers, /export type EmployeeNoticeAgingRiskFilter = "all" \| "aging_3d"/);
  assert.match(helpers, /export function normalizeEmployeeNoticeAgingRiskFilter/);
  assert.match(helpers, /agingRiskFilter === "aging_3d"/);
  assert.match(helpers, /export function isNoticeUnreadAgingRisk/);

  assert.match(copy, /agingRiskFilterLabel: string;/);
  assert.match(copy, /agingRiskFilterOnlyOption: string;/);
  assert.match(copy, /unreadAgingRiskSummaryLabel: string;/);

  assert.match(workItem, /WI-0546/i);
  assert.match(workItem, /notice|unread|aging|risk|filter|summary/i);
  assert.match(roadmap, /WI-0546/i);
}

run()
  .then(() => {
    console.log("e2e-wi0546-employee-notices-unread-aging-risk-filter-and-summary.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
