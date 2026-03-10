import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(
  path.join(process.cwd(), "src/components/admin-dashboard/AdminAggregateLeavePanels.tsx"),
  "utf8"
);

assert.match(
  source,
  /formatPublicEmployeeNumber\(aggregate\.employeeId\)/,
  "admin aggregate leave panel should format employee identifiers through the public employee number helper"
);
assert.doesNotMatch(
  source,
  /<strong>\{aggregate\.employeeId\}<\/strong>/,
  "admin aggregate leave panel should not print raw employee ids in aggregate rows"
);

console.log("e2e-wi1077-admin-aggregate-leave-surface-humanization.test passed");
