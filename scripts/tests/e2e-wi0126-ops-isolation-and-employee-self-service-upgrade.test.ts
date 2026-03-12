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
  assert.doesNotMatch(
    adminLayoutSource,
    /href="\/ops\/leave-promotion"/,
    "admin layout should not expose leave-promotion directly inside the current shell"
  );
  assert.match(
    adminLayoutSource,
    /href="\/ops\/mvp-console"/,
    "admin layout should keep dev-only ops entry points behind the dev tools footer"
  );

  const adminLeavePromotionSource = readUtf8("src", "app", "admin", "leave-promotion", "page.tsx");
  assert.match(
    adminLeavePromotionSource,
    /notFound\(\)/,
    "admin leave-promotion page should return notFound when dev tools are disabled"
  );
  assert.match(
    adminLeavePromotionSource,
    /redirect\("\/ops\/leave-promotion"\)/,
    "admin leave-promotion page should still redirect to ops route when dev tools are enabled"
  );

  const opsLeavePromotionSource = readUtf8("src", "app", "ops", "leave-promotion", "page.tsx");
  assert.match(
    opsLeavePromotionSource,
    /notFound\(\)/,
    "ops leave-promotion page should be dev-tools gated"
  );

  const employeePageSource = readUtf8("src", "app", "employee", "page.tsx");
  const employeeLocaleHelperSource = readUtf8("src", "app", "employee", "page-locale-helpers.ts");
  assert.ok(
    /sectionTitles\.leaveCalendar/.test(employeePageSource) ||
      /leaveCalendar:\s*"휴가 캘린더"/.test(employeeLocaleHelperSource),
    "employee portal should include leave calendar panel"
  );
  assert.ok(
    /연차 사용률/.test(employeePageSource) || /usageRateLabel:\s*"연차 사용률"/.test(employeeLocaleHelperSource),
    "employee portal should include leave balance visualization"
  );

  const employeeLayoutSource = readUtf8("src", "app", "employee", "layout.tsx");
  assert.doesNotMatch(
    employeeLayoutSource,
    /\/employee\?focus=leave-calendar/,
    "employee shell should not expose leave calendar as a hidden-subpage focus link"
  );
  assert.ok(
    /title: isKoLocale \? "Today" : "Today"/.test(employeeLayoutSource) &&
      /title: isKoLocale \? "Requests" : "Requests"/.test(employeeLayoutSource) &&
      /title: isKoLocale \? "Documents" : "Documents"/.test(employeeLayoutSource) &&
      /title: isKoLocale \? "Account" : "Account"/.test(employeeLayoutSource),
    "employee shell should regroup self-service navigation into stable product areas"
  );
}

run();
console.log("e2e-wi0126-ops-isolation-and-employee-self-service-upgrade.test passed");
