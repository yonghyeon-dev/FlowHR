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

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    ...(organizationId ? { "x-actor-organization-id": organizationId } : {})
  };
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const autoCloseRoute = await import("../../src/app/api/attendance/auto-close/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0925 Org" });
  const staleEmployeeId = "EMP-WI0925-1001";
  const recentEmployeeId = "EMP-WI0925-1002";
  const completedEmployeeId = "EMP-WI0925-1003";

  await memoryDataAccess.employees.create({ id: staleEmployeeId, organizationId: organization.id });
  await memoryDataAccess.employees.create({ id: recentEmployeeId, organizationId: organization.id });
  await memoryDataAccess.employees.create({ id: completedEmployeeId, organizationId: organization.id });

  const now = Date.now();
  const staleCheckInAt = new Date(now - (12 * 60 + 5) * 60 * 1000);
  const recentCheckInAt = new Date(now - 4 * 60 * 60 * 1000);
  const completedCheckInAt = new Date(now - 13 * 60 * 60 * 1000);
  const completedCheckOutAt = new Date(completedCheckInAt.getTime() + 8 * 60 * 60 * 1000);

  const staleRecord = await memoryDataAccess.attendance.create({
    employeeId: staleEmployeeId,
    checkInAt: staleCheckInAt,
    checkOutAt: null,
    breakMinutes: 60,
    isHoliday: false,
    notes: "stale-open-record"
  });
  const recentOpenRecord = await memoryDataAccess.attendance.create({
    employeeId: recentEmployeeId,
    checkInAt: recentCheckInAt,
    checkOutAt: null,
    breakMinutes: 30,
    isHoliday: false,
    notes: "recent-open-record"
  });
  const completedRecord = await memoryDataAccess.attendance.create({
    employeeId: completedEmployeeId,
    checkInAt: completedCheckInAt,
    checkOutAt: completedCheckOutAt,
    breakMinutes: 45,
    isHoliday: false,
    notes: "completed-record"
  });

  const adminResponse = await autoCloseRoute.POST(
    new Request("http://localhost/api/attendance/auto-close", {
      method: "POST",
      headers: actorHeaders("admin", "ADM-WI0925-1001", organization.id)
    })
  );
  assert.equal(adminResponse.status, 200, "admin should auto-close stale attendance records");

  const adminBody = await readJson<{
    closedCount: number;
    records: Array<{ id: string; checkOutAt: string | null; anomalyType?: string }>;
  }>(adminResponse);
  assert.equal(adminBody.closedCount, 1, "only one stale open record should be closed");
  assert.equal(adminBody.records.length, 1, "response should include only closed records");
  assert.equal(adminBody.records[0]?.id, staleRecord.id, "stale record should be closed");
  assert.equal(adminBody.records[0]?.anomalyType, "AUTO_CLOSED", "closed record should set anomalyType");
  assert.ok(adminBody.records[0]?.checkOutAt, "closed record should have checkOutAt");

  const staleAfter = await memoryDataAccess.attendance.findById(staleRecord.id);
  assert.ok(staleAfter, "stale record should exist after auto-close");
  assert.ok(staleAfter?.checkOutAt, "stale record should be auto-closed");
  assert.equal(
    staleAfter?.checkOutAt?.getTime(),
    staleCheckInAt.getTime() + 9 * 60 * 60 * 1000,
    "auto-closed checkOutAt should be checkInAt + 9h"
  );
  assert.equal(staleAfter?.anomalyType, "AUTO_CLOSED", "auto-closed record should persist anomalyType");

  const recentAfter = await memoryDataAccess.attendance.findById(recentOpenRecord.id);
  assert.ok(recentAfter, "recent open record should exist");
  assert.equal(recentAfter?.checkOutAt, null, "recent open record should not be auto-closed");
  assert.equal(recentAfter?.anomalyType, undefined, "recent open record should not set anomalyType");

  const completedAfter = await memoryDataAccess.attendance.findById(completedRecord.id);
  assert.ok(completedAfter, "completed record should exist");
  assert.equal(
    completedAfter?.checkOutAt?.getTime(),
    completedCheckOutAt.getTime(),
    "existing normal checkOutAt should remain unchanged"
  );
  assert.equal(completedAfter?.anomalyType, undefined, "completed record should not set anomalyType");

  const autoCloseAudits = await memoryDataAccess.audit.list({
    actions: ["attendance.auto_closed"],
    entityType: "AttendanceRecord"
  });
  assert.equal(autoCloseAudits.length, 1, "auto-close should record one audit entry");
  assert.equal(autoCloseAudits[0]?.entityId, staleRecord.id, "audit entry should target closed record");

  const employeeForbiddenResponse = await autoCloseRoute.POST(
    new Request("http://localhost/api/attendance/auto-close", {
      method: "POST",
      headers: actorHeaders("employee", staleEmployeeId, organization.id)
    })
  );
  assert.equal(employeeForbiddenResponse.status, 403, "employee role should be forbidden");
}

run()
  .then(() => {
    console.log("e2e-wi0925-auto-close.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
