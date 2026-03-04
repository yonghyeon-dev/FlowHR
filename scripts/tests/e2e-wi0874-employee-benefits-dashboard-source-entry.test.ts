import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const hubs = readUtf8("src", "components", "employee-dashboard", "workspace-hubs.ts");
  const workspace = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspace.tsx");
  const view = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspaceView.tsx");
  const sourceContext = readUtf8("src", "components", "benefits", "employee-source-context.ts");
  const workItem = readUtf8("work-items", "WI-0874-employee-benefits-dashboard-source-entry.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    hubs,
    /\/employee\/benefits\?status=SUBMITTED&risk=pending_3d&source=employee-dashboard/
  );
  assert.match(workspace, /isKoLocale=\{locale === "ko"\}/);

  assert.match(view, /useSearchParams/);
  assert.match(view, /resolveEmployeeBenefitsSourceEntry/);
  assert.match(view, /searchParams\.get\("source"\)/);
  assert.match(view, /sourceEntry \? <p className="small muted">\{sourceEntry\.hint\}<\/p> : null/);
  assert.match(view, /sourceEntry \? sourceEntry\.returnLabel : "\/employee"/);

  assert.match(sourceContext, /source !== "employee-dashboard"/);
  assert.match(sourceContext, /Opened from employee dashboard\./);
  assert.match(sourceContext, /Back to dashboard/);

  assert.match(workItem, /WI-0874/i);
  assert.match(workItem, /employee|benefits|dashboard|source|entry/i);
  assert.match(roadmap, /WI-0874/i);
}

run();
console.log("e2e-wi0874-employee-benefits-dashboard-source-entry.test passed");
