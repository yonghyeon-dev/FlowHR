import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

const source = readUtf8("src", "components", "leave-calendar", "LeaveCalendarConsole.tsx");
const workItem = readUtf8("work-items", "WI-1094-admin-leave-calendar-surface-follow-up.md");
const progress = readUtf8("docs", "production-operating-progress.md");
const gapInventory = readUtf8("docs", "production-gap-inventory.md");

assert.match(source, /formatEmployeeDisplayName\(/);
assert.match(source, /formatPublicEmployeeNumber\(/);
assert.match(source, /formatUserFacingErrorMessage\(/);
assert.match(source, /currentWorkspaceLabel = locale === "ko" \? "현재 작업 공간" : "Current workspace"/);
assert.match(source, /employeeNumberLabel = locale === "ko" \? "직원 번호" : "Employee number"/);

assert.doesNotMatch(source, /<strong>\{result\.organizationId\}<\/strong>/);
assert.doesNotMatch(source, /<strong>\{entry\.employeeId\}<\/strong>/);
assert.doesNotMatch(source, /Missing session organization context; cannot query\./);
assert.doesNotMatch(source, /세션 조직 정보가 없어 조회할 수 없습니다\./);

assert.match(workItem, /WI-1094/i);
assert.match(progress, /WI-1094/i);
assert.match(gapInventory, /WI-1094/i);

console.log("e2e-wi1094-admin-leave-calendar-surface-follow-up.test passed");
