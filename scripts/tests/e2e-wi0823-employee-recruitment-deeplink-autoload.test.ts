import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const workspace = readUtf8("src", "components", "recruitment", "EmployeeRecruitmentWorkspace.tsx");
  const workItem = readUtf8("work-items", "WI-0823-employee-recruitment-deeplink-autoload.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(workspace) <= 300,
    `EmployeeRecruitmentWorkspace.tsx should stay <= 300 lines (current: ${countLines(workspace)})`
  );

  assert.match(workspace, /import \{ useSearchParams \} from "next\/navigation"/);
  assert.match(workspace, /const searchParams = useSearchParams\(\);/);
  assert.match(
    workspace,
    /const \[stageFilter, setStageFilter\] = useState<RecruitmentReferralStage \| "all">\(\s*normalizeRecruitmentReferralStageFilter\(searchParams\.get\("stage"\)\)\s*\)/
  );
  assert.match(
    workspace,
    /const \[riskFilter, setRiskFilter\] = useState<EmployeeReferralRiskFilter>\(\s*normalizeRecruitmentReferralRiskFilter\(searchParams\.get\("risk"\)\)\s*\)/
  );
  assert.match(workspace, /const \[openingFilter, setOpeningFilter\] = useState\(\(searchParams\.get\("opening"\) \?\? ""\)\.trim\(\) \|\| "all"\);/);
  assert.match(
    workspace,
    /const \[referralSearchQuery, setReferralSearchQuery\] = useState\(parseRecruitmentSearchQuery\(searchParams\.get\("q"\)\)\);/
  );
  assert.match(workspace, /const \[autoLoadAttempted, setAutoLoadAttempted\] = useState\(false\);/);
  assert.match(workspace, /setAutoLoadAttempted\(true\);/);
  assert.match(workspace, /void loadWorkspace\(\);/);
  assert.match(
    workspace,
    /const referralsQuery = buildRecruitmentQuery\(\{[\s\S]*sort: "stalled_priority"[\s\S]*\}\);/
  );

  assert.match(workItem, /WI-0823/i);
  assert.match(workItem, /deeplink|auto-load|employee|recruitment/i);
  assert.match(roadmap, /WI-0823/i);
}

run()
  .then(() => {
    console.log("e2e-wi0823-employee-recruitment-deeplink-autoload.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
