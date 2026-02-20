import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  assert.doesNotMatch(
    adminLayoutSource,
    /href="\/admin\/leave-promotion"/,
    "admin navigation should not expose /admin/leave-promotion in default journey"
  );
  assert.match(
    adminLayoutSource,
    /href="\/ops\/leave-promotion"/,
    "admin layout should expose leave-promotion only in dev ops links"
  );

  const adminLeavePromotionSource = readUtf8("src", "app", "admin", "leave-promotion", "page.tsx");
  assert.match(
    adminLeavePromotionSource,
    /redirect\("\/ops\/leave-promotion"\)/,
    "admin leave-promotion page should redirect to ops route"
  );

  const opsLeavePromotionSource = readUtf8("src", "app", "ops", "leave-promotion", "page.tsx");
  assert.match(
    opsLeavePromotionSource,
    /notFound\(\)/,
    "ops leave-promotion page should be dev-tools gated"
  );

  const employeePageSource = readUtf8("src", "app", "employee", "page.tsx");
  assert.match(employeePageSource, /휴가 캘린더/, "employee portal should include leave calendar panel");
  assert.match(employeePageSource, /연차 사용률/, "employee portal should include leave balance visualization");

  const employeeLayoutSource = readUtf8("src", "app", "employee", "layout.tsx");
  assert.match(
    employeeLayoutSource,
    /href="\/employee#leave-calendar"/,
    "employee navigation should include leave calendar anchor"
  );
}

run();
console.log("e2e-wi0126-ops-isolation-and-employee-self-service-upgrade.test passed");
