import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const snapshotHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-year-end-run-snapshot-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0323-payroll-service-year-end-run-snapshot-helper-split-phase14.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    payrollService,
    /from "@\/features\/payroll\/service-year-end-run-snapshot-helpers"/
  );
  assert.match(payrollService, /\baggregatePayrollTotalsKrw,/);
  assert.match(payrollService, /\bloadYearEndRunSnapshot,/);
  assert.match(payrollService, /type YearEndRunSnapshot/);

  assert.doesNotMatch(payrollService, /function aggregatePayrollTotalsKrw\(/);
  assert.doesNotMatch(payrollService, /async function loadYearEndRunSnapshot\(/);

  assert.match(snapshotHelpers, /export type YearEndRunSnapshotContext = {/);
  assert.match(snapshotHelpers, /export type YearEndRunSnapshot = {/);
  assert.match(snapshotHelpers, /export function aggregatePayrollTotalsKrw\(/);
  assert.match(snapshotHelpers, /export async function loadYearEndRunSnapshot\(/);
  assert.match(snapshotHelpers, /totalsKrw: aggregatePayrollTotalsKrw\(confirmedRuns\)/);

  const serviceLineCount = payrollService.split(/\r?\n/).length;
  assert.ok(
    serviceLineCount < 3550,
    `expected payroll service line count below 3550 after split, got ${serviceLineCount}`
  );

  assert.match(workItem, /WI-0323/i);
  assert.match(workItem, /split|decomposition|helper/i);
  assert.match(roadmap, /WI-0323/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0323-payroll-service-year-end-run-snapshot-helper-split-phase14.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
