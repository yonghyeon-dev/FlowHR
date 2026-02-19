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

type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

function actorHeaders(role: string, actorId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId
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
  const attendanceRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceApproveRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
  );
  const approvalPolicyRoute = await import("../../src/app/api/approval/policy/route.ts");
  const approvalHistoryRoute = await import("../../src/app/api/approval/stage-history/route.ts");

  resetMemoryDataAccess();

  const org = await memoryDataAccess.organizations.create({ name: "Org Approval Stage History" });
  const employeeId = "EMP-APPROVAL-HISTORY-1";
  await memoryDataAccess.employees.create({ id: employeeId, organizationId: org.id });

  const policySave = await approvalPolicyRoute.PUT(
    jsonRequest(
      "PUT",
      "/api/approval/policy",
      {
        organizationId: org.id,
        attendanceApproverRole: "admin",
        leaveApproverRole: "manager",
        payrollApproverRole: "payroll_operator"
      },
      actorHeaders("admin", "ADM-1001")
    )
  );
  assert.equal(policySave.status, 200, "approval policy save should succeed");

  const attendanceCreate = await attendanceRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId,
        checkInAt: "2026-03-20T09:00:00+09:00",
        checkOutAt: "2026-03-20T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false,
        notes: "history-baseline"
      },
      actorHeaders("employee", employeeId)
    )
  );
  assert.equal(attendanceCreate.status, 201, "attendance create should succeed");
  const attendanceCreateBody = await readJson<{ record: { id: string } }>(attendanceCreate);
  const recordId = attendanceCreateBody.record.id;
  assert.ok(recordId, "record id should exist");

  const approveDenied = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${recordId}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-1001")
    }),
    { params: Promise.resolve({ recordId }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(approveDenied.status, 403, "manager should be denied by policy gate");

  const approveAllowed = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${recordId}/approve`, {
      method: "POST",
      headers: actorHeaders("admin", "ADM-1001")
    }),
    { params: Promise.resolve({ recordId }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(approveAllowed.status, 200, "admin should pass approval gate");

  const historyResponse = await approvalHistoryRoute.GET(
    new Request(
      `http://localhost/api/approval/stage-history?organizationId=${org.id}&targetEntityType=AttendanceRecord&targetEntityId=${recordId}&limit=10`,
      {
        method: "GET",
        headers: actorHeaders("admin", "ADM-1001")
      }
    )
  );
  assert.equal(historyResponse.status, 200, "stage history query should succeed");
  const historyBody = await readJson<{
    history: Array<{
      allowed: boolean;
      resolution: string;
      requiredRoles: string[];
      targetEntityId: string;
      targetEntityType: string;
    }>;
  }>(historyResponse);
  assert.ok(Array.isArray(historyBody.history), "history should be an array");
  assert.ok(historyBody.history.length >= 2, "history should include deny+allow records");

  const latest = historyBody.history[0];
  const previous = historyBody.history[1];
  assert.equal(latest.targetEntityType, "AttendanceRecord");
  assert.equal(latest.targetEntityId, recordId);
  assert.equal(latest.allowed, true);
  assert.equal(latest.resolution, "PRIVILEGED_BYPASS");
  assert.ok(latest.requiredRoles.includes("admin"));

  assert.equal(previous.targetEntityType, "AttendanceRecord");
  assert.equal(previous.targetEntityId, recordId);
  assert.equal(previous.allowed, false);
  assert.equal(previous.resolution, "DENIED");
  assert.ok(previous.requiredRoles.includes("admin"));

  console.log("e2e-wi0116-approval-stage-history-baseline.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
