import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminSchedulingPanel = readUtf8("src", "components", "admin-dashboard", "AdminSchedulingPanel.tsx");
  const adminDebugLogsPanel = readUtf8("src", "components", "admin-dashboard", "AdminDebugLogsPanel.tsx");
  const queueHelpers = readUtf8("src", "app", "admin", "page-queue-helpers.ts");
  const workItem = readUtf8("work-items", "WI-0299-admin-locale-dynamic-ui-gap-fix-baseline.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPage, /const \{ locale \} = useI18n\(\);/);
  assert.match(adminPage, /from "@\/app\/admin\/page-locale-helpers"/);
  assert.match(
    adminPage,
    /const localeLabelBundle = useMemo\(\(\) => resolveAdminLocaleLabelBundle\(isKoLocale\), \[isKoLocale\]\);/
  );
  assert.match(adminPage, /const \{\s*queueLabels,\s*workTypeLabels,\s*logStatusLabels,/);

  assert.match(adminSchedulingPanel, /\{schedule\.isHoliday \? workTypeLabels\.holiday : workTypeLabels\.work\}/);
  assert.match(adminDebugLogsPanel, /\{log\.ok \? logStatusLabels\.success : logStatusLabels\.fail\}/);
  assert.match(
    adminPage,
    /const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL \?\? localeLabelBundle\.notConfiguredLabel;/
  );

  assert.doesNotMatch(adminSchedulingPanel, /schedule\.isHoliday \? "HOLIDAY" : "WORK"/);
  assert.doesNotMatch(adminDebugLogsPanel, /log\.ok \? "OK" : "FAIL"/);

  assert.match(queueHelpers, /queueLabels: \{/);
  assert.match(queueHelpers, /queueLabel: queueLabels\.attendance/);
  assert.match(queueHelpers, /queueLabel: queueLabels\.leave/);
  assert.match(queueHelpers, /queueLabel: queueLabels\.payroll/);

  assert.match(workItem, /WI-0299/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0299/i);
}

run()
  .then(() => {
    console.log("e2e-wi0299-admin-locale-dynamic-ui-gap-fix-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
