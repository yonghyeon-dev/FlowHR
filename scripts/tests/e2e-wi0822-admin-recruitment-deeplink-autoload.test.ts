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
  const workspace = readUtf8("src", "components", "recruitment", "AdminRecruitmentWorkspace.tsx");
  const helpers = readUtf8("src", "components", "recruitment", "employee-recruitment-helpers.ts");
  const workItem = readUtf8("work-items", "WI-0822-admin-recruitment-deeplink-autoload.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(workspace) <= 300,
    `AdminRecruitmentWorkspace.tsx must stay <= 300 lines (current: ${countLines(workspace)})`
  );

  assert.match(workspace, /import \{ useSearchParams \} from "next\/navigation"/);
  assert.match(workspace, /const searchParams = useSearchParams\(\);/);
  assert.match(
    workspace,
    /const \[referralFilter, setReferralFilter\] = useState<RecruitmentReferralStage \| "all">\(\s*normalizeRecruitmentReferralStageFilter\(searchParams\.get\("stage"\)\)\s*\)/
  );
  assert.match(
    workspace,
    /const \[referralRiskFilter, setReferralRiskFilter\] = useState<"all" \| "stalled_7d" \| "stalled_14d">\(\s*normalizeRecruitmentReferralRiskFilter\(searchParams\.get\("risk"\)\)\s*\)/
  );
  assert.match(
    workspace,
    /const \[referralSearchQuery, setReferralSearchQuery\] = useState\(parseRecruitmentSearchQuery\(searchParams\.get\("q"\)\)\)/
  );
  assert.match(workspace, /const \[autoLoadAttempted, setAutoLoadAttempted\] = useState\(false\);/);
  assert.match(workspace, /setAutoLoadAttempted\(true\);/);
  assert.match(workspace, /void loadWorkspace\(\);/);
  assert.match(workspace, /buildRecruitmentQuery\(\{ organizationId, sort: "stalled_priority" \}\)/);

  assert.match(helpers, /export function normalizeRecruitmentReferralStageFilter/);
  assert.match(helpers, /export function normalizeRecruitmentReferralRiskFilter/);
  assert.match(helpers, /export function parseRecruitmentSearchQuery/);

  assert.match(workItem, /WI-0822/i);
  assert.match(workItem, /deeplink|auto-load|recruitment/i);
  assert.match(roadmap, /WI-0822/i);
}

run()
  .then(() => {
    console.log("e2e-wi0822-admin-recruitment-deeplink-autoload.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
