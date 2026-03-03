import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
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
    "WI-0861-admin-analytics-communication-focus-queue-context.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(noticesPanel, /function withAnalyticsSourceContext\(href: string, focusMetric\?: string\)/);
  assert.match(noticesPanel, /focusMetric=\$\{focusMetric\}/);
  assert.match(
    noticesPanel,
    /withAnalyticsSourceContext\(\s*"\/admin\/notices\?status=PUBLISHED&risk=no-read",\s*"noticeUnreadAging3dCount"\s*\)/
  );
  assert.match(
    noticesPanel,
    /withAnalyticsSourceContext\(\s*"\/admin\/notices\?status=PUBLISHED&risk=no-read",\s*"noticeNoReadCount"\s*\)/
  );
  assert.match(
    noticesPanel,
    /withAnalyticsSourceContext\(\s*"\/admin\/notices",\s*"noticePublishedCount"\s*\)/
  );

  assert.match(benefitsPanel, /function withAnalyticsSourceContext\(href: string, focusMetric\?: string\)/);
  assert.match(
    benefitsPanel,
    /withAnalyticsSourceContext\(\s*"\/admin\/benefits\?status=SUBMITTED&risk=pending_3d",\s*"benefitsPendingAging3dCount"\s*\)/
  );
  assert.match(
    benefitsPanel,
    /withAnalyticsSourceContext\(\s*"\/admin\/benefits\?status=SUBMITTED&risk=over_limit",\s*"benefitsOverLimitSubmittedCount"\s*\)/
  );
  assert.match(
    benefitsPanel,
    /withAnalyticsSourceContext\(\s*"\/admin\/benefits",\s*"benefitsSubmittedCount"\s*\)/
  );

  assert.match(recruitmentPanel, /function withAnalyticsSourceContext\(href: string, focusMetric\?: string\)/);
  assert.match(
    recruitmentPanel,
    /withAnalyticsSourceContext\(\s*"\/admin\/recruitment\?risk=stalled_7d",\s*"recruitmentStalledReferral7dCount"\s*\)/
  );
  assert.match(
    recruitmentPanel,
    /withAnalyticsSourceContext\(\s*"\/admin\/recruitment\?stage=SUBMITTED",\s*"recruitmentSubmittedReferralCount"\s*\)/
  );
  assert.match(
    recruitmentPanel,
    /withAnalyticsSourceContext\(\s*"\/admin\/recruitment",\s*"recruitmentActiveReferralCount"\s*\)/
  );

  assert.match(noticesWorkspace, /resolveNoticeAnalyticsFocusLabel/);
  assert.match(noticesWorkspace, /searchParams\.get\("focusMetric"\)/);
  assert.match(noticesWorkspace, /집중 큐/);
  assert.match(noticesWorkspace, /Focus queue/);

  assert.match(benefitsWorkspace, /resolveBenefitsAnalyticsFocusLabel/);
  assert.match(benefitsWorkspace, /searchParams\.get\("focusMetric"\)/);
  assert.match(benefitsWorkspace, /집중 큐/);
  assert.match(benefitsWorkspace, /Focus queue/);

  assert.match(recruitmentWorkspace, /resolveRecruitmentAnalyticsFocusLabel/);
  assert.match(recruitmentWorkspace, /searchParams\.get\("focusMetric"\)/);
  assert.match(recruitmentWorkspace, /집중 큐/);
  assert.match(recruitmentWorkspace, /Focus queue/);

  assert.match(workItem, /WI-0861/i);
  assert.match(workItem, /admin|analytics|communication|focus|queue|context/i);
  assert.match(roadmap, /WI-0861/i);
}

run();
console.log("e2e-wi0861-admin-analytics-communication-focus-queue-context.test passed");
