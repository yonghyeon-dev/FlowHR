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
  const { resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const approvalPolicyRoute = await import("../../src/app/api/approval/policy/route.ts");
  const approvalDelegationsRoute = await import("../../src/app/api/approval/delegations/route.ts");
  const approvalDelegationsExpireRoute = await import(
    "../../src/app/api/approval/delegations/expire/route.ts"
  );

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "FlowHR Approval Expiry Org" }, actorHeaders("admin", "ADM-7100"))
  );
  assert.equal(orgResponse.status, 201);
  const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);
  const organizationId = orgBody.organization.id;

  const upsertPolicyResponse = await approvalPolicyRoute.PUT(
    jsonRequest(
      "PUT",
      "/api/approval/policy",
      {
        organizationId,
        attendanceApproverRole: "admin",
        leaveApproverRole: "manager",
        payrollApproverRole: "payroll_operator"
      },
      actorHeaders("admin", "ADM-7100", organizationId)
    )
  );
  assert.equal(upsertPolicyResponse.status, 200);

  const expiredDelegationResponse = await approvalDelegationsRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/delegations",
      {
        organizationId,
        domain: "ATTENDANCE",
        delegatorRole: "admin",
        delegateActorId: "MGR-EXPIRED",
        startsAt: "2026-01-01T00:00:00+09:00",
        endsAt: "2026-01-31T23:59:59+09:00",
        reason: "expired delegation fixture"
      },
      actorHeaders("admin", "ADM-7100", organizationId)
    )
  );
  assert.equal(expiredDelegationResponse.status, 201);
  const expiredDelegationBody = await readJson<{ delegation: { id: string } }>(expiredDelegationResponse);
  const expiredDelegationId = expiredDelegationBody.delegation.id;

  const activeDelegationResponse = await approvalDelegationsRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/delegations",
      {
        organizationId,
        domain: "ATTENDANCE",
        delegatorRole: "admin",
        delegateActorId: "MGR-ACTIVE",
        startsAt: "2026-02-01T00:00:00+09:00",
        endsAt: "2026-12-31T23:59:59+09:00",
        reason: "active delegation fixture"
      },
      actorHeaders("admin", "ADM-7100", organizationId)
    )
  );
  assert.equal(activeDelegationResponse.status, 201);
  const activeDelegationBody = await readJson<{ delegation: { id: string } }>(activeDelegationResponse);
  const activeDelegationId = activeDelegationBody.delegation.id;

  const dryRunResponse = await approvalDelegationsExpireRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/delegations/expire",
      {
        organizationId,
        expiresBeforeAt: "2026-02-20T00:00:00+09:00",
        dryRun: true
      },
      actorHeaders("admin", "ADM-7100", organizationId)
    )
  );
  assert.equal(dryRunResponse.status, 200, "dry-run expire should succeed");
  const dryRunBody = await readJson<{
    checkedCount: number;
    expiredCount: number;
    delegationIds: string[];
    dryRun: boolean;
  }>(dryRunResponse);
  assert.equal(dryRunBody.checkedCount, 2);
  assert.equal(dryRunBody.expiredCount, 1);
  assert.equal(dryRunBody.dryRun, true);
  assert.ok(dryRunBody.delegationIds.includes(expiredDelegationId));

  const listBeforeApplyResponse = await approvalDelegationsRoute.GET(
    new Request(`http://localhost/api/approval/delegations?organizationId=${organizationId}`, {
      method: "GET",
      headers: actorHeaders("admin", "ADM-7100", organizationId)
    })
  );
  assert.equal(listBeforeApplyResponse.status, 200);
  const listBeforeApplyBody = await readJson<{ delegations: Array<{ id: string; active: boolean }> }>(
    listBeforeApplyResponse
  );
  assert.equal(
    listBeforeApplyBody.delegations.find((item) => item.id === expiredDelegationId)?.active,
    true,
    "dry-run must not mutate delegation active state"
  );

  const applyResponse = await approvalDelegationsExpireRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/delegations/expire",
      {
        organizationId,
        expiresBeforeAt: "2026-02-20T00:00:00+09:00",
        dryRun: false
      },
      actorHeaders("admin", "ADM-7100", organizationId)
    )
  );
  assert.equal(applyResponse.status, 200, "expire apply should succeed");
  const applyBody = await readJson<{
    checkedCount: number;
    expiredCount: number;
    delegationIds: string[];
    dryRun: boolean;
  }>(applyResponse);
  assert.equal(applyBody.checkedCount, 2);
  assert.equal(applyBody.expiredCount, 1);
  assert.equal(applyBody.dryRun, false);
  assert.ok(applyBody.delegationIds.includes(expiredDelegationId));

  const listAfterApplyResponse = await approvalDelegationsRoute.GET(
    new Request(`http://localhost/api/approval/delegations?organizationId=${organizationId}`, {
      method: "GET",
      headers: actorHeaders("admin", "ADM-7100", organizationId)
    })
  );
  assert.equal(listAfterApplyResponse.status, 200);
  const listAfterApplyBody = await readJson<{ delegations: Array<{ id: string; active: boolean }> }>(
    listAfterApplyResponse
  );
  assert.equal(
    listAfterApplyBody.delegations.find((item) => item.id === expiredDelegationId)?.active,
    false,
    "expired delegation should be auto-deactivated"
  );
  assert.equal(
    listAfterApplyBody.delegations.find((item) => item.id === activeDelegationId)?.active,
    true,
    "non-expired delegation should remain active"
  );

  const auditActions = getMemoryAuditActions();
  assert.ok(
    auditActions.includes("approval.delegation.auto_expired"),
    "audit should include approval.delegation.auto_expired"
  );

  const eventNames = getRuntimeMemoryDomainEvents().map((event) => event.name);
  assert.ok(
    eventNames.includes("approval.delegation.updated.v1"),
    "event stream should include approval.delegation.updated.v1 on auto-expire"
  );

  console.log("e2e-wi0107-approval-delegation-expiry.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
