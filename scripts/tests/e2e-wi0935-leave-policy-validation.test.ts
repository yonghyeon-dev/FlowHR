import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

function actorHeaders(role: string, actorId: string, organizationId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    "x-actor-organization-id": organizationId
  };
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const leavePoliciesRoute = await import("../../src/app/api/leave/policies/route.ts");
  const leavePolicyByIdRoute = await import(
    "../../src/app/api/leave/policies/[policyId]/route.ts"
  );

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({
    name: "WI-0935 Leave Policy Validation Org"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-WI0935-1001",
    organizationId: organization.id,
    name: "Employee Policy Usage"
  });

  const adminHeaders = actorHeaders("admin", "ADMIN-WI0935-1", organization.id);
  const employeeHeaders = actorHeaders("employee", "EMP-WI0935-1001", organization.id);

  const listSeededResponse = await leavePoliciesRoute.GET(
    new Request(`http://localhost/api/leave/policies?organizationId=${organization.id}`, {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(listSeededResponse.status, 200, "admin should list leave policies");
  const listSeededBody = await readJson<{
    organizationId: string;
    policies: Array<{
      id: string;
      name: string;
      isStatutory: boolean;
      usageCount: number;
      status: "ACTIVE" | "ARCHIVED";
    }>;
  }>(listSeededResponse);
  assert.equal(listSeededBody.organizationId, organization.id);
  assert.ok(listSeededBody.policies.every((policy) => typeof policy.isStatutory === "boolean"));
  assert.ok(listSeededBody.policies.every((policy) => typeof policy.usageCount === "number"));

  const seededStatutoryPolicy = listSeededBody.policies.find((policy) => policy.isStatutory);
  assert.ok(seededStatutoryPolicy, "list should include at least one statutory policy");

  const deleteStatutoryResponse = await leavePolicyByIdRoute.DELETE(
    new Request(
      `http://localhost/api/leave/policies/${seededStatutoryPolicy?.id}?organizationId=${organization.id}`,
      {
        method: "DELETE",
        headers: adminHeaders
      }
    ),
    {
      params: Promise.resolve({ policyId: seededStatutoryPolicy!.id })
    } as RouteContext<{ policyId: string }>
  );
  assert.equal(deleteStatutoryResponse.status, 400, "statutory policy delete should be rejected");
  const deleteStatutoryBody = await readJson<{ error: string }>(deleteStatutoryResponse);
  assert.equal(deleteStatutoryBody.error, "Cannot delete statutory leave policy");

  const usedPolicy = await memoryDataAccess.leavePolicy.create({
    organizationId: organization.id,
    name: "Custom Used Policy",
    isStatutory: false,
    status: "ACTIVE"
  });
  await memoryDataAccess.leave.create({
    employeeId: "EMP-WI0935-1001",
    policyId: usedPolicy.id,
    leaveType: "ANNUAL",
    startDate: new Date("2026-03-10T00:00:00+09:00"),
    endDate: new Date("2026-03-10T23:59:59+09:00"),
    unit: "FULL_DAY",
    days: 1,
    reason: "usage guard coverage"
  });

  const deleteUsedResponse = await leavePolicyByIdRoute.DELETE(
    new Request(
      `http://localhost/api/leave/policies/${usedPolicy.id}?organizationId=${organization.id}`,
      {
        method: "DELETE",
        headers: adminHeaders
      }
    ),
    {
      params: Promise.resolve({ policyId: usedPolicy.id })
    } as RouteContext<{ policyId: string }>
  );
  assert.equal(deleteUsedResponse.status, 400, "policy with usage should be rejected");
  const deleteUsedBody = await readJson<{ error: string }>(deleteUsedResponse);
  assert.equal(deleteUsedBody.error, "Policy has active usage, cannot delete");

  const unusedPolicy = await memoryDataAccess.leavePolicy.create({
    organizationId: organization.id,
    name: "Custom Unused Policy",
    isStatutory: false,
    status: "ACTIVE"
  });

  const deleteUnusedResponse = await leavePolicyByIdRoute.DELETE(
    new Request(
      `http://localhost/api/leave/policies/${unusedPolicy.id}?organizationId=${organization.id}`,
      {
        method: "DELETE",
        headers: adminHeaders
      }
    ),
    {
      params: Promise.resolve({ policyId: unusedPolicy.id })
    } as RouteContext<{ policyId: string }>
  );
  assert.equal(deleteUnusedResponse.status, 200, "unused non-statutory policy should archive");
  const deleteUnusedBody = await readJson<{
    policy: { id: string; status: "ACTIVE" | "ARCHIVED"; usageCount: number };
  }>(deleteUnusedResponse);
  assert.equal(deleteUnusedBody.policy.id, unusedPolicy.id);
  assert.equal(deleteUnusedBody.policy.status, "ARCHIVED");
  assert.equal(deleteUnusedBody.policy.usageCount, 0);

  const listAfterArchiveResponse = await leavePoliciesRoute.GET(
    new Request(`http://localhost/api/leave/policies?organizationId=${organization.id}`, {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(listAfterArchiveResponse.status, 200);
  const listAfterArchiveBody = await readJson<{
    policies: Array<{ id: string; usageCount: number }>;
  }>(listAfterArchiveResponse);
  assert.equal(
    listAfterArchiveBody.policies.some((policy) => policy.id === unusedPolicy.id),
    false,
    "archived policy should be excluded by default active filter"
  );
  const usedPolicyAfterArchive = listAfterArchiveBody.policies.find(
    (policy) => policy.id === usedPolicy.id
  );
  assert.equal(usedPolicyAfterArchive?.usageCount, 1, "usage count should include linked leave request");

  const employeeDeleteDeniedResponse = await leavePolicyByIdRoute.DELETE(
    new Request(
      `http://localhost/api/leave/policies/${usedPolicy.id}?organizationId=${organization.id}`,
      {
        method: "DELETE",
        headers: employeeHeaders
      }
    ),
    {
      params: Promise.resolve({ policyId: usedPolicy.id })
    } as RouteContext<{ policyId: string }>
  );
  assert.equal(employeeDeleteDeniedResponse.status, 403, "employee role should be forbidden");
}

run()
  .then(() => {
    console.log("e2e-wi0935-leave-policy-validation.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
