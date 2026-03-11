import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { employeeGuideCopyByLocale } from "@/components/employee-guide/copy";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8(
    "work-items",
    "WI-1161-employee-home-guide-route-first-tidy.md"
  );
  const progress = readUtf8("docs", "production-operating-progress.md");
  const guidePage = readUtf8("src", "app", "employee", "guide", "page.tsx");
  const dashboard = readUtf8(
    "src",
    "components",
    "employee-guide",
    "EmployeeGuideDashboard.tsx"
  );
  const sections = readUtf8(
    "src",
    "components",
    "employee-guide",
    "EmployeeGuideSections.tsx"
  );
  const copy = readUtf8("src", "components", "employee-guide", "copy.ts");

  assert.match(wi, /WI-1161/);
  assert.match(
    progress,
    /Closed `WI-1160` with merge `fa002e3ec84987801c5a194f54ea601304ad24fb`/
  );
  assert.match(progress, /Started `WI-1161`/);

  assert.match(guidePage, /EmployeeGuideDashboard/);

  assert.match(dashboard, /workspace-shell employee-workspace-shell/);
  assert.match(dashboard, /workspace-page-header employee-workspace-status-header/);
  assert.match(dashboard, /workspace-summary-strip employee-workspace-status-strip/);
  assert.match(dashboard, /requestsHubLabel/);

  assert.match(sections, /workspace-section-card workspace-toolbar-card/);
  assert.match(sections, /employee-guide-actions-card|workspace-section-card workspace-note-card/);

  assert.equal(employeeGuideCopyByLocale.ko.title, "직원 이용 가이드");
  assert.equal(
    employeeGuideCopyByLocale.ko.loadingLabel,
    "가이드 상태를 불러오는 중입니다..."
  );
  assert.doesNotMatch(copy, /吏곸썝|濡쒓렇|媛\?|몃맂/);
}

run();
console.log("e2e-wi1161-employee-home-guide-route-first-tidy.test passed");
