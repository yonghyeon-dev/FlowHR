import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipReceiptConsole = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "PayslipReceiptConsole.tsx"
  );
  const payslipReceiptCopy = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "copy.ts"
  );

  const withholdingConsole = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const withholdingHook = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "useWithholdingReceiptRequests.ts"
  );
  const withholdingCopy = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "copy-runtime.ts"
  );

  const insuranceInputPanel = readUtf8(
    "src",
    "components",
    "payroll-insurance",
    "PayrollInsuranceSettlementInputPanel.tsx"
  );

  const workItem = readUtf8(
    "work-items",
    "WI-0889-employee-receipts-production-session-gate-and-ko-copy-fix.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    payslipReceiptConsole,
    /const allowHeaderActorFallback = showDevTools \|\| !isProductionRuntime;/
  );
  assert.match(
    payslipReceiptConsole,
    /const requiresLoginSession = isProductionRuntime && !usesBearerToken && !showDevTools;/
  );
  assert.match(
    payslipReceiptConsole,
    /copy\.productionSessionRequiredNotice\} <Link href="\/login">\/login<\/Link>/
  );
  assert.match(
    payslipReceiptConsole,
    /disabled=\{pendingLabel !== null \|\| requiresLoginSession\}/
  );
  assert.match(payslipReceiptCopy, /productionSessionRequiredNotice/);

  assert.match(
    withholdingConsole,
    /const requiresLoginSession = isProductionRuntime && !usesBearerToken && !showDevTools;/
  );
  assert.match(
    withholdingConsole,
    /productionSessionRequiredNotice\} <Link href="\/login">\/login<\/Link>/
  );
  assert.match(withholdingHook, /allowHeaderActorFallback: boolean;/);
  assert.match(withholdingHook, /requiresLoginSession: boolean;/);
  assert.match(withholdingHook, /copy\.productionSessionRequiredNotice/);
  assert.match(withholdingCopy, /productionSessionRequiredNotice/);

  assert.match(insuranceInputPanel, /"세션 조직"/);
  assert.match(insuranceInputPanel, /"세션 관리자"/);
  assert.doesNotMatch(insuranceInputPanel, /\?몄뀡/);

  assert.match(workItem, /WI-0889/i);
  assert.match(roadmap, /WI-0889/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0889-employee-receipts-production-session-gate-and-ko-copy-fix.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

