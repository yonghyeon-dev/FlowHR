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

function buildAuditQuery(input: {
  from: string;
  to: string;
  entityType?: string;
  actorId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams({
    from: input.from,
    to: input.to
  });
  if (input.entityType) {
    query.set("entityType", input.entityType);
  }
  if (input.actorId) {
    query.set("actorId", input.actorId);
  }
  if (input.action) {
    query.set("action", input.action);
  }
  if (input.limit !== undefined) {
    query.set("limit", String(input.limit));
  }
  if (input.offset !== undefined) {
    query.set("offset", String(input.offset));
  }
  return query.toString();
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const attendanceRecordsRoute = await import("../../src/app/api/attendance/records/route.ts");
  const auditLogsRoute = await import("../../src/app/api/admin/audit-logs/route.ts");
  const auditLogsExportRoute = await import("../../src/app/api/admin/audit-logs/export/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({
    name: "WI-0927 Audit Viewer Org"
  });

  const adminActorId = "ADM-WI0927-1";
  const employeeId = "EMP-WI0927-1001";
  const adminHeaders = actorHeaders("admin", adminActorId, organization.id);
  const employeeHeaders = actorHeaders("employee", employeeId, organization.id);

  const createEmployeeResponse = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: employeeId,
        organizationId: organization.id,
        name: "Employee WI0927",
        email: "employee.wi0927@example.com",
        active: true
      },
      adminHeaders
    )
  );
  assert.equal(createEmployeeResponse.status, 201, "employee create should succeed");

  const checkInAt = new Date().toISOString();
  const createAttendanceResponse = await attendanceRecordsRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId,
        checkInAt,
        breakMinutes: 30,
        isHoliday: false
      },
      employeeHeaders
    )
  );
  assert.equal(createAttendanceResponse.status, 201, "attendance create should succeed");

  const from = new Date(Date.now() - 1000 * 60 * 60).toISOString();
  const to = new Date(Date.now() + 1000 * 60 * 60).toISOString();

  const listResponse = await auditLogsRoute.GET(
    new Request(`http://localhost/api/admin/audit-logs?${buildAuditQuery({ from, to })}`, {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(listResponse.status, 200, "admin should list audit logs");

  const listBody = await readJson<{
    items: Array<{
      action: string;
      entityType: string;
      actorId: string | null;
      createdAt: string;
    }>;
    total: number;
  }>(listResponse);
  assert.ok(listBody.total >= 2, "audit log total should include created records");
  assert.ok(listBody.items.length > 0, "audit logs should not be empty");
  assert.ok(
    listBody.items.some((item) => item.action === "employee.created"),
    "list should include employee.created log"
  );
  assert.ok(
    listBody.items.some((item) => item.action === "attendance.recorded"),
    "list should include attendance.recorded log"
  );

  const employeeOnlyResponse = await auditLogsRoute.GET(
    new Request(
      `http://localhost/api/admin/audit-logs?${buildAuditQuery({
        from,
        to,
        entityType: "Employee",
        limit: 200
      })}`,
      {
        method: "GET",
        headers: adminHeaders
      }
    )
  );
  assert.equal(employeeOnlyResponse.status, 200, "entityType filter should succeed");
  const employeeOnlyBody = await readJson<{
    items: Array<{ entityType: string }>;
    total: number;
  }>(employeeOnlyResponse);
  assert.ok(employeeOnlyBody.total >= 1, "employee filter should return at least one log");
  assert.ok(
    employeeOnlyBody.items.every((item) => item.entityType === "Employee"),
    "entityType filter should return only Employee logs"
  );

  const exportResponse = await auditLogsExportRoute.GET(
    new Request(`http://localhost/api/admin/audit-logs/export?${buildAuditQuery({ from, to })}`, {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(exportResponse.status, 200, "admin should export audit logs as csv");
  assert.match(
    exportResponse.headers.get("content-type") ?? "",
    /^text\/csv/i,
    "content type should be text/csv"
  );
  const csv = await exportResponse.text();
  assert.ok(csv.includes("timestamp,entityType,entityId,action,actorId,changes"));

  const forbiddenListResponse = await auditLogsRoute.GET(
    new Request(`http://localhost/api/admin/audit-logs?${buildAuditQuery({ from, to })}`, {
      method: "GET",
      headers: employeeHeaders
    })
  );
  assert.equal(forbiddenListResponse.status, 403, "employee role should be forbidden");
}

run()
  .then(() => {
    console.log("e2e-wi0927-audit-log-viewer.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
