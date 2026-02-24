import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const deductionHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-deduction-profile-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0358-payroll-service-modular-split-phase20-deduction-profile-helpers.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(deductionHelpers, /readDeductionProfileFromHelper/);
  assert.match(deductionHelpers, /upsertDeductionProfileFromHelper/);
  assert.match(deductionHelpers, /listDeductionProfilesFromHelper/);

  assert.match(payrollService, /return await readDeductionProfileFromHelper\(context, profileId\);/);
  assert.match(payrollService, /return await upsertDeductionProfileFromHelper\(context, input\);/);
  assert.match(payrollService, /return await listDeductionProfilesFromHelper\(context, input\);/);

  assert.match(workItem, /WI-0358/i);
  assert.match(workItem, /deduction profile/i);
  assert.match(roadmap, /WI-0358/i);
}

run()
  .then(() => {
    console.log("e2e-wi0358-payroll-service-modular-split-phase20-deduction-profile-helpers.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
