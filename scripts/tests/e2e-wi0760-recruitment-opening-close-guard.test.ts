import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

process.env.FLOWHR_DATA_ACCESS = "memory";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const schemas = readUtf8("src", "features", "recruitment", "schemas.ts");
  const statusRouteSource = readUtf8(
    "src",
    "app",
    "api",
    "recruitment",
    "openings",
    "[openingId]",
    "status",
    "route.ts"
  );
  const adminWorkspaceSource = readUtf8(
    "src",
    "components",
    "recruitment",
    "AdminRecruitmentWorkspace.tsx"
  );
  const recruitmentTypesSource = readUtf8("src", "features", "recruitment", "types.ts");
  const workItem = readUtf8("work-items", "WI-0760-recruitment-opening-close-guard.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(schemas, /force: z\.boolean\(\)\.optional\(\)/);
  assert.match(statusRouteSource, /recruitment\.opening\.status\.pending_referrals/);
  assert.match(statusRouteSource, /parsed\.data\.status === "CLOSED" && !parsed\.data\.force/);
  assert.match(statusRouteSource, /activeReferralCount/);
  assert.match(recruitmentTypesSource, /isRecruitmentReferralTerminalStage/);
  assert.match(adminWorkspaceSource, /window\.confirm/);
  assert.match(adminWorkspaceSource, /force: true/);

  const recruitmentStore = await import("../../src/features/recruitment/store.ts");
  const statusRoute = await import(
    "../../src/app/api/recruitment/openings/[openingId]/status/route.ts"
  );
  const memoryModule = await import("../../src/features/shared/memory-data-access.ts");
  const { memoryDataAccess, resetMemoryDataAccess } = memoryModule;

  resetMemoryDataAccess();
  const organization = await memoryDataAccess.organizations.create({
    name: "Org Recruitment Closing Guard"
  });

  const opening = await recruitmentStore.createRecruitmentOpening(
    {
      organizationId: organization.id,
      title: "Frontend Engineer",
      department: "Product",
      employmentType: "Full-time",
      status: "OPEN"
    },
    { dataAccess: memoryDataAccess }
  );
  await recruitmentStore.createRecruitmentReferral(
    {
      organizationId: organization.id,
      openingId: opening.id,
      candidateName: "Park Candidate",
      candidateEmail: "park.candidate@example.com",
      referrerEmployeeId: "EMP-REC-910",
      note: "Active referral should trigger close guard."
    },
    { dataAccess: memoryDataAccess }
  );

  const closeBlockedResponse = await statusRoute.POST(
    new Request(`http://localhost/api/recruitment/openings/${opening.id}/status`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "admin",
        "x-actor-id": "ADM-REC-200",
        "x-actor-organization-id": organization.id
      },
      body: JSON.stringify({ status: "CLOSED" })
    }),
    {
      params: Promise.resolve({ openingId: opening.id })
    }
  );
  assert.equal(closeBlockedResponse.status, 409);
  const blockedPayload = (await closeBlockedResponse.json()) as {
    error?: string;
    details?: { activeReferralCount?: number };
  };
  assert.equal(blockedPayload.error, "recruitment.opening.status.pending_referrals");
  assert.equal(blockedPayload.details?.activeReferralCount, 1);

  const closeForcedResponse = await statusRoute.POST(
    new Request(`http://localhost/api/recruitment/openings/${opening.id}/status`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "admin",
        "x-actor-id": "ADM-REC-200",
        "x-actor-organization-id": organization.id
      },
      body: JSON.stringify({ status: "CLOSED", force: true })
    }),
    {
      params: Promise.resolve({ openingId: opening.id })
    }
  );
  assert.equal(closeForcedResponse.status, 200);
  const forcedPayload = (await closeForcedResponse.json()) as {
    opening?: { status?: string };
  };
  assert.equal(forcedPayload.opening?.status, "CLOSED");

  const reopenResponse = await statusRoute.POST(
    new Request(`http://localhost/api/recruitment/openings/${opening.id}/status`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-role": "admin",
        "x-actor-id": "ADM-REC-200",
        "x-actor-organization-id": organization.id
      },
      body: JSON.stringify({ status: "OPEN" })
    }),
    {
      params: Promise.resolve({ openingId: opening.id })
    }
  );
  assert.equal(reopenResponse.status, 200);
  const reopenPayload = (await reopenResponse.json()) as {
    opening?: { status?: string };
  };
  assert.equal(reopenPayload.opening?.status, "OPEN");

  assert.match(workItem, /WI-0760/i);
  assert.match(workItem, /recruitment|opening|close|guard|referral|force/i);
  assert.match(roadmap, /WI-0760/i);
}

run()
  .then(() => {
    console.log("e2e-wi0760-recruitment-opening-close-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
