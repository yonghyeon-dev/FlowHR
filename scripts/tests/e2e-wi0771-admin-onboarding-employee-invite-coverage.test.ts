import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const routeSource = readUtf8("src", "app", "api", "auth", "invites", "route.ts");
  const authServiceSource = readUtf8("src", "features", "auth", "service.ts");
  const hookSource = readUtf8("src", "components", "admin-onboarding", "useAdminOnboardingData.ts");
  const sectionsSource = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingSections.tsx");
  const copySource = readUtf8("src", "components", "admin-onboarding", "copy.ts");
  const checklistSource = readUtf8("src", "features", "admin-onboarding", "checklist.ts");
  const workItem = readUtf8("work-items", "WI-0771-admin-onboarding-employee-invite-coverage.md");

  assert.match(roadmap, /WI-0771/);
  assert.match(workItem, /Admin Onboarding Employee Invite Coverage/i);

  assert.match(routeSource, /export async function GET\(request: Request\)/);
  assert.match(routeSource, /listAuthInvites/);
  assert.match(routeSource, /summary:\s*\{\s*total:/);

  assert.match(authServiceSource, /export type ListAuthInvitesInput/);
  assert.match(authServiceSource, /export async function listAuthInvites/);
  assert.match(authServiceSource, /actions:\s*\[AUTH_INVITE_AUDIT_ACTION\]/);

  assert.match(hookSource, /inviteEligibleEmployeeCount/);
  assert.match(hookSource, /invitedEmployeeCount/);
  assert.match(hookSource, /pendingInviteCount/);
  assert.match(hookSource, /issuePendingEmployeeInvites/);
  assert.match(hookSource, /createInvitePrefix/);
  assert.match(hookSource, /deliveryMode:\s*"email"/);

  assert.match(sectionsSource, /inviteCoverageTitle/);
  assert.match(sectionsSource, /onIssuePendingEmployeeInvites/);
  assert.match(sectionsSource, /item\.key === "invites"/);

  assert.match(copySource, /inviteCoverageIssueButton/);
  assert.match(copySource, /createInvitePrefix/);
  assert.match(checklistSource, /"invites"/);
  assert.match(checklistSource, /inviteCoverageDone/);

  const { buildOnboardingChecklist, onboardingProgressPercent } = await import(
    "../../src/features/admin-onboarding/checklist.ts"
  );

  const inviteDone = buildOnboardingChecklist({
    organizationId: "ORG-1",
    departmentCount: 1,
    employeeCount: 2,
    inviteCoverageDone: true,
    leavePolicyConfigured: false
  });
  assert.equal(inviteDone.find((item) => item.key === "invites")?.done, true);
  assert.equal(onboardingProgressPercent(inviteDone), 80);

  const inviteMissing = buildOnboardingChecklist({
    organizationId: "ORG-1",
    departmentCount: 1,
    employeeCount: 2,
    inviteCoverageDone: false,
    leavePolicyConfigured: false
  });
  assert.equal(inviteMissing.find((item) => item.key === "invites")?.done, false);
  assert.equal(onboardingProgressPercent(inviteMissing), 60);
}

run()
  .then(() => {
    console.log("e2e-wi0771-admin-onboarding-employee-invite-coverage.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
