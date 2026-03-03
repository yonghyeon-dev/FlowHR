import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const noticesWorkspace = readUtf8("src", "components", "notices", "AdminNoticeWorkspace.tsx");
  const benefitsWorkspace = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspace.tsx");
  const recruitmentWorkspace = readUtf8(
    "src",
    "components",
    "recruitment",
    "AdminRecruitmentWorkspace.tsx"
  );

  const noticesView = readUtf8("src", "components", "notices", "AdminNoticeWorkspaceView.tsx");
  const benefitsView = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspaceView.tsx");
  const recruitmentView = readUtf8(
    "src",
    "components",
    "recruitment",
    "AdminRecruitmentWorkspaceView.tsx"
  );

  const workItem = readUtf8(
    "work-items",
    "WI-0862-admin-communication-analytics-return-action.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(noticesWorkspace, /const analyticsBackHref = source === "admin-analytics" \? "\/admin\/analytics" : "";/);
  assert.match(noticesWorkspace, /const analyticsBackLabel = locale === "ko" \? "분석으로 돌아가기" : "Back to analytics";/);
  assert.match(noticesWorkspace, /analyticsBackHref=\{analyticsBackHref\}/);
  assert.match(noticesWorkspace, /analyticsBackLabel=\{analyticsBackLabel\}/);

  assert.match(benefitsWorkspace, /const analyticsBackHref = source === "admin-analytics" \? "\/admin\/analytics" : "";/);
  assert.match(benefitsWorkspace, /const analyticsBackLabel = locale === "ko" \? "분석으로 돌아가기" : "Back to analytics";/);
  assert.match(benefitsWorkspace, /analyticsBackHref=\{analyticsBackHref\}/);
  assert.match(benefitsWorkspace, /analyticsBackLabel=\{analyticsBackLabel\}/);

  assert.match(recruitmentWorkspace, /const analyticsBackHref = source === "admin-analytics" \? "\/admin\/analytics" : "";/);
  assert.match(recruitmentWorkspace, /const analyticsBackLabel = locale === "ko" \? "분석으로 돌아가기" : "Back to analytics";/);
  assert.match(recruitmentWorkspace, /analyticsBackHref=\{analyticsBackHref\}/);
  assert.match(recruitmentWorkspace, /analyticsBackLabel=\{analyticsBackLabel\}/);

  assert.match(noticesView, /analyticsBackHref: string;/);
  assert.match(noticesView, /analyticsBackLabel: string;/);
  assert.match(noticesView, /analyticsBackHref \? \(/);
  assert.match(noticesView, /href=\{analyticsBackHref\}/);
  assert.match(noticesView, /\{analyticsBackLabel\}/);

  assert.match(benefitsView, /analyticsBackHref: string;/);
  assert.match(benefitsView, /analyticsBackLabel: string;/);
  assert.match(benefitsView, /analyticsBackHref \? \(/);
  assert.match(benefitsView, /href=\{analyticsBackHref\}/);
  assert.match(benefitsView, /\{analyticsBackLabel\}/);

  assert.match(recruitmentView, /analyticsBackHref: string;/);
  assert.match(recruitmentView, /analyticsBackLabel: string;/);
  assert.match(recruitmentView, /analyticsBackHref \? \(/);
  assert.match(recruitmentView, /href=\{analyticsBackHref\}/);
  assert.match(recruitmentView, /\{analyticsBackLabel\}/);

  assert.match(workItem, /WI-0862/i);
  assert.match(workItem, /admin|communication|analytics|return|action/i);
  assert.match(roadmap, /WI-0862/i);
}

run();
console.log("e2e-wi0862-admin-communication-analytics-return-action.test passed");
