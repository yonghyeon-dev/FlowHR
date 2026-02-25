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
  const recruitmentCopy = readUtf8("src", "components", "recruitment", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0436-employee-recruitment-referral-search-filter.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeeWorkspace, /const \[referralSearchQuery, setReferralSearchQuery\] = useState\(""\);/);
  assert.match(employeeWorkspace, /const filteredReferrals = useMemo\(\(\) => \{/);
  assert.match(employeeWorkspace, /openingById\.get\(referral\.openingId\)\?\.title \?\? ""/);
  assert.match(employeeWorkspace, /referral\.candidateName\.toLowerCase\(\)/);
  assert.match(employeeWorkspace, /referral\.candidateEmail\.toLowerCase\(\)/);
  assert.match(employeeWorkspace, /referral\.note\.toLowerCase\(\)/);
  assert.match(employeeWorkspace, /copy\.referralSearchLabel/);
  assert.match(employeeWorkspace, /copy\.referralSearchPlaceholder/);
  assert.match(employeeWorkspace, /copy\.clearSearchAction/);
  assert.match(employeeWorkspace, /copy\.filteredReferralSummaryLabel/);
  assert.match(employeeWorkspace, /copy\.filteredEmptyReferrals/);
  assert.match(employeeWorkspace, /filteredReferrals\.map\(\(referral\) => \{/);

  assert.match(recruitmentCopy, /referralSearchLabel: string;/);
  assert.match(recruitmentCopy, /referralSearchPlaceholder: string;/);
  assert.match(recruitmentCopy, /clearSearchAction: string;/);
  assert.match(recruitmentCopy, /filteredReferralSummaryLabel: string;/);
  assert.match(recruitmentCopy, /filteredEmptyReferrals: string;/);
  assert.match(recruitmentCopy, /referralSearchLabel: "추천 검색"/);
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
