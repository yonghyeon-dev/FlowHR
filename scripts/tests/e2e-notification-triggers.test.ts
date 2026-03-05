import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

// Disable Discord during tests
delete runtimeEnv.FLOWHR_DISCORD_NOTIFICATION_WEBHOOK;
delete runtimeEnv.FLOWHR_ALERT_DISCORD_WEBHOOK;

// Enable feature flags
runtimeEnv.FLOWHR_FEATURE_LEAVE_SERVICE_V1 = "true";
runtimeEnv.FLOWHR_FEATURE_ATTENDANCE_SERVICE_V1 = "true";

import type { Actor } from "../../src/lib/actor.ts";

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const leaveService = await import("../../src/features/leave/service.ts");

  resetMemoryDataAccess();

  const org = await memoryDataAccess.organizations.create({
    name: "Trigger Test Org"
  });

  await memoryDataAccess.employees.create({
    id: "EMP-TRIG-001",
    organizationId: org.id,
    name: "Trigger Employee"
  });

  // Seed leave balance via ensure (the only available method)
  await memoryDataAccess.leaveBalance.ensure("EMP-TRIG-001", 15);

  const employeeActor: Actor = {
    id: "EMP-TRIG-001",
    role: "employee",
    organizationId: org.id
  };

  const adminActor: Actor = {
    id: "ADMIN-TRIG-001",
    role: "admin",
    organizationId: org.id
  };

  // --- Test: leave request creates NO automatic notification (approver unknown) ---
  const leaveRequest = await leaveService.createLeaveRequest(
    { actor: employeeActor, dataAccess: memoryDataAccess },
    {
      employeeId: "EMP-TRIG-001",
      leaveType: "ANNUAL" as const,
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-04-03")
    }
  );
  assert.ok(leaveRequest.id, "leave request created");

  // --- Test: leave approval creates notification for employee ---
  const { request: approved } = await leaveService.approveLeaveRequest(
    { actor: adminActor, dataAccess: memoryDataAccess },
    leaveRequest.id
  );
  assert.equal(approved.state, "APPROVED");

  // Allow async notification to complete
  await new Promise((resolve) => setTimeout(resolve, 50));

  const afterApproval = await memoryDataAccess.inAppNotifications.list({
    organizationId: org.id,
    recipientId: "EMP-TRIG-001"
  });
  const approvedNotification = afterApproval.find((n) => n.type === "LEAVE_APPROVED");
  assert.ok(approvedNotification, "should have LEAVE_APPROVED notification");
  assert.ok(approvedNotification.body.includes("ANNUAL"));

  // --- Test: leave rejection creates notification for employee ---
  // Create another leave request for rejection
  const leaveRequest2 = await leaveService.createLeaveRequest(
    { actor: employeeActor, dataAccess: memoryDataAccess },
    {
      employeeId: "EMP-TRIG-001",
      leaveType: "ANNUAL" as const,
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-05-02")
    }
  );

  const rejected = await leaveService.rejectLeaveRequest(
    { actor: adminActor, dataAccess: memoryDataAccess },
    leaveRequest2.id,
    "프로젝트 마감"
  );
  assert.equal(rejected.state, "REJECTED");

  await new Promise((resolve) => setTimeout(resolve, 50));

  const afterReject = await memoryDataAccess.inAppNotifications.list({
    organizationId: org.id,
    recipientId: "EMP-TRIG-001"
  });
  const rejectedNotification = afterReject.find((n) => n.type === "LEAVE_REJECTED");
  assert.ok(rejectedNotification, "should have LEAVE_REJECTED notification");
  assert.ok(rejectedNotification.body.includes("프로젝트 마감"));

  console.log("e2e-notification-triggers: ALL PASSED");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
