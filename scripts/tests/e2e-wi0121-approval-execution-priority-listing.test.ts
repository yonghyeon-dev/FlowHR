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
  const { memoryDataAccess, resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const approvalExecutionsRoute = await import("../../src/app/api/approval/executions/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "Org Approval Priority" });
  const organizationId = organization.id;

  const baseTime = new Date();
  const asOf = new Date(baseTime.getTime() + 3 * 60 * 60 * 1000);
  const asOfIso = asOf.toISOString();

  await memoryDataAccess.approvals.createExecution({
    organizationId,
    domain: "ATTENDANCE",
    targetEntityType: "AttendanceRecord",
    targetEntityId: "AR-PRIORITY-001",
    totalStages: 2,
    currentStageIndex: 1,
    state: "PENDING",
    startedAt: new Date(baseTime.getTime() - 60 * 60 * 1000)
  });

  await new Promise((resolve) => setTimeout(resolve, 20));

  await memoryDataAccess.approvals.createExecution({
    organizationId,
    domain: "PAYROLL",
    targetEntityType: "PayrollRun",
    targetEntityId: "PR-PRIORITY-001",
    totalStages: 2,
    currentStageIndex: 1,
    state: "PENDING",
    startedAt: new Date(baseTime.getTime() - 45 * 60 * 1000)
  });

  await new Promise((resolve) => setTimeout(resolve, 20));

  await memoryDataAccess.approvals.createExecution({
    organizationId,
    domain: "LEAVE",
    targetEntityType: "LeaveRequest",
    targetEntityId: "LR-PRIORITY-001",
    totalStages: 2,
    currentStageIndex: 2,
    state: "APPROVED",
    startedAt: new Date(baseTime.getTime() - 30 * 60 * 1000),
    completedAt: new Date(baseTime.getTime() - 10 * 60 * 1000)
  });

  const priorityResponse = await approvalExecutionsRoute.GET(
    new Request(
      `http://localhost/api/approval/executions?organizationId=${organizationId}&sort=priority_desc&asOf=${encodeURIComponent(
        asOfIso
      )}&stalledHoursMin=1`,
      {
        method: "GET",
        headers: actorHeaders("admin", "ADM-0121", organizationId)
      }
    )
  );
  assert.equal(priorityResponse.status, 200, "priority list query should succeed");
  const priorityBody = await readJson<{
    executions: Array<{ domain: string; state: string; targetEntityId: string }>;
  }>(priorityResponse);
  assert.equal(priorityBody.executions.length, 2, "stalled filter should keep only pending rows");
  assert.equal(priorityBody.executions[0]?.domain, "PAYROLL", "payroll pending should rank highest");
  assert.equal(priorityBody.executions[1]?.domain, "ATTENDANCE");

  const priorityNoFilterResponse = await approvalExecutionsRoute.GET(
    new Request(
      `http://localhost/api/approval/executions?organizationId=${organizationId}&sort=priority_desc&asOf=${encodeURIComponent(
        asOfIso
      )}`,
      {
        method: "GET",
        headers: actorHeaders("admin", "ADM-0121", organizationId)
      }
    )
  );
  assert.equal(priorityNoFilterResponse.status, 200);
  const priorityNoFilterBody = await readJson<{
    executions: Array<{ domain: string; state: string; targetEntityId: string }>;
  }>(priorityNoFilterResponse);
  assert.equal(priorityNoFilterBody.executions.length, 3);
  assert.equal(priorityNoFilterBody.executions[0]?.domain, "PAYROLL");
  assert.equal(priorityNoFilterBody.executions[1]?.domain, "ATTENDANCE");
  assert.equal(priorityNoFilterBody.executions[2]?.state, "APPROVED");

  const updatedDescResponse = await approvalExecutionsRoute.GET(
    new Request(
      `http://localhost/api/approval/executions?organizationId=${organizationId}&sort=updated_desc`,
      {
        method: "GET",
        headers: actorHeaders("admin", "ADM-0121", organizationId)
      }
    )
  );
  assert.equal(updatedDescResponse.status, 200);
  const updatedDescBody = await readJson<{
    executions: Array<{ targetEntityId: string }>;
  }>(updatedDescResponse);
  assert.equal(
    updatedDescBody.executions[0]?.targetEntityId,
    "LR-PRIORITY-001",
    "updated_desc should keep latest-updated row first"
  );

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("approval.execution.listed"), "audit should include approval.execution.listed");

  console.log("e2e-wi0121-approval-execution-priority-listing.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
