import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const yearEndCopy = readUtf8("src", "components", "payroll-year-end", "copy.ts");
  const yearEndConsole = readUtf8("src", "components", "payroll-year-end", "PayrollYearEndConsole.tsx");
  const withholdingCopy = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
  const workItem = readUtf8("work-items", "WI-1066-year-end-explanation-copy.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const gapInventory = readUtf8("docs", "production-gap-inventory.md");

  assert.match(yearEndConsole, /taxCreditReasonCodesLabel/);
  assert.match(yearEndConsole, /deductionReasonCodesLabel/);
  assert.match(yearEndConsole, /insuranceReasonCodeLabel/);

  assert.doesNotMatch(
    yearEndCopy,
    /inputVectorHashLabel:\s*"Input Vector Hash"/,
    "year-end summary copy must not expose raw input-vector hash wording"
  );
  assert.doesNotMatch(
    yearEndCopy,
    /inputVectorHashLabel:\s*"입력 벡터 해시"/,
    "year-end summary copy must not expose raw 벡터 해시 wording"
  );
  assert.doesNotMatch(
    yearEndCopy,
    /taxCreditReasonCodesLabel:\s*"Tax Credit Reason Codes"/,
    "year-end summary copy must not expose reason-code wording"
  );
  assert.doesNotMatch(
    yearEndCopy,
    /taxCreditReasonCodesLabel:\s*"세액공제 사유 코드"/,
    "year-end summary copy must not expose 사유 코드 wording"
  );
  assert.doesNotMatch(
    yearEndCopy,
    /deductionReasonCodesLabel:\s*"Deduction Reason Codes"/,
    "year-end recalculation copy must not expose deduction reason-code wording"
  );
  assert.doesNotMatch(
    yearEndCopy,
    /insuranceReasonCodeLabel:\s*"Insurance Reason Code"/,
    "year-end insurance copy must not expose insurance reason-code wording"
  );
  assert.doesNotMatch(
    withholdingCopy,
    /settlementHashLabel:\s*"정산 해시"/,
    "withholding receipt summary must not expose raw 정산 해시 wording"
  );
  assert.doesNotMatch(
    withholdingCopy,
    /settlementHashLabel:\s*"Settlement Hash"/,
    "withholding receipt summary must not expose raw Settlement Hash wording"
  );

  assert.match(workItem, /WI-1066/i);
  assert.match(progress, /WI-1066/i);
  assert.match(gapInventory, /WI-1066/i);
}

run()
  .then(() => {
    console.log("e2e-wi1066-year-end-explanation-copy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
