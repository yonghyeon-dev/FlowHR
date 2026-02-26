import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const benefitsTypes = readUtf8("src", "features", "benefits", "types.ts");
  const benefitsSchemas = readUtf8("src", "features", "benefits", "schemas.ts");
  const benefitsStore = readUtf8("src", "features", "benefits", "store.ts");
  const cancelRoute = readUtf8(
    "src",
    "app",
    "api",
    "benefits",
    "requests",
    "[requestId]",
    "cancel",
    "route.ts"
  );
  const employeeWorkspace = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspace.tsx");
  const employeeWorkspaceView = readUtf8(
    "src",
    "components",
    "benefits",
    "EmployeeBenefitsWorkspaceView.tsx"
  );
  const benefitsCopy = readUtf8("src", "components", "benefits", "copy.ts");

  const workItem = readUtf8("work-items", "WI-0424-benefits-request-cancel-self-service.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(benefitsTypes, /BenefitRequestStatus = "SUBMITTED" \| "APPROVED" \| "REJECTED" \| "CANCELED"/);
  assert.match(benefitsSchemas, /export const cancelBenefitRequestSchema = z\.object\(/);
  assert.match(benefitsStore, /export function cancelBenefitRequest\(/);
  assert.match(benefitsStore, /target\.status = "CANCELED"/);
  assert.match(benefitsStore, /const canceled = items\.filter\(\(item\) => item\.status === "CANCELED"\)\.length;/);

  assert.match(cancelRoute, /benefits\.request\.cancel\.unauthorized/);
  assert.match(cancelRoute, /benefits\.request\.cancel\.forbidden/);
  assert.match(cancelRoute, /benefits\.request\.cancel\.invalid_state/);
  assert.match(cancelRoute, /cancelBenefitRequest\(/);

  assert.match(employeeWorkspace, /async function cancelRequest\(requestId: string\)/);
  assert.match(employeeWorkspace, /\/api\/benefits\/requests\/\$\{encodeURIComponent\(requestId\)\}\/cancel/);
  assert.match(employeeWorkspaceView, /copy\.requestFilter\.CANCELED/);
  assert.match(employeeWorkspaceView, /copy\.cancelAction/);

  assert.match(benefitsCopy, /cancelAction/);
  assert.match(benefitsCopy, /CANCELED: "痍⑥냼"/);
  assert.match(benefitsCopy, /CANCELED: "Canceled"/);
  assert.match(benefitsCopy, /cancelFailed/);

  assert.match(workItem, /WI-0424/i);
  assert.match(workItem, /benefit|request|cancel|employee|self-service/i);
  assert.match(roadmap, /WI-0424/i);
}

run()
  .then(() => {
    console.log("e2e-wi0424-benefits-request-cancel-self-service.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
