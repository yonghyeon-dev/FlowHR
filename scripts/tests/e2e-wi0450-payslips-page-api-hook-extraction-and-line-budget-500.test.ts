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
  const pageSource = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const apiHookSource = readUtf8("src", "app", "employee", "payslips", "use-payslip-api.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0450-payslips-page-api-hook-extraction-and-line-budget-500.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(pageSource, /import \{ usePayslipApi \} from "@\/app\/employee\/payslips\/use-payslip-api";/);
  assert.match(pageSource, /const \{ logs, pendingLabel, refreshPayslips, appendClientLog, clearLogs \} = usePayslipApi\(/);
  assert.doesNotMatch(pageSource, /async function callApi\(/);
  assert.ok(
    countLines(pageSource) <= 500,
    `payslips/page.tsx should stay <= 500 lines after WI-0450 (current: ${countLines(pageSource)})`
  );

  assert.match(apiHookSource, /export function usePayslipApi\(/);
  assert.match(apiHookSource, /const \[logs, setLogs\] = useState<ApiLog\[]>\(\[\]\);/);
  assert.match(apiHookSource, /const refreshPayslips = useCallback\(async \(\) =>/);
  assert.match(apiHookSource, /buildApiLogEntry\(/);

  assert.match(workItem, /WI-0450/i);
  assert.match(workItem, /payslip|api|hook|line budget/i);
  assert.match(roadmap, /WI-0450/i);
}

run()
  .then(() => {
    console.log("e2e-wi0450-payslips-page-api-hook-extraction-and-line-budget-500.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
