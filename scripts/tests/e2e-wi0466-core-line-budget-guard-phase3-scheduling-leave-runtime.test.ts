import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

function assertLineBudget(source: string, limit: number, label: string) {
  const lines = countLines(source);
  assert.ok(lines <= limit, `${label} should stay <= ${limit} lines (current: ${lines})`);
}

async function run() {
  const schedulingService = readUtf8("src", "features", "scheduling", "service.ts");
  const schedulingIncidentHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "incident-read-model-helpers.ts"
  );
  const leaveService = readUtf8("src", "features", "leave", "service.ts");
  const leavePolicyTimeHelpers = readUtf8("src", "features", "leave", "policy-time-helpers.ts");
  const payslipReceiptRuntimeHelpers = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "runtime-copy-helpers.ts"
  );
  const withholdingRuntimeHelpers = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "copy-runtime.ts"
  );
  const contractsHttp = readUtf8("src", "components", "contracts", "http.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0466-core-line-budget-guard-phase3-scheduling-leave-runtime.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assertLineBudget(schedulingService, 4800, "scheduling/service.ts");
  assertLineBudget(schedulingIncidentHelpers, 360, "scheduling/incident-read-model-helpers.ts");
  assertLineBudget(leaveService, 2600, "leave/service.ts");
  assertLineBudget(leavePolicyTimeHelpers, 280, "leave/policy-time-helpers.ts");
  assertLineBudget(payslipReceiptRuntimeHelpers, 140, "payslip-receipts/runtime-copy-helpers.ts");
  assertLineBudget(withholdingRuntimeHelpers, 380, "withholding-receipt/copy-runtime.ts");
  assertLineBudget(contractsHttp, 220, "contracts/http.ts");

  assert.match(
    schedulingService,
    /from "@\/features\/scheduling\/incident-read-model-helpers"/
  );
  assert.match(leaveService, /from "@\/features\/leave\/policy-time-helpers"/);
  assert.match(contractsHttp, /koContractsErrorMessagePatterns/);

  assert.match(workItem, /WI-0466/i);
  assert.match(workItem, /core|line budget|guard|phase3|scheduling|leave|runtime/i);
  assert.match(roadmap, /WI-0466/i);
}

run()
  .then(() => {
    console.log("e2e-wi0466-core-line-budget-guard-phase3-scheduling-leave-runtime.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
