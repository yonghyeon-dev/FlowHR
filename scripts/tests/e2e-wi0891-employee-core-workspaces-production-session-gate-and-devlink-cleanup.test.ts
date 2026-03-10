import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeeNoticeBoard = readUtf8(
    "src",
    "components",
    "notices",
    "EmployeeNoticeBoard.tsx"
  );
  const employeeBenefitsWorkspace = readUtf8(
    "src",
    "components",
    "benefits",
    "EmployeeBenefitsWorkspace.tsx"
  );
  const employeeBenefitsView = readUtf8(
    "src",
    "components",
    "benefits",
    "EmployeeBenefitsWorkspaceView.tsx"
  );
  const employeeRecruitmentWorkspace = readUtf8(
    "src",
    "components",
    "recruitment",
    "EmployeeRecruitmentWorkspace.tsx"
  );
  const employeeRecruitmentView = readUtf8(
    "src",
    "components",
    "recruitment",
    "EmployeeRecruitmentWorkspaceView.tsx"
  );
  const employeeScheduleBoard = readUtf8(
    "src",
    "components",
    "scheduling",
    "EmployeeScheduleBoard.tsx"
  );
  const employeeScheduleView = readUtf8(
    "src",
    "components",
    "scheduling",
    "EmployeeScheduleBoardView.tsx"
  );
  const employeeGuideData = readUtf8(
    "src",
    "components",
    "employee-guide",
    "useEmployeeGuideData.ts"
  );
  const employeeGuideDashboard = readUtf8(
    "src",
    "components",
    "employee-guide",
    "EmployeeGuideDashboard.tsx"
  );
  const employeeGuideSections = readUtf8(
    "src",
    "components",
    "employee-guide",
    "EmployeeGuideSections.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0891-employee-core-workspaces-production-session-gate-and-devlink-cleanup.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const requiresGatePattern =
    /const requiresLoginSession = isProductionRuntime && !usesBearerToken && !showDevTools;/;
  const allowHeaderFallbackPattern =
    /const allowHeaderActorFallback = showDevTools \|\| !isProductionRuntime;/;
  const fallbackHeaderUsagePattern = /\} else if \(allowHeaderActorFallback\) \{/;
  const noticeFallbackHeaderUsagePattern = /if \(!allowHeaderActorFallback\) \{\s*return headers;\s*\}/;

  assert.match(employeeNoticeBoard, requiresGatePattern);
  assert.match(employeeNoticeBoard, allowHeaderFallbackPattern);
  assert.match(employeeNoticeBoard, noticeFallbackHeaderUsagePattern);
  assert.match(employeeNoticeBoard, /productionSessionRequiredNotice\} <Link href="\/login">\/login<\/Link>/);

  assert.match(employeeBenefitsWorkspace, requiresGatePattern);
  assert.match(employeeBenefitsWorkspace, allowHeaderFallbackPattern);
  assert.match(employeeBenefitsWorkspace, fallbackHeaderUsagePattern);
  assert.match(employeeBenefitsView, /requiresLoginSession: boolean;/);
  assert.match(employeeBenefitsView, /productionSessionRequiredNotice\} <Link href="\/login">\/login<\/Link>/);
  assert.match(employeeBenefitsView, /showDevTools \? \(\s*<Link className="btn btn-secondary" href="\/admin\/benefits">/);

  assert.match(employeeRecruitmentWorkspace, requiresGatePattern);
  assert.match(employeeRecruitmentWorkspace, allowHeaderFallbackPattern);
  assert.match(employeeRecruitmentWorkspace, fallbackHeaderUsagePattern);
  assert.match(employeeRecruitmentView, /requiresLoginSession: boolean;/);
  assert.match(employeeRecruitmentView, /productionSessionRequiredNotice\} <Link href="\/login">\/login<\/Link>/);
  assert.match(employeeRecruitmentView, /showDevTools \? \(\s*<Link className="btn btn-secondary" href="\/admin\/recruitment">/);

  assert.match(employeeScheduleBoard, requiresGatePattern);
  assert.match(employeeScheduleBoard, allowHeaderFallbackPattern);
  assert.match(employeeScheduleBoard, fallbackHeaderUsagePattern);
  assert.match(employeeScheduleView, /requiresLoginSession: boolean;/);
  assert.match(employeeScheduleView, /productionSessionRequiredNotice\} <Link href="\/login">\/login<\/Link>/);

  assert.match(employeeGuideData, allowHeaderFallbackPattern);
  assert.match(employeeGuideData, requiresGatePattern);
  assert.match(employeeGuideData, /if \(requiresLoginSession\) \{\s*return;\s*\}/);
  assert.match(employeeGuideData, /Boolean\(pendingLabel\) \|\| requiresLoginSession/);
  assert.match(employeeGuideDashboard, /data\.requiresLoginSession \? \(/);
  assert.match(employeeGuideDashboard, /data\.productionSessionRequiredNotice\} <Link href="\/login">\/login<\/Link>/);
  assert.match(employeeGuideSections, /로그인 직원 번호/);
  assert.doesNotMatch(employeeGuideSections, /세션 직원/);

  assert.match(workItem, /WI-0891/i);
  assert.match(
    workItem,
    /employee|notice|benefits|recruitment|schedule|guide|product mode|login|devtools/i
  );
  assert.match(roadmap, /WI-0891/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0891-employee-core-workspaces-production-session-gate-and-devlink-cleanup.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
