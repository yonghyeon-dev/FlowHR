import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const derivedStateHook = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "use-payslip-derived-state.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0403-payslips-derived-state-hook-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    payslipPage,
    /import \{ usePayslipDerivedState \} from "@\/app\/employee\/payslips\/use-payslip-derived-state";/
  );
  assert.match(payslipPage, /}\s*=\s*usePayslipDerivedState\(\{/);
  assert.doesNotMatch(payslipPage, /resolvePayslipRunStateLabel\(run\.state, isKoLocale\)/);

  const payslipPageLineCount = payslipPage.split(/\r?\n/).length;
  assert.ok(
    payslipPageLineCount < 600,
    `expected employee payslips page line count below 600, got ${payslipPageLineCount}`
  );

  assert.match(derivedStateHook, /export function usePayslipDerivedState\(/);
  assert.match(derivedStateHook, /buildCompareMetrics\(/);
  assert.match(derivedStateHook, /resolvePayslipRunStateLabel\(run\.state, isKoLocale\)/);
  assert.match(derivedStateHook, /stateSearchText:\s*`\$\{run\.state\.toLowerCase\(\)\} \$\{stateLabel\.toLowerCase\(\)\}`/);

  assert.match(workItem, /WI-0403/i);
  assert.match(workItem, /derived state|hook|decomposition/i);
  assert.match(roadmap, /WI-0403/i);
}

run()
  .then(() => {
    console.log("e2e-wi0403-payslips-derived-state-hook-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

