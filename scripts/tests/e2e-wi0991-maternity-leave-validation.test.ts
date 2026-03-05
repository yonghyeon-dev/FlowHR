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

function actorHeaders(role: string, actorId: string, organizationId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    "x-actor-organization-id": organizationId
  };
}

function jsonRequest(method: string, path: string, payload: unknown, headers: Record<string, string>) {
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
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const leaveRequestsRoute = await import("../../src/app/api/leave/requests/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({
    name: "WI-0991 Org"
  });

  const singleBirthEmployeeId = "EMP-WI0991-SINGLE";
  const multipleBirthEmployeeId = "EMP-WI0991-MULTI";
  const paternityEmployeeId = "EMP-WI0991-PATERNITY";

  await memoryDataAccess.employees.create({
    id: singleBirthEmployeeId,
    organizationId: organization.id
  });
  await memoryDataAccess.employees.create({
    id: multipleBirthEmployeeId,
    organizationId: organization.id
  });
  await memoryDataAccess.employees.create({
    id: paternityEmployeeId,
    organizationId: organization.id
  });

  const singleBirthHeaders = actorHeaders("employee", singleBirthEmployeeId, organization.id);
  const multipleBirthHeaders = actorHeaders("employee", multipleBirthEmployeeId, organization.id);
  const paternityHeaders = actorHeaders("employee", paternityEmployeeId, organization.id);

  const singleBirthWithinLimit = await leaveRequestsRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: singleBirthEmployeeId,
        leaveType: "MATERNITY",
        startDate: "2026-01-01T00:00:00+09:00",
        endDate: "2026-03-31T23:59:59+09:00",
        reason: "single birth within statutory limit"
      },
      singleBirthHeaders
    )
  );
  assert.equal(singleBirthWithinLimit.status, 201, "single birth maternity leave within 90 days should succeed");

  const singleBirthOverLimit = await leaveRequestsRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: singleBirthEmployeeId,
        leaveType: "MATERNITY",
        startDate: "2026-05-01T00:00:00+09:00",
        endDate: "2026-07-30T23:59:59+09:00",
        reason: "single birth over statutory limit"
      },
      singleBirthHeaders
    )
  );
  assert.equal(singleBirthOverLimit.status, 400, "single birth maternity leave over 90 days should fail");
  const singleBirthOverLimitBody = await readJson<{
    error: string;
    details: { leaveType: string; requestedDays: number; maxDays: number; isMultipleBirth: boolean };
  }>(singleBirthOverLimit);
  assert.match(singleBirthOverLimitBody.error, /statutory leave day limit exceeded/i);
  assert.equal(singleBirthOverLimitBody.details.leaveType, "MATERNITY");
  assert.equal(singleBirthOverLimitBody.details.maxDays, 90);
  assert.equal(singleBirthOverLimitBody.details.isMultipleBirth, false);

  const multipleBirthWithinLimit = await leaveRequestsRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: multipleBirthEmployeeId,
        leaveType: "MATERNITY",
        isMultipleBirth: true,
        startDate: "2026-01-01T00:00:00+09:00",
        endDate: "2026-04-30T23:59:59+09:00",
        reason: "multiple birth within statutory limit"
      },
      multipleBirthHeaders
    )
  );
  assert.equal(multipleBirthWithinLimit.status, 201, "multiple birth maternity leave within 120 days should succeed");

  const multipleBirthOverLimit = await leaveRequestsRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: multipleBirthEmployeeId,
        leaveType: "MATERNITY",
        isMultipleBirth: true,
        startDate: "2026-06-01T00:00:00+09:00",
        endDate: "2026-09-29T23:59:59+09:00",
        reason: "multiple birth over statutory limit"
      },
      multipleBirthHeaders
    )
  );
  assert.equal(multipleBirthOverLimit.status, 400, "multiple birth maternity leave over 120 days should fail");
  const multipleBirthOverLimitBody = await readJson<{
    error: string;
    details: { leaveType: string; requestedDays: number; maxDays: number; isMultipleBirth: boolean };
  }>(multipleBirthOverLimit);
  assert.match(multipleBirthOverLimitBody.error, /statutory leave day limit exceeded/i);
  assert.equal(multipleBirthOverLimitBody.details.leaveType, "MATERNITY");
  assert.equal(multipleBirthOverLimitBody.details.maxDays, 120);
  assert.equal(multipleBirthOverLimitBody.details.isMultipleBirth, true);

  const paternityWithinLimit = await leaveRequestsRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: paternityEmployeeId,
        leaveType: "PATERNITY",
        startDate: "2026-09-01T00:00:00+09:00",
        endDate: "2026-09-10T23:59:59+09:00",
        reason: "paternity leave within statutory limit"
      },
      paternityHeaders
    )
  );
  assert.equal(paternityWithinLimit.status, 201, "paternity leave within 10 days should succeed");

  const paternityOverLimit = await leaveRequestsRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: paternityEmployeeId,
        leaveType: "PATERNITY",
        startDate: "2026-10-01T00:00:00+09:00",
        endDate: "2026-10-11T23:59:59+09:00",
        reason: "paternity leave over statutory limit"
      },
      paternityHeaders
    )
  );
  assert.equal(paternityOverLimit.status, 400, "paternity leave over 10 days should fail");
  const paternityOverLimitBody = await readJson<{
    error: string;
    details: { leaveType: string; requestedDays: number; maxDays: number };
  }>(paternityOverLimit);
  assert.match(paternityOverLimitBody.error, /statutory leave day limit exceeded/i);
  assert.equal(paternityOverLimitBody.details.leaveType, "PATERNITY");
  assert.equal(paternityOverLimitBody.details.maxDays, 10);
}

run()
  .then(() => {
    console.log("e2e-wi0991-maternity-leave-validation.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
