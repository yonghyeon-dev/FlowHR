import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(
  path.join(process.cwd(), "src/components/admin-dashboard/AdminAggregateLeavePanels.tsx"),
  "utf8"
);

assert.match(
  source,
  /ADMIN_AGGREGATE_LEAVE_PANELS_RETIRED_WI_1137/,
  "admin aggregate leave fragment should be retired after the route-first hub cleanup"
);

console.log("e2e-wi1077-admin-aggregate-leave-surface-humanization.test passed");
