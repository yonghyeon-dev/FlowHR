import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(
  path.join(process.cwd(), "src/components/admin-attendance-live/AdminAttendanceLiveSections.tsx"),
  "utf8"
);

assert.match(
  source,
  /formatEmployeeDisplayName\(row\.employeeName, locale\)[\s\S]*formatPublicEmployeeNumber\(row\.employeeId\)/,
  "attendance live table should render employee name with public employee number"
);
assert.doesNotMatch(
  source,
  /row\.employeeName \?\? row\.employeeId/,
  "attendance live table should not fall back to raw employee ids in the employee column"
);

console.log("e2e-wi1078-admin-attendance-live-surface-humanization.test passed");
