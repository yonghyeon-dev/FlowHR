import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const productionAuthSmokeTest = readUtf8("scripts", "tests", "production-auth-smoke.test.ts");
  const payrollPhase2HealthWorkflow = readUtf8(".github", "workflows", "payroll-phase2-health.yml");

  assert.match(
    productionAuthSmokeTest,
    /approvalExecutionActionLog\.deleteMany/,
    "production auth smoke teardown should delete approval execution action logs"
  );
  assert.match(
    productionAuthSmokeTest,
    /approvalExecution\.deleteMany/,
    "production auth smoke teardown should delete approval executions"
  );
  assert.match(
    productionAuthSmokeTest,
    /approvalStageHistory\.deleteMany/,
    "production auth smoke teardown should delete approval stage histories"
  );
  assert.match(
    productionAuthSmokeTest,
    /organization\.deleteMany/,
    "production auth smoke teardown should still delete smoke organization"
  );

  assert.match(
    payrollPhase2HealthWorkflow,
    /Close open phase2 incidents on success/,
    "payroll phase2 health workflow should auto-close incidents on success"
  );
  assert.match(
    payrollPhase2HealthWorkflow,
    /labels: \"incident,phase2,ops\"/,
    "phase2 health close step should filter phase2 incident labels"
  );
  assert.match(
    payrollPhase2HealthWorkflow,
    /startsWith\("\[phase2-health\]"\)/,
    "phase2 health close step should target phase2-health issue titles"
  );
  assert.match(
    payrollPhase2HealthWorkflow,
    /state: \"closed\"/,
    "phase2 health close step should close issue state"
  );
}

run();
console.log("e2e-wi0175-ops-cleanup-production-smoke-teardown-and-incident-auto-close.test passed");
