import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { employeeGuideCopyByLocale } from "@/components/employee-guide/copy";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const dashboard = readUtf8("src", "components", "employee-guide", "EmployeeGuideDashboard.tsx");
  const sections = readUtf8("src", "components", "employee-guide", "EmployeeGuideSections.tsx");
  const dataHook = readUtf8("src", "components", "employee-guide", "useEmployeeGuideData.ts");
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8(
    "work-items",
    "WI-1164-employee-guide-hero-action-hierarchy.md"
  );

  assert.equal(employeeGuideCopyByLocale.ko.heroMetaLabel, "route-first 안내");
  assert.equal(employeeGuideCopyByLocale.ko.nextActionTitle, "다음 추천 작업");
  assert.equal(
    employeeGuideCopyByLocale.ko.quickActions[0].ctaLabel,
    "프로필 열기"
  );

  assert.match(dashboard, /EmployeeWorkspaceHero/);
  assert.match(dashboard, /metaLabel=\{copy\.heroMetaLabel\}/);
  assert.match(dashboard, /data\.nextActionKey/);

  assert.match(sections, /employee-guide-status-panel/);
  assert.match(sections, /employee-guide-progress-track/);
  assert.match(sections, /copy\.nextActionTitle/);
  assert.match(sections, /action\.ctaLabel/);
  assert.match(sections, /action\.supportLabel/);

  assert.match(dataHook, /const nextActionKey = useMemo/);

  assert.match(globalsCss, /\.employee-guide-status-panel \{/);
  assert.match(globalsCss, /\.employee-guide-progress-track \{/);
  assert.match(globalsCss, /\.employee-guide-next-action-card \{/);

  assert.match(workItem, /WI-1164/);
  assert.match(workItem, /hero action hierarchy/i);
}

run()
  .then(() => {
    console.log("e2e-wi1164-employee-guide-hero-action-hierarchy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
