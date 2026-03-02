import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

process.env.FLOWHR_DATA_ACCESS = "memory";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const referralsRouteSource = readUtf8("src", "app", "api", "recruitment", "referrals", "route.ts");
  const stageRouteSource = readUtf8(
    "src",
    "app",
    "api",
    "recruitment",
    "referrals",
    "[referralId]",
    "stage",
    "route.ts"
  );
  const adminWorkspaceViewSource = readUtf8(
    "src",
    "components",
    "recruitment",
    "AdminRecruitmentWorkspaceView.tsx"
  );
  const recruitmentTypesSource = readUtf8("src", "features", "recruitment", "types.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0759-recruitment-referral-opening-status-policy.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(referralsRouteSource, /recruitment\.referral\.create\.opening_closed/);
  assert.match(referralsRouteSource, /opening\.status !== "OPEN"/);
  assert.match(stageRouteSource, /recruitment\.referral\.stage\.invalid_transition/);
  assert.match(stageRouteSource, /isRecruitmentReferralStageTransitionAllowed/);
  assert.match(recruitmentTypesSource, /listRecruitmentReferralNextStages/);
  assert.match(recruitmentTypesSource, /isRecruitmentReferralStageTransitionAllowed/);
  assert.match(adminWorkspaceViewSource, /listRecruitmentReferralNextStages\(referral\.stage\)/);

  const recruitmentStore = await import("../../src/features/recruitment/store.ts");
  const recruitmentTypes = await import("../../src/features/recruitment/types.ts");
  const referralRoute = await import("../../src/app/api/recruitment/referrals/route.ts");
  const referralStageRoute = await import(
    "../../src/app/api/recruitment/referrals/[referralId]/stage/route.ts"
  );
  const memoryModule = await import("../../src/features/shared/memory-data-access.ts");
  const { memoryDataAccess, resetMemoryDataAccess } = memoryModule;

  resetMemoryDataAccess();
  const organization = await memoryDataAccess.organizations.create({
    name: "Org Recruitment Transition Policy"
  });

  const closedOpening = await recruitmentStore.createRecruitmentOpening(
    {
      organizationId: organization.id,
      title: "Data Analyst",
      department: "People Analytics",
      employmentType: "Full-time",
      status: "CLOSED"
    },
    { dataAccess: memoryDataAccess }
  );

  const createOnClosedResponse = await referralRoute.POST(
    new Request("http://localhost/api/recruitment/referrals", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "employee",
        "x-actor-id": "EMP-REC-900",
        "x-actor-organization-id": organization.id
      },
      body: JSON.stringify({
        organizationId: organization.id,
        openingId: closedOpening.id,
        candidateName: "Kim Candidate",
        candidateEmail: "kim.candidate@example.com",
        referrerEmployeeId: "EMP-REC-900",
        note: "Closed opening should block new referral submission."
      })
    })
  );
  assert.equal(createOnClosedResponse.status, 409);
  const closedPayload = (await createOnClosedResponse.json()) as {
    error?: string;
    details?: { openingId?: string };
  };
  assert.equal(closedPayload.error, "recruitment.referral.create.opening_closed");
  assert.equal(closedPayload.details?.openingId, closedOpening.id);

  const openOpening = await recruitmentStore.createRecruitmentOpening(
    {
      organizationId: organization.id,
      title: "Backend Engineer",
      department: "Platform",
      employmentType: "Full-time",
      status: "OPEN"
    },
    { dataAccess: memoryDataAccess }
  );
  const createdReferral = await recruitmentStore.createRecruitmentReferral(
    {
      organizationId: organization.id,
      openingId: openOpening.id,
      candidateName: "Lee Candidate",
      candidateEmail: "lee.candidate@example.com",
      referrerEmployeeId: "EMP-REC-901",
      note: "Initial submission."
    },
    { dataAccess: memoryDataAccess }
  );
  assert.equal(createdReferral.stage, "SUBMITTED");

  assert.equal(
    recruitmentTypes.isRecruitmentReferralStageTransitionAllowed("SUBMITTED", "HIRED"),
    false
  );
  assert.deepEqual(recruitmentTypes.listRecruitmentReferralNextStages("SUBMITTED"), [
    "SUBMITTED",
    "SCREENING",
    "WITHDRAWN"
  ]);

  const invalidTransitionResponse = await referralStageRoute.POST(
    new Request(`http://localhost/api/recruitment/referrals/${createdReferral.id}/stage`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "admin",
        "x-actor-id": "ADM-REC-100",
        "x-actor-organization-id": organization.id
      },
      body: JSON.stringify({
        stage: "HIRED"
      })
    }),
    {
      params: Promise.resolve({ referralId: createdReferral.id })
    }
  );
  assert.equal(invalidTransitionResponse.status, 409);
  const invalidPayload = (await invalidTransitionResponse.json()) as {
    error?: string;
    details?: { from?: string; to?: string };
  };
  assert.equal(invalidPayload.error, "recruitment.referral.stage.invalid_transition");
  assert.equal(invalidPayload.details?.from, "SUBMITTED");
  assert.equal(invalidPayload.details?.to, "HIRED");

  const validTransitionResponse = await referralStageRoute.POST(
    new Request(`http://localhost/api/recruitment/referrals/${createdReferral.id}/stage`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "admin",
        "x-actor-id": "ADM-REC-100",
        "x-actor-organization-id": organization.id
      },
      body: JSON.stringify({
        stage: "SCREENING"
      })
    }),
    {
      params: Promise.resolve({ referralId: createdReferral.id })
    }
  );
  assert.equal(validTransitionResponse.status, 200);
  const validPayload = (await validTransitionResponse.json()) as {
    referral?: { stage?: string };
  };
  assert.equal(validPayload.referral?.stage, "SCREENING");

  assert.match(workItem, /WI-0759/i);
  assert.match(
    workItem,
    /recruitment|referral|opening|closed|status|transition|policy|core journey/i
  );
  assert.match(roadmap, /WI-0759/i);
}

run()
  .then(() => {
    console.log("e2e-wi0759-recruitment-referral-opening-status-policy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
