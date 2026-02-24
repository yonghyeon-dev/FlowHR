import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const withholdingFlowHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-year-end-withholding-flow-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0353-payroll-service-modular-split-phase18-withholding-receipt-flow.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(withholdingFlowHelpers, /getPayrollYearEndWithholdingReceiptDocumentFromHelper/);
  assert.match(withholdingFlowHelpers, /getPayrollYearEndFinalizedSettlementFromHelper/);
  assert.match(withholdingFlowHelpers, /issuePayrollYearEndWithholdingReceiptFromHelper/);

  assert.match(
    payrollService,
    /return await getPayrollYearEndWithholdingReceiptDocumentFromHelper\(context, input\);/
  );
  assert.match(
    payrollService,
    /return await getPayrollYearEndFinalizedSettlementFromHelper\(context, input\);/
  );
  assert.match(
    payrollService,
    /return await issuePayrollYearEndWithholdingReceiptFromHelper\(context, input\);/
  );

  assert.match(workItem, /WI-0353/i);
  assert.match(workItem, /modular split/i);
  assert.match(roadmap, /WI-0353/i);
}

run()
  .then(() => {
    console.log("e2e-wi0353-payroll-service-modular-split-phase18-withholding-receipt-flow.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
