import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
  const responsePanel = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractsResponsePanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0641-employee-contracts-response-deadline-status-visibility.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(contractsCopy, /expiresAtLabel: "Expires at"/);
  assert.match(contractsCopy, /deadlineStatusLabel: "Deadline status"/);
  assert.match(contractsCopy, /deadlineStatusDueSoonPrefix: "Due soon"/);
  assert.match(contractsCopy, /deadlineStatusOverduePrefix: "Overdue"/);

  assert.match(contractsCopy, /expiresAtLabel: "응답 기한"/);
  assert.match(contractsCopy, /deadlineStatusLabel: "기한 상태"/);
  assert.match(contractsCopy, /deadlineStatusDueSoonPrefix: "응답 임박"/);
  assert.match(contractsCopy, /deadlineStatusOverduePrefix: "기한 초과"/);

  assert.match(responsePanel, /resolveDueSoonPendingDays/);
  assert.match(responsePanel, /resolveOverduePendingDays/);
  assert.match(responsePanel, /const deadlineStatusText = useMemo/);
  assert.match(responsePanel, /copy\.expiresAtLabel/);
  assert.match(responsePanel, /copy\.deadlineStatusLabel/);
  assert.match(responsePanel, /D\+/);
  assert.match(responsePanel, /D-/);

  assert.match(workItem, /WI-0641/i);
  assert.match(roadmap, /WI-0641/i);
}

run()
  .then(() => {
    console.log("e2e-wi0641-employee-contracts-response-deadline-status-visibility.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
