import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const deductionProfileHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-deduction-profile-helpers.ts"
  );
  const deductionPermissionSources = `${payrollService}\n${deductionProfileHelpers}`;
  const contextHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-context-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0325-payroll-service-context-helper-split-phase15.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payrollService, /from "@\/features\/payroll\/service-context-helpers"/);
  assert.match(payrollService, /\btype ServiceContext,/);
  assert.match(payrollService, /\bgetEventPublisher,/);
  assert.match(payrollService, /\brequirePayrollPermission\b/);
  assert.match(deductionPermissionSources, /\brequireDeductionProfilePermission\b/);

  assert.doesNotMatch(payrollService, /type ServiceContext = \{/);
  assert.doesNotMatch(payrollService, /function getEventPublisher\(/);
  assert.doesNotMatch(payrollService, /async function requirePayrollPermission\(/);
  assert.doesNotMatch(payrollService, /async function requireDeductionProfilePermission\(/);

  assert.match(contextHelpers, /export type ServiceContext = \{/);
  assert.match(contextHelpers, /export function getEventPublisher\(/);
  assert.match(contextHelpers, /export async function requirePayrollPermission\(/);
  assert.match(contextHelpers, /export async function requireDeductionProfilePermission\(/);
  assert.match(contextHelpers, /await requirePermission\(context, permission, `payroll \${action} requires \${permission}`\);/);

  const serviceLineCount = payrollService.split(/\r?\n/).length;
  assert.ok(
    serviceLineCount < 3490,
    `expected payroll service line count below 3490 after split, got ${serviceLineCount}`
  );

  assert.match(workItem, /WI-0325/i);
  assert.match(workItem, /helper split|decomposition|context/i);
  assert.match(roadmap, /WI-0325/i);
}

run()
  .then(() => {
    console.log("e2e-wi0325-payroll-service-context-helper-split-phase15.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
