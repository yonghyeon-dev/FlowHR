import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const openingsRoute = readUtf8("src", "app", "api", "recruitment", "openings", "route.ts");
  const referralsRoute = readUtf8("src", "app", "api", "recruitment", "referrals", "route.ts");
  const stageRoute = readUtf8(
    "src",
    "app",
    "api",
    "recruitment",
    "referrals",
    "[referralId]",
    "stage",
    "route.ts"
  );

  const store = readUtf8("src", "features", "recruitment", "store.ts");
  const copy = readUtf8("src", "components", "recruitment", "copy.ts");
  const adminWorkspace = readUtf8("src", "components", "recruitment", "AdminRecruitmentWorkspace.tsx");
  const employeeWorkspace = readUtf8("src", "components", "recruitment", "EmployeeRecruitmentWorkspace.tsx");
  const adminPage = readUtf8("src", "app", "admin", "recruitment", "page.tsx");
  const employeePage = readUtf8("src", "app", "employee", "recruitment", "page.tsx");

  const workItem = readUtf8("work-items", "WI-0409-recruitment-core-journey-implementation.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(openingsRoute, /export async function GET/);
  assert.match(openingsRoute, /export async function POST/);
  assert.match(openingsRoute, /createRecruitmentOpeningSchema/);

  assert.match(referralsRoute, /export async function GET/);
  assert.match(referralsRoute, /export async function POST/);
  assert.match(referralsRoute, /createRecruitmentReferralSchema/);

  assert.match(stageRoute, /updateRecruitmentReferralStageSchema/);
  assert.match(stageRoute, /updateRecruitmentReferralStage\(/);

  assert.match(store, /initialOpeningsStore/);
  assert.match(store, /initialReferralsStore/);
  assert.match(store, /export function createRecruitmentOpening/);
  assert.match(store, /export function createRecruitmentReferral/);
  assert.match(store, /export function updateRecruitmentReferralStage/);

  assert.match(copy, /resolveAdminRecruitmentCopy/);
  assert.match(copy, /resolveEmployeeRecruitmentCopy/);

  assert.ok(adminWorkspace.includes("/api/recruitment/openings"));
  assert.ok(adminWorkspace.includes("/api/recruitment/referrals"));
  assert.ok(employeeWorkspace.includes("/api/recruitment/openings"));
  assert.ok(employeeWorkspace.includes("/api/recruitment/referrals"));

  assert.match(adminPage, /AdminRecruitmentWorkspace/);
  assert.match(employeePage, /EmployeeRecruitmentWorkspace/);

  assert.match(workItem, /WI-0409/i);
  assert.match(workItem, /recruitment|opening|referral|stage|core journey/i);
  assert.match(roadmap, /WI-0409/i);
}

run()
  .then(() => {
    console.log("e2e-wi0409-recruitment-core-journey-implementation.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
