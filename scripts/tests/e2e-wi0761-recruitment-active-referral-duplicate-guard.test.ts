import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

process.env.FLOWHR_DATA_ACCESS = "memory";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const referralsRouteSource = readUtf8("src", "app", "api", "recruitment", "referrals", "route.ts");
  const employeeWorkspaceSource = readUtf8(
    "src",
    "components",
    "recruitment",
    "EmployeeRecruitmentWorkspace.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0761-recruitment-active-referral-duplicate-guard.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(referralsRouteSource, /recruitment\.referral\.create\.duplicate_active/);
  assert.match(referralsRouteSource, /isRecruitmentReferralTerminalStage/);
  assert.match(employeeWorkspaceSource, /recruitment\.referral\.create\.duplicate_active/);

  const referralRoute = await import("../../src/app/api/recruitment/referrals/route.ts");
  const withdrawRoute = await import(
    "../../src/app/api/recruitment/referrals/[referralId]/withdraw/route.ts"
  );
  const recruitmentStore = await import("../../src/features/recruitment/store.ts");
  const memoryModule = await import("../../src/features/shared/memory-data-access.ts");
  const { memoryDataAccess, resetMemoryDataAccess } = memoryModule;

  resetMemoryDataAccess();
  const organization = await memoryDataAccess.organizations.create({
    name: "Org Recruitment Duplicate Guard"
  });
  const opening = await recruitmentStore.createRecruitmentOpening(
    {
      organizationId: organization.id,
      title: "Security Engineer",
      department: "Platform",
      employmentType: "Full-time",
      status: "OPEN"
    },
    { dataAccess: memoryDataAccess }
  );

  const firstCreateResponse = await referralRoute.POST(
    new Request("http://localhost/api/recruitment/referrals", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "employee",
        "x-actor-id": "EMP-REC-920",
        "x-actor-organization-id": organization.id
      },
      body: JSON.stringify({
        organizationId: organization.id,
        openingId: opening.id,
        candidateName: "Choi Candidate",
        candidateEmail: "duplicate.candidate@example.com",
        referrerEmployeeId: "EMP-REC-920",
        note: "first referral"
      })
    })
  );
  assert.equal(firstCreateResponse.status, 201);
  const firstPayload = (await firstCreateResponse.json()) as {
    referral?: { id?: string };
  };
  const firstReferralId = firstPayload.referral?.id ?? "";
  assert.ok(firstReferralId.length > 0);

  const duplicateCreateResponse = await referralRoute.POST(
    new Request("http://localhost/api/recruitment/referrals", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "employee",
        "x-actor-id": "EMP-REC-920",
        "x-actor-organization-id": organization.id
      },
      body: JSON.stringify({
        organizationId: organization.id,
        openingId: opening.id,
        candidateName: "Choi Candidate Duplicate",
        candidateEmail: "DUPLICATE.CANDIDATE@example.com",
        referrerEmployeeId: "EMP-REC-920",
        note: "duplicate referral"
      })
    })
  );
  assert.equal(duplicateCreateResponse.status, 409);
  const duplicatePayload = (await duplicateCreateResponse.json()) as {
    error?: string;
    details?: { referralId?: string };
  };
  assert.equal(duplicatePayload.error, "recruitment.referral.create.duplicate_active");
  assert.equal(duplicatePayload.details?.referralId, firstReferralId);

  const withdrawResponse = await withdrawRoute.POST(
    new Request(
      `http://localhost/api/recruitment/referrals/${encodeURIComponent(firstReferralId)}/withdraw`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-actor-role": "employee",
          "x-actor-id": "EMP-REC-920",
          "x-actor-organization-id": organization.id
        },
        body: JSON.stringify({})
      }
    ),
    {
      params: Promise.resolve({ referralId: firstReferralId })
    }
  );
  assert.equal(withdrawResponse.status, 200);

  const recreateResponse = await referralRoute.POST(
    new Request("http://localhost/api/recruitment/referrals", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "employee",
        "x-actor-id": "EMP-REC-920",
        "x-actor-organization-id": organization.id
      },
      body: JSON.stringify({
        organizationId: organization.id,
        openingId: opening.id,
        candidateName: "Choi Candidate Recreate",
        candidateEmail: "duplicate.candidate@example.com",
        referrerEmployeeId: "EMP-REC-920",
        note: "recreated after withdrawn"
      })
    })
  );
  assert.equal(recreateResponse.status, 201);

  assert.match(workItem, /WI-0761/i);
  assert.match(workItem, /recruitment|duplicate|referral|active|guard|core journey/i);
  assert.match(roadmap, /WI-0761/i);
}

run()
  .then(() => {
    console.log("e2e-wi0761-recruitment-active-referral-duplicate-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
