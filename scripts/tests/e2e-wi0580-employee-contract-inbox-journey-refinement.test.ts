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
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
  const inboxHelpers = readUtf8(
    "src",
    "components",
    "contracts",
    "employee-inbox-filter-helpers.ts"
  );
  const employeeInbox = readUtf8("src", "components", "contracts", "EmployeeContractsInbox.tsx");
  const responsePanel = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractsResponsePanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0580-employee-contract-inbox-journey-refinement.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const employeeAnchor = contractsCopy.indexOf("export const employeeContractsCopyByLocale");
  assert.ok(employeeAnchor >= 0, "missing employee contracts locale copy");
  const employeeKo = objectSectionByBrace(contractsCopy, "ko: {", employeeAnchor);
  const employeeEn = objectSectionByBrace(contractsCopy, "const employeeContractsCopyEn = {");

  assert.match(employeeKo, /nextActionTitle:\s*"다음 권장 작업"/);
  assert.match(employeeKo, /nextActionRespondDueSoon:\s*"응답 기한이 임박했습니다\./);
  assert.match(employeeKo, /nextActionRespondOverdue:\s*"응답 기한이 지났습니다\./);
  assert.match(employeeEn, /nextActionTitle:\s*"Next Action"/);
  assert.match(employeeEn, /nextActionRespondDueSoon:\s*"Deadline is near\./);
  assert.match(employeeEn, /nextActionRespondOverdue:\s*"Response deadline is overdue\./);

  assert.match(inboxHelpers, /export function resolveDueSoonPendingDays\(/);
  assert.match(inboxHelpers, /export function resolveOverduePendingDays\(/);
  assert.match(inboxHelpers, /function resolveDayDistance\(/);

  assert.match(employeeInbox, /resolveDueSoonPendingDays/);
  assert.match(employeeInbox, /resolveOverduePendingDays/);
  assert.match(employeeInbox, /const nextActionHint = useMemo/);
  assert.match(employeeInbox, /\(D\+\{overdueDays\}\)/);
  assert.match(employeeInbox, /\(D-\{dueSoonDays\}\)/);
  assert.match(employeeInbox, /nextActionHint=\{nextActionHint\}/);

  assert.match(responsePanel, /nextActionHint: string;/);
  assert.match(responsePanel, /\{copy\.nextActionTitle\}/);
  assert.match(responsePanel, /\{nextActionHint\}/);

  assert.match(workItem, /WI-0580/i);
  assert.match(workItem, /contract|inbox|journey|next action|deadline|D\+/i);
  assert.match(roadmap, /WI-0580/i);
}

run()
  .then(() => {
    console.log("e2e-wi0580-employee-contract-inbox-journey-refinement.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
