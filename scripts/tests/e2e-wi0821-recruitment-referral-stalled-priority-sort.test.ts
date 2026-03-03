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
  const schema = readUtf8("src", "features", "recruitment", "schemas.ts");
  const store = readUtf8("src", "features", "recruitment", "store.ts");
  const referralsRoute = readUtf8("src", "app", "api", "recruitment", "referrals", "route.ts");
  const adminWorkspace = readUtf8("src", "components", "recruitment", "AdminRecruitmentWorkspace.tsx");
  const contract = readUtf8("specs", "people", "contract.yaml");
  const api = readUtf8("specs", "people", "api.yaml");
  const testCases = readUtf8("specs", "people", "test-cases.md");
  const workItem = readUtf8("work-items", "WI-0821-recruitment-referral-stalled-priority-sort.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(schema, /referralSortSchema = z\.enum\(\["updated_desc", "stalled_priority"\]\)/);
  assert.match(schema, /listRecruitmentReferralsQuerySchema[\s\S]*sort: referralSortSchema\.optional\(\)/);

  assert.match(store, /const DEFAULT_REFERRAL_SORT: RecruitmentReferralSort = "updated_desc"/);
  assert.match(store, /const STALLED_THRESHOLD_7D_MS = 7 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(store, /const STALLED_THRESHOLD_14D_MS = 14 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(store, /if \(sort !== "stalled_priority"\)/);
  assert.match(store, /isRecruitmentReferralTerminalStage\(left\.stage\)/);
  assert.match(store, /const leftRiskBand = leftAgeMs >= STALLED_THRESHOLD_14D_MS \? 0 :/);
  assert.match(store, /const sort = normalizeReferralSort\(input\.sort\)/);
  assert.match(store, /sortRecruitmentReferralItems\(rows\.map\(toReferralItem\), sort\)/);

  assert.match(referralsRoute, /sort: url\.searchParams\.get\("sort"\) \?\? undefined/);
  assert.match(referralsRoute, /sort: parsed\.data\.sort/);

  assert.ok(
    countLines(adminWorkspace) <= 300,
    `AdminRecruitmentWorkspace.tsx should stay under 300 lines (current: ${countLines(adminWorkspace)})`
  );
  assert.match(adminWorkspace, /buildQuery\(\{ organizationId, sort: "stalled_priority" \}\)/);

  assert.match(contract, /^version:\s*0\.3\.7/m);
  assert.match(contract, /recruitment referral queue priority sorting \(`sort=stalled_priority`\)/);
  assert.match(api, /version:\s*0\.3\.7/);
  assert.match(api, /\/recruitment\/referrals:/);
  assert.match(api, /name:\s*sort/);
  assert.match(api, /stalled_priority/);
  assert.match(testCases, /Contract v0\.3\.7/);
  assert.match(testCases, /sort=stalled_priority/);

  assert.match(workItem, /WI-0821/i);
  assert.match(workItem, /stalled|priority|recruitment|referral/i);
  assert.match(roadmap, /WI-0821/i);
}

run()
  .then(() => {
    console.log("e2e-wi0821-recruitment-referral-stalled-priority-sort.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
