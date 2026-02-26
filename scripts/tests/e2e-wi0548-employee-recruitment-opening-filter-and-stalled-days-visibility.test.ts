import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const workspace = readUtf8("src", "components", "recruitment", "EmployeeRecruitmentWorkspace.tsx");
  const view = readUtf8("src", "components", "recruitment", "EmployeeRecruitmentWorkspaceView.tsx");
  const helpers = readUtf8("src", "components", "recruitment", "employee-recruitment-helpers.ts");
  const copy = readUtf8("src", "components", "recruitment", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0548-employee-recruitment-opening-filter-and-stalled-days-visibility.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(workspace, /const \[openingFilter, setOpeningFilter\] = useState\("all"\)/);
  assert.match(workspace, /openingFilter/);
  assert.match(workspace, /openingFilteredReferralCount/);

  assert.match(view, /copy\.openingFilterLabel/);
  assert.match(view, /copy\.openingFilterAllOption/);
  assert.match(view, /copy\.openingFilteredReferralSummaryLabel/);
  assert.match(view, /copy\.stalledDaysLabel/);

  assert.match(helpers, /export function resolveReferralStalledDays/);
  assert.match(helpers, /openingFilter !== "all" && referral\.openingId !== openingFilter/);
  assert.match(helpers, /export function filterEmployeeReferrals/);

  assert.match(copy, /openingFilterLabel: string;/);
  assert.match(copy, /openingFilterAllOption: string;/);
  assert.match(copy, /openingFilteredReferralSummaryLabel: string;/);
  assert.match(copy, /stalledDaysLabel: string;/);

  assert.match(workItem, /WI-0548/i);
  assert.match(workItem, /recruitment|opening|filter|stalled|days|visibility/i);
  assert.match(roadmap, /WI-0548/i);
}

run()
  .then(() => {
    console.log("e2e-wi0548-employee-recruitment-opening-filter-and-stalled-days-visibility.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
