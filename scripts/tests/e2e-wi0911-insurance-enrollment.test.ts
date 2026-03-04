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

type EnrollmentType = "NPS" | "NHI" | "EI" | "WCI";
type EnrollmentStatus = "ENROLLED" | "NOT_ENROLLED" | "PENDING";

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
  const insuranceEnrollmentRoute = await import("../../src/app/api/admin/insurance/enrollment/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0911 Org" });
  const employeeId = "EMP-WI0911-1001";
  const adminId = "ADM-WI0911-1001";
  await memoryDataAccess.employees.create({ id: employeeId, organizationId: organization.id });

  const adminHeaders = actorHeaders("admin", adminId, organization.id);
  const employeeHeaders = actorHeaders("employee", employeeId, organization.id);

  const entries: Array<{
    type: EnrollmentType;
    status: EnrollmentStatus;
    enrolledAt?: string;
  }> = [
    { type: "NPS", status: "ENROLLED", enrolledAt: "2026-03-01T09:00:00+09:00" },
    { type: "NHI", status: "PENDING" },
    { type: "EI", status: "NOT_ENROLLED" },
    { type: "WCI", status: "ENROLLED", enrolledAt: "2026-03-02T09:00:00+09:00" }
  ];

  for (const entry of entries) {
    const postResponse = await insuranceEnrollmentRoute.POST(
      jsonRequest(
        "POST",
        "/api/admin/insurance/enrollment",
        {
          employeeId,
          type: entry.type,
          status: entry.status,
          enrolledAt: entry.enrolledAt
        },
        adminHeaders
      )
    );
    assert.equal(postResponse.status, 200, `admin enrollment upsert should succeed for ${entry.type}`);
  }

  const getResponse = await insuranceEnrollmentRoute.GET(
    new Request(
      `http://localhost/api/admin/insurance/enrollment?employeeId=${encodeURIComponent(employeeId)}`,
      {
        method: "GET",
        headers: adminHeaders
      }
    )
  );
  assert.equal(getResponse.status, 200, "admin enrollment list should succeed");
  const getBody = (await readJson(getResponse)) as {
    employeeId: string;
    enrollments: Array<{
      type: EnrollmentType;
      status: EnrollmentStatus;
      enrolledAt?: string;
    }>;
  };
  assert.equal(getBody.employeeId, employeeId, "employeeId should match query");
  assert.equal(getBody.enrollments.length, 4, "get should return 4 enrollment rows");

  const byType = new Map<EnrollmentType, { status: EnrollmentStatus; enrolledAt?: string }>();
  for (const enrollment of getBody.enrollments) {
    byType.set(enrollment.type, {
      status: enrollment.status,
      ...(enrollment.enrolledAt ? { enrolledAt: enrollment.enrolledAt } : {})
    });
  }

  assert.equal(byType.get("NPS")?.status, "ENROLLED");
  assert.equal(byType.get("NHI")?.status, "PENDING");
  assert.equal(byType.get("EI")?.status, "NOT_ENROLLED");
  assert.equal(byType.get("WCI")?.status, "ENROLLED");
  assert.equal(byType.get("NPS")?.enrolledAt, new Date("2026-03-01T09:00:00+09:00").toISOString());
  assert.equal(byType.get("WCI")?.enrolledAt, new Date("2026-03-02T09:00:00+09:00").toISOString());
  assert.equal(byType.get("NHI")?.enrolledAt, undefined);
  assert.equal(byType.get("EI")?.enrolledAt, undefined);

  const employeeDenied = await insuranceEnrollmentRoute.GET(
    new Request(
      `http://localhost/api/admin/insurance/enrollment?employeeId=${encodeURIComponent(employeeId)}`,
      {
        method: "GET",
        headers: employeeHeaders
      }
    )
  );
  assert.equal(employeeDenied.status, 403, "employee role should be forbidden from insurance enrollment API");
}

run()
  .then(() => {
    console.log("e2e-wi0911-insurance-enrollment.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
