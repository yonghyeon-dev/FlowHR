import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

// Ensure no Discord webhook during tests
delete runtimeEnv.FLOWHR_DISCORD_NOTIFICATION_WEBHOOK;
delete runtimeEnv.FLOWHR_ALERT_DISCORD_WEBHOOK;

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );

  resetMemoryDataAccess();

  const org = await memoryDataAccess.organizations.create({
    name: "Notification Service Test Org"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-NS-001",
    organizationId: org.id,
    name: "Test Employee"
  });

  // --- Test: dispatchNotification creates InApp record ---
  const { dispatchNotification } = await import(
    "../../src/features/notifications/service.ts"
  );

  const result = await dispatchNotification(
    { dataAccess: memoryDataAccess },
    {
      organizationId: org.id,
      recipientId: "EMP-NS-001",
      type: "LEAVE_APPROVED",
      title: "휴가 승인",
      body: "연차 휴가가 승인되었습니다."
    }
  );

  assert.ok(result.inApp, "should create InApp notification");
  assert.equal(result.inApp.organizationId, org.id);
  assert.equal(result.inApp.recipientId, "EMP-NS-001");
  assert.equal(result.inApp.type, "LEAVE_APPROVED");
  assert.equal(result.inApp.title, "휴가 승인");
  assert.equal(result.inApp.isRead, false);
  assert.equal(result.discordSent, false, "no webhook configured → discordSent=false");

  // --- Test: domain helper notifyLeaveApproved ---
  const { notifyLeaveApproved } = await import(
    "../../src/features/notifications/service.ts"
  );

  const leaveResult = await notifyLeaveApproved(
    { dataAccess: memoryDataAccess },
    {
      organizationId: org.id,
      employeeId: "EMP-NS-001",
      leaveType: "ANNUAL",
      startDate: "2026-03-10",
      endDate: "2026-03-12"
    }
  );

  assert.ok(leaveResult.inApp);
  assert.equal(leaveResult.inApp.type, "LEAVE_APPROVED");
  assert.ok(leaveResult.inApp.body.includes("ANNUAL"));
  assert.ok(leaveResult.inApp.body.includes("2026-03-10"));

  // --- Test: domain helper notifyLeaveRejected ---
  const { notifyLeaveRejected } = await import(
    "../../src/features/notifications/service.ts"
  );

  const rejectResult = await notifyLeaveRejected(
    { dataAccess: memoryDataAccess },
    {
      organizationId: org.id,
      employeeId: "EMP-NS-001",
      leaveType: "ANNUAL",
      reason: "인력 부족"
    }
  );

  assert.ok(rejectResult.inApp);
  assert.equal(rejectResult.inApp.type, "LEAVE_REJECTED");
  assert.ok(rejectResult.inApp.body.includes("인력 부족"));

  // --- Test: domain helper notifyAttendanceApproved ---
  const { notifyAttendanceApproved } = await import(
    "../../src/features/notifications/service.ts"
  );

  const attResult = await notifyAttendanceApproved(
    { dataAccess: memoryDataAccess },
    {
      organizationId: org.id,
      employeeId: "EMP-NS-001"
    }
  );

  assert.ok(attResult.inApp);
  assert.equal(attResult.inApp.type, "ATTENDANCE_APPROVED");

  // --- Test: domain helper notifyAttendanceRejected ---
  const { notifyAttendanceRejected } = await import(
    "../../src/features/notifications/service.ts"
  );

  const attRejectResult = await notifyAttendanceRejected(
    { dataAccess: memoryDataAccess },
    {
      organizationId: org.id,
      employeeId: "EMP-NS-001",
      reason: "출근 시간 불일치"
    }
  );

  assert.ok(attRejectResult.inApp);
  assert.equal(attRejectResult.inApp.type, "ATTENDANCE_REJECTED");
  assert.ok(attRejectResult.inApp.body.includes("출근 시간 불일치"));

  // --- Test: domain helper notifyPayslipReady ---
  const { notifyPayslipReady } = await import(
    "../../src/features/notifications/service.ts"
  );

  const payslipResult = await notifyPayslipReady(
    { dataAccess: memoryDataAccess },
    {
      organizationId: org.id,
      employeeId: "EMP-NS-001",
      periodLabel: "2026년 03월"
    }
  );

  assert.ok(payslipResult.inApp);
  assert.equal(payslipResult.inApp.type, "PAYSLIP_READY");
  assert.ok(payslipResult.inApp.body.includes("2026년 03월"));

  // --- Verify all records created ---
  const allNotifications = await memoryDataAccess.inAppNotifications.list({
    organizationId: org.id,
    recipientId: "EMP-NS-001"
  });

  assert.equal(allNotifications.length, 6, "should have 6 notifications total");

  console.log("e2e-notification-service: ALL PASSED");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
