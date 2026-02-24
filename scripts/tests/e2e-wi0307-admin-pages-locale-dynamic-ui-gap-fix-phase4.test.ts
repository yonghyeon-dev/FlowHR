import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminApprovalExecutionsPage = readUtf8("src", "app", "admin", "approval-executions", "page.tsx");
  const adminPeoplePage = readUtf8("src", "app", "admin", "people", "page.tsx");
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const workItem = readUtf8("work-items", "WI-0307-admin-pages-locale-dynamic-ui-gap-fix-phase4.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminApprovalExecutionsPage, /const \{ locale \} = useI18n\(\);/);
  assert.match(adminApprovalExecutionsPage, /\{isKoLocale \? "조직 ID" : "Organization ID"\}/);
  assert.match(adminApprovalExecutionsPage, /\{isKoLocale \? "에스컬레이션 채널" : "Escalation channel"\}/);
  assert.match(adminApprovalExecutionsPage, /\{isKoLocale \? "요청 시각" : "requestedAt"\}/);
  assert.match(adminApprovalExecutionsPage, /toDomainLabel\(execution\.domain\)/);
  assert.match(adminApprovalExecutionsPage, /toStateLabel\(execution\.state\)/);
  assert.doesNotMatch(adminApprovalExecutionsPage, /Execution Limit/);
  assert.doesNotMatch(adminApprovalExecutionsPage, /History Limit/);
  assert.doesNotMatch(adminApprovalExecutionsPage, /Escalation Channel/);

  assert.match(adminPeoplePage, /const \{ locale \} = useI18n\(\);/);
  assert.match(adminPeoplePage, /\{isKoLocale \? "조직 ID" : "Organization ID"\}/);
  assert.match(adminPeoplePage, /\{isKoLocale \? "부서 필터" : "Department filter"\}/);
  assert.match(adminPeoplePage, /\{isKoLocale \? "직급 필터" : "Position filter"\}/);
  assert.match(adminPeoplePage, /\{isKoLocale \? "필터 초기화" : "Reset filters"\}/);
  assert.match(adminPeoplePage, /aria-label=\{isKoLocale \? "이력 변경 요약" : "History change summary"\}/);
  assert.doesNotMatch(adminPeoplePage, /Department Filter/);
  assert.doesNotMatch(adminPeoplePage, /Position Filter/);
  assert.doesNotMatch(adminPeoplePage, /Updated Window/);
  assert.doesNotMatch(adminPeoplePage, /History Limit/);
  assert.doesNotMatch(adminPeoplePage, /Filter Reset/);
  assert.doesNotMatch(adminPeoplePage, /History Change Summary/);

  assert.match(employeePage, /feedback: feedbackCopy\.pendingRequestFilterApplied/);

  assert.match(workItem, /WI-0307/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0307/i);
}

run()
  .then(() => {
    console.log("e2e-wi0307-admin-pages-locale-dynamic-ui-gap-fix-phase4.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
