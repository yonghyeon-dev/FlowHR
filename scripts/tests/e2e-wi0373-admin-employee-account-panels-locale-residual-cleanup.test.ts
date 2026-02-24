import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPanels = readUtf8(
    "src",
    "components",
    "admin-dashboard",
    "AdminOnboardingAccountPanels.tsx"
  );
  const employeePanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0373-admin-employee-account-panels-locale-residual-cleanup.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPanels, /\{isKoLocale \? "세션 오류" : "Session error"\}/);
  assert.match(employeePanels, /\{isKoLocale \? "세션 오류" : "Session error"\}/);
  assert.match(adminPanels, /placeholder=\{isKoLocale \? "예: ORG-00001" : "e\.g\. ORG-00001"\}/);
  assert.match(employeePanels, /placeholder=\{isKoLocale \? "예: ORG-00001" : "e\.g\. ORG-00001"\}/);
  assert.match(adminPanels, /aria-label=\{isKoLocale \? "조직 목록" : "Organization list"\}/);

  assert.doesNotMatch(adminPanels, /세션 오류: \{supabaseSessionError\}/);
  assert.doesNotMatch(employeePanels, /세션 오류: \{supabaseSessionError\}/);
  assert.doesNotMatch(adminPanels, /aria-label="조직 목록"/);

  assert.match(workItem, /WI-0373/i);
  assert.match(workItem, /locale residual cleanup/i);
  assert.match(roadmap, /WI-0373/i);
}

run()
  .then(() => {
    console.log("e2e-wi0373-admin-employee-account-panels-locale-residual-cleanup.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
