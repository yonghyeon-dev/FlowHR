import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

const leaveAccrualSource = readUtf8(
  "src",
  "components",
  "leave-accrual",
  "LeaveAccrualAutoGrantConsole.tsx"
);
const workItem = readUtf8("work-items", "WI-1093-admin-leave-accrual-surface-follow-up.md");
const progress = readUtf8("docs", "production-operating-progress.md");
const gapInventory = readUtf8("docs", "production-gap-inventory.md");

assert.match(leaveAccrualSource, /formatEmployeeDisplayName\(/);
assert.match(leaveAccrualSource, /formatPublicEmployeeNumber\(/);
assert.match(leaveAccrualSource, /formatUserFacingErrorMessage\(/);
assert.match(leaveAccrualSource, /resultWorkspaceValue: "현재 작업 공간"/);
assert.match(leaveAccrualSource, /resultWorkspaceValue: "Current workspace"/);

assert.doesNotMatch(leaveAccrualSource, /Session organization|세션 조직/);
assert.doesNotMatch(leaveAccrualSource, /Session admin|세션 관리자/);
assert.doesNotMatch(
  leaveAccrualSource,
  /Missing session organization context; cannot run auto grant\.|세션 조직 정보가 없어 자동 부여를 실행할 수 없습니다\./
);
assert.doesNotMatch(leaveAccrualSource, /<strong>\{result\.organizationId\}<\/strong>/);
assert.doesNotMatch(leaveAccrualSource, /<strong>\{row\.employeeId\}<\/strong>/);
assert.doesNotMatch(leaveAccrualSource, /resultOrganizationLabel:\s*"organizationId"/);

assert.match(workItem, /WI-1093/i);
assert.match(progress, /WI-1093/i);
assert.match(gapInventory, /WI-1093/i);

console.log("e2e-wi1093-admin-leave-accrual-surface-follow-up.test passed");
