import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";

type JsonPayload = Record<string, unknown>;
type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    ...(organizationId ? { "x-actor-organization-id": organizationId } : {})
  };
}

function jsonRequest(method: string, path: string, payload: JsonPayload, headers: Record<string, string>) {
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: JSON.stringify(payload)
  });
}

async function readJson(response: Response) {
  return (await response.json()) as unknown;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const openingsRoute = await import("../../src/app/api/recruitment/openings/route.ts");
  const referralsRoute = await import("../../src/app/api/recruitment/referrals/route.ts");
  const referralStageRoute = await import(
    "../../src/app/api/recruitment/referrals/[referralId]/stage/route.ts"
  );

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0913 Org" });
  const hiringManagerId = "EMP-WI0913-HM";
  const referrerEmployeeId = "EMP-WI0913-REF";
  const reviewerActorId = "ADM-WI0913-1";

  await memoryDataAccess.employees.create({
    id: hiringManagerId,
    organizationId: organization.id,
    name: "Hiring Manager"
  });
  await memoryDataAccess.employees.create({
    id: referrerEmployeeId,
    organizationId: organization.id,
    name: "Referrer Employee"
  });

  const openingCreateResponse = await openingsRoute.POST(
    jsonRequest(
      "POST",
      "/api/recruitment/openings",
      {
        organizationId: organization.id,
        title: "Senior Frontend Engineer",
        department: "Engineering",
        employmentType: "Full-time",
        hiringManagerId
      },
      actorHeaders("manager", reviewerActorId, organization.id)
    )
  );
  assert.equal(openingCreateResponse.status, 201, "opening creation should succeed");
  const openingCreateBody = (await readJson(openingCreateResponse)) as {
    opening: { id: string; hiringManagerId?: string };
  };
  const openingId = openingCreateBody.opening.id;
  assert.equal(
    openingCreateBody.opening.hiringManagerId,
    hiringManagerId,
    "opening should persist hiringManagerId"
  );

  const openingsGetResponse = await openingsRoute.GET(
    new Request(
      `http://localhost/api/recruitment/openings?organizationId=${encodeURIComponent(organization.id)}`,
      {
        method: "GET",
        headers: actorHeaders("manager", reviewerActorId, organization.id)
      }
    )
  );
  assert.equal(openingsGetResponse.status, 200, "opening list should succeed");
  const openingsGetBody = (await readJson(openingsGetResponse)) as {
    openings: Array<{ id: string; hiringManagerId?: string }>;
  };
  const createdOpeningFromList = openingsGetBody.openings.find((opening) => opening.id === openingId);
  assert.ok(createdOpeningFromList, "created opening should appear in list");
  assert.equal(
    createdOpeningFromList?.hiringManagerId,
    hiringManagerId,
    "opening list should include hiringManagerId"
  );

  const referralCreateResponse = await referralsRoute.POST(
    jsonRequest(
      "POST",
      "/api/recruitment/referrals",
      {
        organizationId: organization.id,
        openingId,
        candidateName: "Kim Candidate",
        candidateEmail: "wi0913.candidate@example.com",
        referrerEmployeeId,
        note: "Strong product and platform background."
      },
      actorHeaders("employee", referrerEmployeeId, organization.id)
    )
  );
  assert.equal(referralCreateResponse.status, 201, "referral creation should succeed");
  const referralCreateBody = (await readJson(referralCreateResponse)) as {
    referral: { id: string; stage: string; stageReason?: string };
  };
  const referralId = referralCreateBody.referral.id;
  assert.equal(referralCreateBody.referral.stage, "SUBMITTED");
  assert.equal(referralCreateBody.referral.stageReason, undefined);

  const screeningResponse = await referralStageRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/recruitment/referrals/${referralId}/stage`,
      {
        stage: "SCREENING"
      },
      actorHeaders("manager", reviewerActorId, organization.id)
    ),
    { params: Promise.resolve({ referralId }) } as RouteContext<{ referralId: string }>
  );
  assert.equal(screeningResponse.status, 200, "SCREENING stage change should succeed");

  const rejectedWithoutReasonResponse = await referralStageRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/recruitment/referrals/${referralId}/stage`,
      {
        stage: "REJECTED"
      },
      actorHeaders("manager", reviewerActorId, organization.id)
    ),
    { params: Promise.resolve({ referralId }) } as RouteContext<{ referralId: string }>
  );
  assert.equal(
    rejectedWithoutReasonResponse.status,
    400,
    "REJECTED stage change without reason should fail"
  );
  const rejectedWithoutReasonBody = (await readJson(rejectedWithoutReasonResponse)) as {
    error?: string;
  };
  assert.equal(
    rejectedWithoutReasonBody.error,
    "recruitment.referral.stage.reason_required"
  );

  const rejectionReason = "Missing required domain experience";
  const rejectedWithReasonResponse = await referralStageRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/recruitment/referrals/${referralId}/stage`,
      {
        stage: "REJECTED",
        reason: rejectionReason
      },
      actorHeaders("manager", reviewerActorId, organization.id)
    ),
    { params: Promise.resolve({ referralId }) } as RouteContext<{ referralId: string }>
  );
  assert.equal(rejectedWithReasonResponse.status, 200, "REJECTED stage with reason should succeed");
  const rejectedWithReasonBody = (await readJson(rejectedWithReasonResponse)) as {
    referral: { stage: string; stageReason?: string };
  };
  assert.equal(rejectedWithReasonBody.referral.stage, "REJECTED");
  assert.equal(rejectedWithReasonBody.referral.stageReason, rejectionReason);

  const referralsGetResponse = await referralsRoute.GET(
    new Request(
      `http://localhost/api/recruitment/referrals?organizationId=${encodeURIComponent(organization.id)}`,
      {
        method: "GET",
        headers: actorHeaders("manager", reviewerActorId, organization.id)
      }
    )
  );
  assert.equal(referralsGetResponse.status, 200, "referral list should succeed");
  const referralsGetBody = (await readJson(referralsGetResponse)) as {
    referrals: Array<{ id: string; stage: string; stageReason?: string }>;
  };
  const updatedReferral = referralsGetBody.referrals.find((referral) => referral.id === referralId);
  assert.ok(updatedReferral, "updated referral should appear in list");
  assert.equal(updatedReferral?.stage, "REJECTED");
  assert.equal(updatedReferral?.stageReason, rejectionReason);

  console.log("e2e-wi0913-recruitment-enhancements.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
