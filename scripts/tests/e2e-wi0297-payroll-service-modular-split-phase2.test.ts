import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const payrollAdapterHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-year-end-adapter-helpers.ts"
  );
  const auditHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "year-end-audit-payload-helpers.ts"
  );
  const filingLifecycleHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "year-end-filing-lifecycle-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0297-payroll-service-modular-split-phase2.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payrollService, /from \"@\/features\/payroll\/service-year-end-adapter-helpers\"/);
  assert.match(payrollAdapterHelpers, /from \"@\/features\/payroll\/year-end-audit-payload-helpers\"/);
  assert.match(payrollAdapterHelpers, /return buildYearEndSettlementHashCore\(payload\);/);
  assert.match(payrollAdapterHelpers, /return normalizeYearEndSettlementHashCore\(value\);/);
  assert.match(
    payrollAdapterHelpers,
    /return resolveYearEndSettlementHashFromFinalizationPayloadCore\(payload\);/
  );

  assert.match(auditHelpers, /export function buildYearEndSettlementHash/);
  assert.match(auditHelpers, /export function normalizeYearEndSettlementHash/);
  assert.match(auditHelpers, /export function asYearEndFinalizationAuditPayload/);
  assert.match(
    auditHelpers,
    /export function asYearEndFilingEvidenceNoteAddedAuditPayload/
  );
  assert.match(
    filingLifecycleHelpers,
    /asYearEndFilingPackageSubmittedAuditPayload\(log\.payload\)/
  );
  assert.match(
    filingLifecycleHelpers,
    /asYearEndFilingPackageAcknowledgedAuditPayload\(log\.payload\)/
  );

  assert.match(workItem, /WI-0297/i);
  assert.match(workItem, /modular split/i);
  assert.match(roadmap, /WI-0297/i);
}

run()
  .then(() => {
    console.log("e2e-wi0297-payroll-service-modular-split-phase2.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
