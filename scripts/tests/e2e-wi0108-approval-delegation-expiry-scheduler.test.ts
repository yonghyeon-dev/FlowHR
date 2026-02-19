import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

type JsonPayload = Record<string, unknown>;

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId
  };
  if (organizationId) {
    headers["x-actor-organization-id"] = organizationId;
  }
  return headers;
}

function jsonRequest(
  method: string,
  path: string,
  payload: JsonPayload,
  headers: Record<string, string>
) {
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: JSON.stringify(payload)
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );
  const { expireApprovalDelegationsSweep } = await import("../../src/features/approval/service.ts");

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const approvalDelegationsRoute = await import("../../src/app/api/approval/delegations/route.ts");

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgAResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "FlowHR Expiry Sweep Org A" },
      actorHeaders("admin", "ADM-8100")
    )
  );
  assert.equal(orgAResponse.status, 201);
  const orgABody = await readJson<{ organization: { id: string } }>(orgAResponse);
  const organizationA = orgABody.organization.id;

  const orgBResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "FlowHR Expiry Sweep Org B" },
      actorHeaders("admin", "ADM-8100")
    )
  );
  assert.equal(orgBResponse.status, 201);
  const orgBBody = await readJson<{ organization: { id: string } }>(orgBResponse);
  const organizationB = orgBBody.organization.id;

  const orgAExpiredDelegation = await approvalDelegationsRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/delegations",
      {
        organizationId: organizationA,
        domain: "ATTENDANCE",
        delegatorRole: "admin",
        delegateActorId: "MGR-A-EXPIRED",
        startsAt: "2026-01-01T00:00:00+09:00",
        endsAt: "2026-01-31T23:59:59+09:00",
        reason: "org-a expired fixture"
      },
      actorHeaders("admin", "ADM-8100", organizationA)
    )
  );
  assert.equal(orgAExpiredDelegation.status, 201);
  const orgAExpiredDelegationBody = await readJson<{ delegation: { id: string } }>(orgAExpiredDelegation);

  const orgAActiveDelegation = await approvalDelegationsRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/delegations",
      {
        organizationId: organizationA,
        domain: "ATTENDANCE",
        delegatorRole: "admin",
        delegateActorId: "MGR-A-ACTIVE",
        startsAt: "2026-02-01T00:00:00+09:00",
        endsAt: "2026-12-31T23:59:59+09:00",
        reason: "org-a active fixture"
      },
      actorHeaders("admin", "ADM-8100", organizationA)
    )
  );
  assert.equal(orgAActiveDelegation.status, 201);
  const orgAActiveDelegationBody = await readJson<{ delegation: { id: string } }>(orgAActiveDelegation);

  const orgBExpiredDelegation = await approvalDelegationsRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/delegations",
      {
        organizationId: organizationB,
        domain: "LEAVE",
        delegatorRole: "manager",
        delegateActorId: "MGR-B-EXPIRED",
        startsAt: "2026-01-01T00:00:00+09:00",
        endsAt: "2026-01-31T23:59:59+09:00",
        reason: "org-b expired fixture"
      },
      actorHeaders("admin", "ADM-8100", organizationB)
    )
  );
  assert.equal(orgBExpiredDelegation.status, 201);
  const orgBExpiredDelegationBody = await readJson<{ delegation: { id: string } }>(orgBExpiredDelegation);

  const schedulerActor = {
    id: "SYS-EXPIRY-8100",
    role: "system" as const,
    organizationId: null
  };

  const dryRunSweep = await expireApprovalDelegationsSweep(
    {
      actor: schedulerActor,
      dataAccess: memoryDataAccess
    },
    {
      expiresBeforeAt: new Date("2026-02-20T00:00:00+09:00"),
      dryRun: true
    }
  );

  assert.equal(dryRunSweep.totalOrganizations, 2);
  assert.equal(dryRunSweep.totalCheckedCount, 3);
  assert.equal(dryRunSweep.totalExpiredCount, 2);
  assert.equal(dryRunSweep.dryRun, true);
  assert.ok(
    dryRunSweep.organizations.some(
      (item) =>
        item.organizationId === organizationA &&
        item.delegationIds.includes(orgAExpiredDelegationBody.delegation.id)
    )
  );
  assert.ok(
    dryRunSweep.organizations.some(
      (item) =>
        item.organizationId === organizationB &&
        item.delegationIds.includes(orgBExpiredDelegationBody.delegation.id)
    )
  );

  const dryRunOrgAState = await memoryDataAccess.approvals.findDelegationById(
    orgAExpiredDelegationBody.delegation.id
  );
  assert.equal(dryRunOrgAState?.active, true, "dry-run must keep org A expired delegation active");

  const applyOrgASweep = await expireApprovalDelegationsSweep(
    {
      actor: schedulerActor,
      dataAccess: memoryDataAccess
    },
    {
      organizationIds: [organizationA],
      expiresBeforeAt: new Date("2026-02-20T00:00:00+09:00"),
      dryRun: false
    }
  );
  assert.equal(applyOrgASweep.totalOrganizations, 1);
  assert.equal(applyOrgASweep.totalCheckedCount, 2);
  assert.equal(applyOrgASweep.totalExpiredCount, 1);
  assert.ok(
    applyOrgASweep.organizations[0].delegationIds.includes(orgAExpiredDelegationBody.delegation.id)
  );

  const postApplyOrgAExpired = await memoryDataAccess.approvals.findDelegationById(
    orgAExpiredDelegationBody.delegation.id
  );
  assert.equal(postApplyOrgAExpired?.active, false, "org A expired delegation should be deactivated");

  const postApplyOrgAActive = await memoryDataAccess.approvals.findDelegationById(
    orgAActiveDelegationBody.delegation.id
  );
  assert.equal(postApplyOrgAActive?.active, true, "org A non-expired delegation should remain active");

  const postApplyOrgBExpired = await memoryDataAccess.approvals.findDelegationById(
    orgBExpiredDelegationBody.delegation.id
  );
  assert.equal(postApplyOrgBExpired?.active, true, "org B should remain unchanged before global sweep");

  const applyGlobalSweep = await expireApprovalDelegationsSweep(
    {
      actor: schedulerActor,
      dataAccess: memoryDataAccess
    },
    {
      expiresBeforeAt: new Date("2026-02-20T00:00:00+09:00"),
      dryRun: false
    }
  );
  assert.equal(applyGlobalSweep.totalOrganizations, 2);
  assert.equal(applyGlobalSweep.totalCheckedCount, 2);
  assert.equal(applyGlobalSweep.totalExpiredCount, 1);

  const postGlobalOrgBExpired = await memoryDataAccess.approvals.findDelegationById(
    orgBExpiredDelegationBody.delegation.id
  );
  assert.equal(postGlobalOrgBExpired?.active, false, "global sweep should deactivate remaining expired row");

  const auditActions = getMemoryAuditActions();
  const autoExpiredCount = auditActions.filter((action) => action === "approval.delegation.auto_expired").length;
  assert.equal(autoExpiredCount, 2, "two delegations should be auto-expired across sweeps");

  console.log("e2e-wi0108-approval-delegation-expiry-scheduler.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
