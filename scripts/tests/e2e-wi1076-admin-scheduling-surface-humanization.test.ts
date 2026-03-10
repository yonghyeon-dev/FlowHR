import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(
  path.join(process.cwd(), "src/components/admin-dashboard/AdminSchedulingPanel.tsx"),
  "utf8"
);

assert.match(
  source,
  /formatPublicEmployeeNumber\(schedule\.employeeId\)/,
  "admin scheduling panel should format employee identifiers through the public employee number helper"
);
assert.doesNotMatch(
  source,
  /<strong>\{schedule\.employeeId\}<\/strong>/,
  "admin scheduling panel should not print raw employee ids in the schedule list"
);
assert.doesNotMatch(
  source,
  /<time className="muted">\{schedule\.id\}<\/time>/,
  "admin scheduling panel should not expose raw schedule ids in the schedule list"
);

console.log("e2e-wi1076-admin-scheduling-surface-humanization.test passed");
