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

function toShiftedIsoDate(days: number) {
  const now = new Date();
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  utcDate.setUTCDate(utcDate.getUTCDate() + days);
  return utcDate.toISOString().slice(0, 10);
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const benefitCatalogRoute = await import("../../src/app/api/benefits/catalog/route.ts");
  const benefitRequestsRoute = await import("../../src/app/api/benefits/requests/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0917 Org" });
  const adminId = "ADMIN-WI0917-1";
  const employeeId = "EMP-WI0917-1";
  await memoryDataAccess.employees.create({ id: adminId, organizationId: organization.id });
  await memoryDataAccess.employees.create({ id: employeeId, organizationId: organization.id });

  const adminHeaders = actorHeaders("admin", adminId, organization.id);
  const employeeHeaders = actorHeaders("employee", employeeId, organization.id);

  const tomorrow = toShiftedIsoDate(1);
  const dayAfterTomorrow = toShiftedIsoDate(2);
  const yesterday = toShiftedIsoDate(-1);

  const futureCatalogCreateResponse = await benefitCatalogRoute.POST(
    jsonRequest(
      "POST",
      "/api/benefits/catalog",
      {
        organizationId: organization.id,
        name: "WI-0917 future enrollment benefit",
        description: "future period benefit",
        annualLimitKrw: 150000,
        status: "ACTIVE",
        enrollmentStartDate: tomorrow,
        enrollmentEndDate: dayAfterTomorrow
      },
      adminHeaders
    )
  );
  assert.equal(futureCatalogCreateResponse.status, 201, "future-period catalog create should succeed");
  const futureCatalogCreateBody = (await readJson(futureCatalogCreateResponse)) as {
    catalogItem: {
      id: string;
      enrollmentStartDate?: string;
      enrollmentEndDate?: string;
    };
  };
  assert.equal(futureCatalogCreateBody.catalogItem.enrollmentStartDate, tomorrow);
  assert.equal(futureCatalogCreateBody.catalogItem.enrollmentEndDate, dayAfterTomorrow);

  const closedRequestResponse = await benefitRequestsRoute.POST(
    jsonRequest(
      "POST",
      "/api/benefits/requests",
      {
        organizationId: organization.id,
        benefitId: futureCatalogCreateBody.catalogItem.id,
        employeeId,
        amountKrw: 50000,
        reason: "should fail before period"
      },
      employeeHeaders
    )
  );
  assert.equal(closedRequestResponse.status, 400, "request should fail when enrollment period is closed");
  const closedRequestBody = (await readJson(closedRequestResponse)) as {
    error: string;
  };
  assert.equal(closedRequestBody.error, "enrollment_period_closed");

  const openCatalogCreateResponse = await benefitCatalogRoute.POST(
    jsonRequest(
      "POST",
      "/api/benefits/catalog",
      {
        organizationId: organization.id,
        name: "WI-0917 open enrollment benefit",
        description: "open period benefit",
        annualLimitKrw: 200000,
        status: "ACTIVE",
        enrollmentStartDate: yesterday,
        enrollmentEndDate: tomorrow
      },
      adminHeaders
    )
  );
  assert.equal(openCatalogCreateResponse.status, 201, "open-period catalog create should succeed");
  const openCatalogCreateBody = (await readJson(openCatalogCreateResponse)) as {
    catalogItem: { id: string };
  };

  const openRequestResponse = await benefitRequestsRoute.POST(
    jsonRequest(
      "POST",
      "/api/benefits/requests",
      {
        organizationId: organization.id,
        benefitId: openCatalogCreateBody.catalogItem.id,
        employeeId,
        amountKrw: 80000,
        reason: "should succeed during period"
      },
      employeeHeaders
    )
  );
  assert.equal(openRequestResponse.status, 201, "request should succeed when enrollment period is open");

  const catalogListResponse = await benefitCatalogRoute.GET(
    new Request(
      `http://localhost/api/benefits/catalog?organizationId=${encodeURIComponent(organization.id)}`,
      {
        method: "GET",
        headers: employeeHeaders
      }
    )
  );
  assert.equal(catalogListResponse.status, 200, "catalog list should succeed");
  const catalogListBody = (await readJson(catalogListResponse)) as {
    catalog: Array<{
      id: string;
      enrollmentStartDate?: string;
      enrollmentEndDate?: string;
    }>;
  };
  const futureCatalog = catalogListBody.catalog.find((item) => item.id === futureCatalogCreateBody.catalogItem.id);
  assert.ok(futureCatalog, "future catalog should exist in list");
  assert.equal(futureCatalog?.enrollmentStartDate, tomorrow);
  assert.equal(futureCatalog?.enrollmentEndDate, dayAfterTomorrow);
}

run()
  .then(() => {
    console.log("e2e-wi0917-benefits-enrollment-period.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
