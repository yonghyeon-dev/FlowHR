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
    "WI-0860-admin-analytics-communication-kpi-source-context-links.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(noticesPanel, /function withAnalyticsSourceContext/);
  assert.match(noticesPanel, /source=admin-analytics/);
  assert.match(
    noticesPanel,
    /withAnalyticsSourceContext\("\/admin\/notices\?status=PUBLISHED&risk=no-read"\)/
  );
  assert.match(noticesPanel, /withAnalyticsSourceContext\("\/admin\/notices"\)/);

  assert.match(benefitsPanel, /function withAnalyticsSourceContext/);
  assert.match(benefitsPanel, /source=admin-analytics/);
  assert.match(
    benefitsPanel,
    /withAnalyticsSourceContext\("\/admin\/benefits\?status=SUBMITTED&risk=pending_3d"\)/
  );
  assert.match(
    benefitsPanel,
    /withAnalyticsSourceContext\("\/admin\/benefits\?status=SUBMITTED&risk=over_limit"\)/
  );

  assert.match(recruitmentPanel, /function withAnalyticsSourceContext/);
  assert.match(recruitmentPanel, /source=admin-analytics/);
  assert.match(
    recruitmentPanel,
    /withAnalyticsSourceContext\("\/admin\/recruitment\?risk=stalled_7d"\)/
  );
  assert.match(
    recruitmentPanel,
    /withAnalyticsSourceContext\("\/admin\/recruitment\?stage=SUBMITTED"\)/
  );

  assert.match(noticesWorkspace, /source === "admin-analytics"/);
  assert.match(noticesWorkspace, /Opened from admin analytics\./);
  assert.match(benefitsWorkspace, /source === "admin-analytics"/);
  assert.match(benefitsWorkspace, /Opened from admin analytics\./);
  assert.match(recruitmentWorkspace, /source === "admin-analytics"/);
  assert.match(recruitmentWorkspace, /Opened from admin analytics\./);

  assert.match(workItem, /WI-0860/i);
  assert.match(workItem, /admin|analytics|communication|kpi|source|context|links/i);
  assert.match(roadmap, /WI-0860/i);
}

run();
console.log("e2e-wi0860-admin-analytics-communication-kpi-source-context-links.test passed");
