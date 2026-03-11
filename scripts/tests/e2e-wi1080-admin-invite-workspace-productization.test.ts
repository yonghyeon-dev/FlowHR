import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const invitePanelSource = readFileSync(
  path.join(process.cwd(), "src/components/admin-dashboard/AdminPeopleInvitePanels.tsx"),
  "utf8"
);
const panelContainerSource = readFileSync(
  path.join(process.cwd(), "src/app/admin/page-panels.tsx"),
  "utf8"
);
const onboardingDashboardSource = readFileSync(
  path.join(process.cwd(), "src/components/admin-onboarding/AdminOnboardingDashboard.tsx"),
  "utf8"
);
const onboardingSectionsSource = readFileSync(
  path.join(process.cwd(), "src/components/admin-onboarding/AdminOnboardingSections.tsx"),
  "utf8"
);

assert.match(
  invitePanelSource,
  /ADMIN_PEOPLE_INVITE_PANELS_RETIRED_WI_1137/,
  "invite panel legacy fragment should be retired after the grouped admin hub migration"
);
assert.match(
  panelContainerSource,
  /ADMIN_DASHBOARD_PANELS_RETIRED_WI_1136/,
  "legacy dashboard invite scaffolding should be retired after route-first admin cleanup"
);
assert.match(
  onboardingDashboardSource,
  /inviteEligibleEmployeeCount=\{data\.inviteEligibleEmployeeCount\}/,
  "onboarding dashboard should own invite coverage in the current route-first model"
);
assert.match(
  onboardingSectionsSource,
  /copy\.inviteCoverageTitle/,
  "invite coverage panel should remain on the onboarding workspace"
);

console.log("e2e-wi1080-admin-invite-workspace-productization.test passed");
