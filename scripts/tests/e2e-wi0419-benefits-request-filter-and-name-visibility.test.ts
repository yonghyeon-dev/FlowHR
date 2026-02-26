import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeeWorkspace = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspace.tsx");
  const employeeWorkspaceView = readUtf8(
    "src",
    "components",
    "benefits",
    "EmployeeBenefitsWorkspaceView.tsx"
  );
  const benefitsRequestsRoute = readUtf8("src", "app", "api", "benefits", "requests", "route.ts");
  const benefitsCopy = readUtf8("src", "components", "benefits", "copy.ts");

  const workItem = readUtf8("work-items", "WI-0419-benefits-request-filter-and-name-visibility.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(benefitsRequestsRoute, /listBenefitRequestsQuerySchema/);
  assert.match(benefitsRequestsRoute, /status: parsed\.data\.status/);

  assert.match(employeeWorkspace, /requestStatusFilter/);
  assert.match(employeeWorkspace, /status: requestStatusFilter/);
  assert.match(employeeWorkspace, /setRequestSummary\(parseBenefitRequestSummary\(requestsRes\.parsed\)\)/);
  assert.match(employeeWorkspaceView, /copy\.requestFilterLabel/);
  assert.match(employeeWorkspaceView, /copy\.requestSummaryLabel/);
  assert.match(
    employeeWorkspace,
    /resolveBenefitName=\{\(benefitId\) => catalogById\.get\(benefitId\)\?\.name \?\? copy\.unknownBenefitLabel\}/
  );

  assert.match(benefitsCopy, /requestFilterLabel/);
  assert.match(benefitsCopy, /requestSummaryLabel/);
  assert.match(benefitsCopy, /unknownBenefitLabel/);
  assert.match(benefitsCopy, /requestFilter: \{/);

  assert.match(workItem, /WI-0419/i);
  assert.match(workItem, /benefit|request|filter|status|name/i);
  assert.match(roadmap, /WI-0419/i);
}

run()
  .then(() => {
    console.log("e2e-wi0419-benefits-request-filter-and-name-visibility.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

