import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

process.env.FLOWHR_DATA_ACCESS = "memory";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const openingsRouteSource = readUtf8("src", "app", "api", "recruitment", "openings", "route.ts");
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
  const withdrawRouteSource = readUtf8(
    "src",
    "app",
    "api",
    "recruitment",
    "referrals",
    "[referralId]",
    "withdraw",
    "route.ts"
  );
  const workItem = readUtf8("work-items", "WI-0762-recruitment-tenant-boundary-guard.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(openingsRouteSource, /organization_scope_mismatch/);
  assert.match(referralsRouteSource, /organization_scope_mismatch/);
  assert.match(stageRouteSource, /existing\.organizationId !== actor\.organizationId/);
  assert.match(withdrawRouteSource, /existing\.organizationId !== actor\.organizationId/);

  const openingsRoute = await import("../../src/app/api/recruitment/openings/route.ts");
  const referralsRoute = await import("../../src/app/api/recruitment/referrals/route.ts");
  const stageRoute = await import("../../src/app/api/recruitment/referrals/[referralId]/stage/route.ts");
  const withdrawRoute = await import("../../src/app/api/recruitment/referrals/[referralId]/withdraw/route.ts");
  const recruitmentStore = await import("../../src/features/recruitment/store.ts");
  const memoryModule = await import("../../src/features/shared/memory-data-access.ts");
  const { memoryDataAccess, resetMemoryDataAccess } = memoryModule;

  resetMemoryDataAccess();
  const orgA = await memoryDataAccess.organizations.create({ name: "Org A" });
  const orgB = await memoryDataAccess.organizations.create({ name: "Org B" });
  const openingA = await recruitmentStore.createRecruitmentOpening(
    {
      organizationId: orgA.id,
      title: "Platform Engineer",
      department: "Engineering",
      employmentType: "Full-time",
      status: "OPEN"
    },
    { dataAccess: memoryDataAccess }
  );
  const referralA = await recruitmentStore.createRecruitmentReferral(
    {
      organizationId: orgA.id,
      openingId: openingA.id,
      candidateName: "Kim Candidate",
      candidateEmail: "kim.boundary@example.com",
      referrerEmployeeId: "EMP-A-1",
      note: "boundary test referral"
    },
    { dataAccess: memoryDataAccess }
  );

  const listOpeningsMismatch = await openingsRoute.GET(
    new Request(`http://localhost/api/recruitment/openings?organizationId=${encodeURIComponent(orgB.id)}`, {
      method: "GET",
      headers: {
        "x-actor-role": "admin",
        "x-actor-id": "ADM-A-1",
        "x-actor-organization-id": orgA.id
      }
    })
  );
  assert.equal(listOpeningsMismatch.status, 403);
  const listOpeningsMismatchPayload = (await listOpeningsMismatch.json()) as { error?: string };
  assert.equal(listOpeningsMismatchPayload.error, "recruitment.opening.list.forbidden");

  const createOpeningMismatch = await openingsRoute.POST(
    new Request("http://localhost/api/recruitment/openings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "admin",
        "x-actor-id": "ADM-A-1",
        "x-actor-organization-id": orgA.id
      },
      body: JSON.stringify({
        organizationId: orgB.id,
        title: "Cross Org Opening",
        department: "Engineering",
        employmentType: "Full-time",
        status: "OPEN"
      })
    })
  );
  assert.equal(createOpeningMismatch.status, 403);
  const createOpeningMismatchPayload = (await createOpeningMismatch.json()) as { error?: string };
  assert.equal(createOpeningMismatchPayload.error, "recruitment.opening.create.forbidden");

  const listReferralsMismatch = await referralsRoute.GET(
    new Request(`http://localhost/api/recruitment/referrals?organizationId=${encodeURIComponent(orgB.id)}`, {
      method: "GET",
      headers: {
        "x-actor-role": "admin",
        "x-actor-id": "ADM-A-1",
        "x-actor-organization-id": orgA.id
      }
    })
  );
  assert.equal(listReferralsMismatch.status, 403);
  const listReferralsMismatchPayload = (await listReferralsMismatch.json()) as { error?: string };
  assert.equal(listReferralsMismatchPayload.error, "recruitment.referral.list.forbidden");

  const createReferralMismatch = await referralsRoute.POST(
    new Request("http://localhost/api/recruitment/referrals", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "employee",
        "x-actor-id": "EMP-A-1",
        "x-actor-organization-id": orgA.id
      },
      body: JSON.stringify({
        organizationId: orgB.id,
        openingId: openingA.id,
        candidateName: "Cross Org Candidate",
        candidateEmail: "cross.org@example.com",
        referrerEmployeeId: "EMP-A-1",
        note: "should fail by org mismatch"
      })
    })
  );
  assert.equal(createReferralMismatch.status, 403);
  const createReferralMismatchPayload = (await createReferralMismatch.json()) as { error?: string };
  assert.equal(createReferralMismatchPayload.error, "recruitment.referral.create.forbidden");

  const stageCrossTenant = await stageRoute.POST(
    new Request(`http://localhost/api/recruitment/referrals/${referralA.id}/stage`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "admin",
        "x-actor-id": "ADM-B-1",
        "x-actor-organization-id": orgB.id
      },
      body: JSON.stringify({ stage: "SCREENING" })
    }),
    {
      params: Promise.resolve({ referralId: referralA.id })
    }
  );
  assert.equal(stageCrossTenant.status, 404);
  const stageCrossTenantPayload = (await stageCrossTenant.json()) as { error?: string };
  assert.equal(stageCrossTenantPayload.error, "recruitment.referral.not_found");

  const withdrawCrossTenant = await withdrawRoute.POST(
    new Request(`http://localhost/api/recruitment/referrals/${referralA.id}/withdraw`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "employee",
        "x-actor-id": "EMP-A-1",
        "x-actor-organization-id": orgB.id
      },
      body: JSON.stringify({})
    }),
    {
      params: Promise.resolve({ referralId: referralA.id })
    }
  );
  assert.equal(withdrawCrossTenant.status, 404);
  const withdrawCrossTenantPayload = (await withdrawCrossTenant.json()) as { error?: string };
  assert.equal(withdrawCrossTenantPayload.error, "recruitment.referral.not_found");

  assert.match(workItem, /WI-0762/i);
  assert.match(workItem, /recruitment|tenant|boundary|organization|scope/i);
  assert.match(roadmap, /WI-0762/i);
}

run()
  .then(() => {
    console.log("e2e-wi0762-recruitment-tenant-boundary-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
