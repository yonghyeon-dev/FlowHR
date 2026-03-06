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
  const leavePolicyByIdRoute = await import(
    "../../src/app/api/leave/policies/[policyId]/route.ts"
  );

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({
    name: "WI-1008 Leave Policy Read Route Org"
  });

  const customPolicy = await memoryDataAccess.leavePolicy.create({
    organizationId: organization.id,
    name: "Carry Cap 12",
    isStatutory: false,
    status: "ACTIVE",
    annualGrantDays: 18,
    carryOverCapDays: 12,
    allowHalfDay: false,
    allowHourly: false,
    hourlyIncrementMinutes: 60,
    maxHoursPerRequest: 4,
    minNoticeDays: 3,
    maxConsecutiveDays: 7,
    annualLeavePromotionEnabled: true,
    annualLeavePromotionThresholdDays: 8,
    annualLeavePromotionLeadDays: 21,
    annualLeavePromotionMessageTemplate: "Use your annual leave."
  });

  const adminHeaders = actorHeaders("admin", "ADMIN-WI1008-1", organization.id);

  const readResponse = await leavePolicyByIdRoute.GET(
    new Request(
      `http://localhost/api/leave/policies/${customPolicy.id}?organizationId=${organization.id}`,
      {
        method: "GET",
        headers: adminHeaders
      }
    ),
    {
      params: Promise.resolve({ policyId: customPolicy.id })
    } as RouteContext<{ policyId: string }>
  );

  assert.equal(readResponse.status, 200, "admin should read leave policy by id");
  const readBody = await readJson<{
    policy: {
      organizationId: string;
      annualGrantDays: number;
      carryOverCapDays: number;
      allowHalfDay: boolean;
      allowHourly: boolean;
      hourlyIncrementMinutes: number;
      maxHoursPerRequest: number;
      minNoticeDays: number;
      maxConsecutiveDays: number | null;
      annualLeavePromotionEnabled: boolean;
      annualLeavePromotionThresholdDays: number;
      annualLeavePromotionLeadDays: number;
      annualLeavePromotionMessageTemplate: string;
      source: "configured" | "default";
      updatedAt: string | null;
    };
  }>(readResponse);
  assert.equal(readBody.policy.organizationId, organization.id);
  assert.equal(readBody.policy.annualGrantDays, 18);
  assert.equal(readBody.policy.carryOverCapDays, 12);
  assert.equal(readBody.policy.allowHalfDay, false);
  assert.equal(readBody.policy.allowHourly, false);
  assert.equal(readBody.policy.hourlyIncrementMinutes, 60);
  assert.equal(readBody.policy.maxHoursPerRequest, 4);
  assert.equal(readBody.policy.minNoticeDays, 3);
  assert.equal(readBody.policy.maxConsecutiveDays, 7);
  assert.equal(readBody.policy.annualLeavePromotionEnabled, true);
  assert.equal(readBody.policy.annualLeavePromotionThresholdDays, 8);
  assert.equal(readBody.policy.annualLeavePromotionLeadDays, 21);
  assert.equal(readBody.policy.annualLeavePromotionMessageTemplate, "Use your annual leave.");
  assert.equal(readBody.policy.source, "configured");
  assert.equal(typeof readBody.policy.updatedAt, "string");
}

run()
  .then(() => {
    console.log("e2e-wi1008-leave-policy-read-route.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
