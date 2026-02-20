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

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    ...(organizationId ? { "x-actor-organization-id": organizationId } : {})
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
  const leavePolicyRoute = await import("../../src/app/api/leave/policy/route.ts");
  const leavePromotionPreviewRoute = await import(
    "../../src/app/api/leave/policy/promotion-preview/route.ts"
  );

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "Org Leave Promotion" });
  const employeeA = "EMP-PROMO-001";
  const employeeB = "EMP-PROMO-002";
  await memoryDataAccess.employees.create({
    id: employeeA,
    organizationId: organization.id,
    name: "Employee A",
    email: "a@example.com"
  });
  await memoryDataAccess.employees.create({
    id: employeeB,
    organizationId: organization.id,
    name: "Employee B",
    email: "b@example.com"
  });

  await memoryDataAccess.leaveBalance.ensure(employeeA, 15);
  await memoryDataAccess.leaveBalance.ensure(employeeB, 15);
  await memoryDataAccess.leaveBalance.applyUsage({
    employeeId: employeeA,
    usedDaysDelta: 4,
    defaultGrantedDays: 15
  });
  await memoryDataAccess.leaveBalance.applyUsage({
    employeeId: employeeB,
    usedDaysDelta: 12,
    defaultGrantedDays: 15
  });

  const savePolicyResponse = await leavePolicyRoute.PUT(
    jsonRequest(
      "PUT",
      "/api/leave/policy",
      {
        organizationId: organization.id,
        annualGrantDays: 15,
        carryOverCapDays: 5,
        allowHalfDay: true,
        allowHourly: true,
        hourlyIncrementMinutes: 30,
        maxHoursPerRequest: 8,
        minNoticeDays: 0,
        maxConsecutiveDays: null,
        annualLeavePromotionEnabled: true,
        annualLeavePromotionThresholdDays: 5,
        annualLeavePromotionLeadDays: 30,
        annualLeavePromotionMessageTemplate:
          "Promotion {year}: threshold {thresholdDays}, targets {targetCount}, window {noticeWindowStart}~{noticeWindowEnd}"
      },
      actorHeaders("payroll_operator", "PAY-1200", organization.id)
    )
  );
  assert.equal(savePolicyResponse.status, 200, "leave policy save should succeed");

  const upcomingPreviewResponse = await leavePromotionPreviewRoute.GET(
    new Request(
      `http://localhost/api/leave/policy/promotion-preview?organizationId=${organization.id}&asOf=${encodeURIComponent(
        "2026-01-10T00:00:00.000Z"
      )}&includeUpcoming=true`,
      {
        method: "GET",
        headers: actorHeaders("manager", "MGR-1200", organization.id)
      }
    )
  );
  assert.equal(upcomingPreviewResponse.status, 200, "preview with includeUpcoming should succeed");
  const upcomingPreviewBody = await readJson<{
    noticeWindow: { isOpen: boolean };
    summary: { potentialTargetCount: number; displayTargetCount: number; eligibleNowCount: number };
    targets: Array<{ employeeId: string; eligibleNow: boolean; remainingDays: number }>;
    announcementDraft: { body: string };
  }>(upcomingPreviewResponse);
  assert.equal(upcomingPreviewBody.noticeWindow.isOpen, false, "window should be closed in January");
  assert.equal(upcomingPreviewBody.summary.potentialTargetCount, 1);
  assert.equal(upcomingPreviewBody.summary.displayTargetCount, 1);
  assert.equal(upcomingPreviewBody.summary.eligibleNowCount, 0);
  assert.equal(upcomingPreviewBody.targets.length, 1);
  assert.equal(upcomingPreviewBody.targets[0]?.employeeId, employeeA);
  assert.equal(upcomingPreviewBody.targets[0]?.eligibleNow, false);
  assert.equal(upcomingPreviewBody.targets[0]?.remainingDays, 11);
  assert.ok(
    upcomingPreviewBody.announcementDraft.body.includes("targets 1"),
    "template placeholders should be rendered"
  );

  const currentOnlyPreviewResponse = await leavePromotionPreviewRoute.GET(
    new Request(
      `http://localhost/api/leave/policy/promotion-preview?organizationId=${organization.id}&asOf=${encodeURIComponent(
        "2026-01-10T00:00:00.000Z"
      )}&includeUpcoming=false`,
      {
        method: "GET",
        headers: actorHeaders("manager", "MGR-1200", organization.id)
      }
    )
  );
  assert.equal(currentOnlyPreviewResponse.status, 200, "current-only preview should succeed");
  const currentOnlyBody = await readJson<{
    summary: { potentialTargetCount: number; displayTargetCount: number; eligibleNowCount: number };
    targets: Array<{ employeeId: string }>;
  }>(currentOnlyPreviewResponse);
  assert.equal(currentOnlyBody.summary.potentialTargetCount, 1);
  assert.equal(currentOnlyBody.summary.displayTargetCount, 0);
  assert.equal(currentOnlyBody.summary.eligibleNowCount, 0);
  assert.equal(currentOnlyBody.targets.length, 0);

  const openWindowPreviewResponse = await leavePromotionPreviewRoute.GET(
    new Request(
      `http://localhost/api/leave/policy/promotion-preview?organizationId=${organization.id}&asOf=${encodeURIComponent(
        "2026-12-15T00:00:00.000Z"
      )}&includeUpcoming=false`,
      {
        method: "GET",
        headers: actorHeaders("manager", "MGR-1200", organization.id)
      }
    )
  );
  assert.equal(openWindowPreviewResponse.status, 200, "window-open preview should succeed");
  const openWindowBody = await readJson<{
    noticeWindow: { isOpen: boolean };
    summary: { displayTargetCount: number; eligibleNowCount: number };
    targets: Array<{ employeeId: string; eligibleNow: boolean }>;
  }>(openWindowPreviewResponse);
  assert.equal(openWindowBody.noticeWindow.isOpen, true);
  assert.equal(openWindowBody.summary.displayTargetCount, 1);
  assert.equal(openWindowBody.summary.eligibleNowCount, 1);
  assert.equal(openWindowBody.targets.length, 1);
  assert.equal(openWindowBody.targets[0]?.employeeId, employeeA);
  assert.equal(openWindowBody.targets[0]?.eligibleNow, true);

  const disablePolicyResponse = await leavePolicyRoute.PUT(
    jsonRequest(
      "PUT",
      "/api/leave/policy",
      {
        organizationId: organization.id,
        annualGrantDays: 15,
        carryOverCapDays: 5,
        annualLeavePromotionEnabled: false
      },
      actorHeaders("payroll_operator", "PAY-1200", organization.id)
    )
  );
  assert.equal(disablePolicyResponse.status, 200, "policy disable should succeed");

  const disabledPreviewResponse = await leavePromotionPreviewRoute.GET(
    new Request(
      `http://localhost/api/leave/policy/promotion-preview?organizationId=${organization.id}&asOf=${encodeURIComponent(
        "2026-12-15T00:00:00.000Z"
      )}&includeUpcoming=true`,
      {
        method: "GET",
        headers: actorHeaders("manager", "MGR-1200", organization.id)
      }
    )
  );
  assert.equal(disabledPreviewResponse.status, 200, "disabled policy preview should succeed");
  const disabledPreviewBody = await readJson<{
    policy: { enabled: boolean };
    summary: { potentialTargetCount: number; displayTargetCount: number; eligibleNowCount: number };
    targets: Array<{ employeeId: string }>;
  }>(disabledPreviewResponse);
  assert.equal(disabledPreviewBody.policy.enabled, false);
  assert.equal(disabledPreviewBody.summary.potentialTargetCount, 0);
  assert.equal(disabledPreviewBody.summary.displayTargetCount, 0);
  assert.equal(disabledPreviewBody.summary.eligibleNowCount, 0);
  assert.equal(disabledPreviewBody.targets.length, 0);

  console.log("e2e-wi0120-leave-promotion-preview.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
