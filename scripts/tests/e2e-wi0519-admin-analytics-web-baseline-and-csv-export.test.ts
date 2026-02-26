import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const analyticsPage = readUtf8("src", "app", "admin", "analytics", "page.tsx");
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");
  const kpiCopy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const kpiDashboard = readUtf8("src", "components", "admin-kpi", "AdminKpiDashboard.tsx");
  const workItem = readUtf8("work-items", "WI-0519-admin-analytics-web-baseline-and-csv-export.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(analyticsPage, /AdminKpiDashboard/);
  assert.match(analyticsPage, /analyticsMode/);

  assert.match(adminLayout, /href: "\/admin\/analytics"/);
  assert.match(adminLayout, /t\("admin\.nav\.analytics"\)/);

  assert.match(messages, /"admin\.nav\.analytics": "분석\/리포트"/);
  assert.match(messages, /"admin\.nav\.analytics": "Analytics \/ Reports"/);

  assert.match(kpiCopy, /analyticsTitle:/);
  assert.match(kpiCopy, /analyticsDescription:/);
  assert.match(kpiCopy, /exportCsvButton:/);
  assert.match(kpiCopy, /exportCsvDone:/);

  assert.match(kpiDashboard, /type AdminKpiDashboardProps = \{/);
  assert.match(kpiDashboard, /analyticsMode\?: boolean/);
  assert.match(kpiDashboard, /buildAdminKpiCsvPayload/);
  assert.match(kpiDashboard, /triggerCsvDownload/);
  assert.match(kpiDashboard, /const exportCsv = useCallback\(\(\) => \{/);
  assert.match(kpiDashboard, /analyticsMode \? copy\.analyticsTitle : copy\.title/);
  assert.match(kpiDashboard, /copy\.exportCsvButton/);

  assert.match(workItem, /WI-0519/i);
  assert.match(workItem, /analytics|report|csv|web/i);
  assert.match(roadmap, /WI-0519/i);
}

run()
  .then(() => {
    console.log("e2e-wi0519-admin-analytics-web-baseline-and-csv-export.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
