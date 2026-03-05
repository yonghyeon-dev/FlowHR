import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

type JsonPayload = Record<string, unknown>;

function actorHeaders(role: string, actorId: string, organizationId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    "x-actor-organization-id": organizationId
  };
}

function jsonRequest(method: string, path: string, payload: JsonPayload, headers: Record<string, string>) {
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
  const route = await import("../../src/app/api/admin/settings/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0955 Org" });
  const adminHeaders = actorHeaders("admin", "ADM-WI0955-1001", organization.id);
  const employeeHeaders = actorHeaders("employee", "EMP-WI0955-1001", organization.id);

  const getDefaultsResponse = await route.GET(
    new Request("http://localhost/api/admin/settings", {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(getDefaultsResponse.status, 200, "admin should read organization settings");

  const defaultsBody = await readJson<{
    fiscalYearStartMonth: number;
    standardWorkHoursPerDay: number;
    standardWorkDaysPerWeek: number;
    overtimeThresholdHours: number;
    payPeriod: "MONTHLY" | "BIWEEKLY";
    timezone: string | null;
    currency: string;
  }>(getDefaultsResponse);

  assert.equal(defaultsBody.fiscalYearStartMonth, 1);
  assert.equal(defaultsBody.standardWorkHoursPerDay, 8);
  assert.equal(defaultsBody.standardWorkDaysPerWeek, 5);
  assert.equal(defaultsBody.overtimeThresholdHours, 8);
  assert.equal(defaultsBody.payPeriod, "MONTHLY");
  assert.equal(defaultsBody.timezone, null);
  assert.equal(defaultsBody.currency, "KRW");

  const updateFiscalYearResponse = await route.PATCH(
    jsonRequest(
      "PATCH",
      "/api/admin/settings",
      {
        fiscalYearStartMonth: 4
      },
      adminHeaders
    )
  );
  assert.equal(updateFiscalYearResponse.status, 200, "valid fiscal year update should return 200");

  const updatedFiscalYearBody = await readJson<{
    fiscalYearStartMonth: number;
  }>(updateFiscalYearResponse);
  assert.equal(updatedFiscalYearBody.fiscalYearStartMonth, 4);

  const invalidMonthResponse = await route.PATCH(
    jsonRequest(
      "PATCH",
      "/api/admin/settings",
      {
        fiscalYearStartMonth: 13
      },
      adminHeaders
    )
  );
  assert.equal(invalidMonthResponse.status, 400, "invalid fiscal year month should return 400");

  const forbiddenResponse = await route.GET(
    new Request("http://localhost/api/admin/settings", {
      method: "GET",
      headers: employeeHeaders
    })
  );
  assert.equal(forbiddenResponse.status, 403, "non-admin role should be forbidden");

  const partialUpdateResponse = await route.PATCH(
    jsonRequest(
      "PATCH",
      "/api/admin/settings",
      {
        payPeriod: "BIWEEKLY"
      },
      adminHeaders
    )
  );
  assert.equal(partialUpdateResponse.status, 200, "partial updates should return 200");

  const partialUpdateBody = await readJson<{
    fiscalYearStartMonth: number;
    standardWorkHoursPerDay: number;
    standardWorkDaysPerWeek: number;
    overtimeThresholdHours: number;
    payPeriod: "MONTHLY" | "BIWEEKLY";
    timezone: string | null;
    currency: string;
  }>(partialUpdateResponse);

  assert.equal(partialUpdateBody.fiscalYearStartMonth, 4);
  assert.equal(partialUpdateBody.standardWorkHoursPerDay, 8);
  assert.equal(partialUpdateBody.standardWorkDaysPerWeek, 5);
  assert.equal(partialUpdateBody.overtimeThresholdHours, 8);
  assert.equal(partialUpdateBody.payPeriod, "BIWEEKLY");
  assert.equal(partialUpdateBody.timezone, null);
  assert.equal(partialUpdateBody.currency, "KRW");
}

run()
  .then(() => {
    console.log("e2e-wi0955-org-settings.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
