import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-0974-admin-subpages-session-guard.md");

  assert.match(wi, /WI-0974/);
  assert.match(wi, /useSupabaseSession/);
  assert.match(wi, /if \(loading\) return null;/);

  const targets = [
    ["src", "app", "admin", "attendance-live", "page.tsx"],
    ["src", "app", "admin", "benefits", "page.tsx"],
    ["src", "app", "admin", "departments", "page.tsx"],
    ["src", "app", "admin", "kpi", "page.tsx"],
    ["src", "app", "admin", "leave-accrual", "page.tsx"],
    ["src", "app", "admin", "leave-calendar", "page.tsx"],
    ["src", "app", "admin", "leave-promotion", "page.tsx"],
    ["src", "app", "admin", "notices", "page.tsx"],
    ["src", "app", "admin", "onboarding", "page.tsx"],
    ["src", "app", "admin", "payroll-close", "page.tsx"],
    ["src", "app", "admin", "payroll-insurance", "page.tsx"],
    ["src", "app", "admin", "payroll-payslip-delivery", "page.tsx"],
    ["src", "app", "admin", "payroll-year-end-filing", "page.tsx"],
    ["src", "app", "admin", "payroll-year-end", "page.tsx"],
    ["src", "app", "admin", "positions", "page.tsx"],
    ["src", "app", "admin", "recruitment", "page.tsx"],
    ["src", "app", "admin", "scheduling", "page.tsx"],
    ["src", "app", "admin", "analytics", "page.tsx"],
    ["src", "app", "admin", "contracts", "page.tsx"],
    ["src", "app", "employee", "benefits", "page.tsx"],
    ["src", "app", "employee", "contracts", "page.tsx"]
  ] as const;

  for (const fileParts of targets) {
    const source = readUtf8(...fileParts);
    assert.match(source, /^"use client";/);
    assert.match(source, /useSupabaseSession/);
    assert.match(source, /const \{ loading \} = useSupabaseSession\(\);/);
    assert.match(source, /if \(loading\) return null;/);
  }

  const leavePromotionSource = readUtf8("src", "app", "admin", "leave-promotion", "page.tsx");
  assert.match(leavePromotionSource, /router\.replace\("\/ops\/leave-promotion"\);/);
}

run();
console.log("e2e-wi0974-admin-subpages-session-guard.test passed");
