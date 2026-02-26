import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeeWorkspace = readUtf8(
    "src",
    "components",
    "recruitment",
    "EmployeeRecruitmentWorkspace.tsx"
  );
  const employeeWorkspaceView = readUtf8(
    "src",
    "components",
    "recruitment",
    "EmployeeRecruitmentWorkspaceView.tsx"
  );
  const employeeWorkspaceHelpers = readUtf8(
    "src",
    "components",
    "recruitment",
    "employee-recruitment-helpers.ts"
  );
  const recruitmentCopy = readUtf8("src", "components", "recruitment", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0436-employee-recruitment-referral-search-filter.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeeWorkspace, /const \[referralSearchQuery, setReferralSearchQuery\] = useState\(""\);/);
  assert.match(employeeWorkspace, /const filteredReferrals = useMemo/);
  assert.match(employeeWorkspaceHelpers, /openingById\.get\(referral\.openingId\)\?\.title \?\? ""/);
  assert.match(employeeWorkspaceHelpers, /referral\.candidateName\.toLowerCase\(\)/);
  assert.match(employeeWorkspaceHelpers, /referral\.candidateEmail\.toLowerCase\(\)/);
  assert.match(employeeWorkspaceHelpers, /referral\.note\.toLowerCase\(\)/);
  assert.match(employeeWorkspaceView, /copy\.referralSearchLabel/);
  assert.match(employeeWorkspaceView, /copy\.referralSearchPlaceholder/);
  assert.match(employeeWorkspaceView, /copy\.clearSearchAction/);
  assert.match(employeeWorkspaceView, /copy\.filteredReferralSummaryLabel/);
  assert.match(employeeWorkspaceView, /copy\.filteredEmptyReferrals/);
  assert.match(employeeWorkspaceView, /filteredReferrals\.map\(\(referral\) => \{/);

  assert.match(recruitmentCopy, /referralSearchLabel: string;/);
  assert.match(recruitmentCopy, /referralSearchPlaceholder: string;/);
  assert.match(recruitmentCopy, /clearSearchAction: string;/);
  assert.match(recruitmentCopy, /filteredReferralSummaryLabel: string;/);
  assert.match(recruitmentCopy, /filteredEmptyReferrals: string;/);
  assert.match(recruitmentCopy, /referralSearchLabel: "異붿쿇 寃??/);
  assert.match(recruitmentCopy, /referralSearchLabel: "Referral search"/);

  assert.match(workItem, /WI-0436/i);
  assert.match(workItem, /recruitment|referral|search|filter|employee/i);
  assert.match(roadmap, /WI-0436/i);
}

run()
  .then(() => {
    console.log("e2e-wi0436-employee-recruitment-referral-search-filter.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
