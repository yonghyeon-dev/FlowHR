import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const ackHelpers = readUtf8("src", "features", "payroll", "year-end-filing-ack-catalog-helpers.ts");
  const workItem = readUtf8("work-items", "WI-0304-payroll-service-modular-split-phase5.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payrollService, /from "@\/features\/payroll\/year-end-filing-ack-catalog-helpers"/);
  assert.match(
    payrollService,
    /return buildPayrollYearEndFilingAckCatalogCore\(\) as ListPayrollYearEndFilingAckCatalogResult;/
  );
  assert.match(payrollService, /return resolvePayrollYearEndFilingAckPayloadCore\(input\);/);

  assert.doesNotMatch(payrollService, /const payrollYearEndAcceptedAckCodeCatalog/);
  assert.doesNotMatch(payrollService, /const payrollYearEndRejectedAckCodeCatalog/);
  assert.doesNotMatch(payrollService, /const payrollYearEndRejectionReasonCatalog/);
  assert.doesNotMatch(payrollService, /const payrollYearEndDefaultRejectedReasonCode/);

  assert.match(ackHelpers, /export function buildPayrollYearEndFilingAckCatalog\(/);
  assert.match(ackHelpers, /export function resolvePayrollYearEndFilingAckPayload\(/);
  assert.match(ackHelpers, /const payrollYearEndAcceptedAckCodeCatalog/);
  assert.match(ackHelpers, /const payrollYearEndRejectedAckCodeCatalog/);
  assert.match(ackHelpers, /const payrollYearEndRejectionReasonCatalog/);
  assert.match(ackHelpers, /const payrollYearEndDefaultRejectedReasonCode/);

  assert.match(workItem, /WI-0304/i);
  assert.match(workItem, /modular split/i);
  assert.match(roadmap, /WI-0304/i);
}

run()
  .then(() => {
    console.log("e2e-wi0304-payroll-service-modular-split-phase5.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
