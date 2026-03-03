import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const dashboard = readUtf8("src", "components", "admin-kpi", "AdminKpiDashboard.tsx");
  const noticesPanel = readUtf8("src", "components", "admin-kpi", "AdminNoticesKpiPanel.tsx");
  const benefitsPanel = readUtf8("src", "components", "admin-kpi", "AdminBenefitsKpiPanel.tsx");
  const recruitmentPanel = readUtf8("src", "components", "admin-kpi", "AdminRecruitmentKpiPanel.tsx");

  const noticesWorkspace = readUtf8("src", "components", "notices", "AdminNoticeWorkspace.tsx");
  const benefitsWorkspace = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspace.tsx");
  const recruitmentWorkspace = readUtf8(
    "src",
    "components",
    "recruitment",
    "AdminRecruitmentWorkspace.tsx"
  );

  const workItem = readUtf8(
    "work-items",
    "WI-0863-admin-communication-analytics-return-focus-restore.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok((dashboard.match(/analyticsFocusMetric=\{focusMetric\}/g) ?? []).length >= 3);

  assert.match(noticesPanel, /contextParams\.set\("analyticsFocus", options\.analyticsFocusMetric\)/);
  assert.match(benefitsPanel, /contextParams\.set\("analyticsFocus", options\.analyticsFocusMetric\)/);
  assert.match(recruitmentPanel, /contextParams\.set\("analyticsFocus", options\.analyticsFocusMetric\)/);

  assert.match(noticesWorkspace, /normalizeAnalyticsFocusMetric\(searchParams\.get\("analyticsFocus"\)\)/);
  assert.match(noticesWorkspace, /const analyticsBackHref = resolveAnalyticsBackHref\(source, analyticsFocusMetric\);/);
  assert.match(noticesWorkspace, /\/admin\/analytics\?focus=\$\{encodeURIComponent\(analyticsFocusMetric\)\}/);

  assert.match(benefitsWorkspace, /normalizeAnalyticsFocusMetric\(searchParams\.get\("analyticsFocus"\)\)/);
  assert.match(benefitsWorkspace, /const analyticsBackHref = resolveAnalyticsBackHref\(source, analyticsFocusMetric\);/);
  assert.match(benefitsWorkspace, /\/admin\/analytics\?focus=\$\{encodeURIComponent\(analyticsFocusMetric\)\}/);

  assert.match(recruitmentWorkspace, /normalizeAnalyticsFocusMetric\(searchParams\.get\("analyticsFocus"\)\)/);
  assert.match(recruitmentWorkspace, /const analyticsBackHref = resolveAnalyticsBackHref\(source, analyticsFocusMetric\);/);
  assert.match(recruitmentWorkspace, /\/admin\/analytics\?focus=\$\{encodeURIComponent\(analyticsFocusMetric\)\}/);

  assert.match(workItem, /WI-0863/i);
  assert.match(workItem, /admin|communication|analytics|return|focus|restore/i);
  assert.match(roadmap, /WI-0863/i);
}

run();
console.log("e2e-wi0863-admin-communication-analytics-return-focus-restore.test passed");
