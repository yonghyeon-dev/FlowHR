import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

function actorHeaders(role: string, actorId: string, organizationId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    "x-actor-organization-id": organizationId
  };
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const unreadCountRoute = await import(
    "../../src/app/api/notifications/unread-count/route.ts"
  );

  resetMemoryDataAccess();

  const org = await memoryDataAccess.organizations.create({
    name: "Badge Test Org"
  });
  const employeeId = "EMP-BADGE-001";

  await memoryDataAccess.employees.create({
    id: employeeId,
    organizationId: org.id,
    name: "Badge Employee"
  });

  const headers = actorHeaders("employee", employeeId, org.id);

  // --- Test: empty count ---
  const emptyResponse = await unreadCountRoute.GET(
    new Request("http://localhost/api/notifications/unread-count", {
      method: "GET",
      headers
    })
  );
  assert.equal(emptyResponse.status, 200);
  const emptyBody = await readJson<{ count: number }>(emptyResponse);
  assert.equal(emptyBody.count, 0, "should be 0 when no notifications");

  // --- Create notifications ---
  await memoryDataAccess.inAppNotifications.create({
    organizationId: org.id,
    recipientId: employeeId,
    type: "LEAVE_APPROVED",
    title: "Leave approved",
    body: "Approved."
  });
  await memoryDataAccess.inAppNotifications.create({
    organizationId: org.id,
    recipientId: employeeId,
    type: "PAYSLIP_READY",
    title: "Payslip ready",
    body: "Ready."
  });
  await memoryDataAccess.inAppNotifications.create({
    organizationId: org.id,
    recipientId: employeeId,
    type: "ATTENDANCE_REJECTED",
    title: "Attendance rejected",
    body: "Rejected.",
    isRead: true,
    readAt: new Date().toISOString()
  });

  // --- Test: count reflects unread only ---
  const countResponse = await unreadCountRoute.GET(
    new Request("http://localhost/api/notifications/unread-count", {
      method: "GET",
      headers
    })
  );
  assert.equal(countResponse.status, 200);
  const countBody = await readJson<{ count: number }>(countResponse);
  assert.equal(countBody.count, 2, "should count only unread notifications");

  // --- Test: unauthorized ---
  const noAuthResponse = await unreadCountRoute.GET(
    new Request("http://localhost/api/notifications/unread-count", {
      method: "GET",
      headers: { "content-type": "application/json" }
    })
  );
  assert.equal(noAuthResponse.status, 401, "should be 401 without actor");

  // --- Test: other user sees 0 ---
  const otherHeaders = actorHeaders("employee", "EMP-BADGE-999", org.id);
  const otherResponse = await unreadCountRoute.GET(
    new Request("http://localhost/api/notifications/unread-count", {
      method: "GET",
      headers: otherHeaders
    })
  );
  assert.equal(otherResponse.status, 200);
  const otherBody = await readJson<{ count: number }>(otherResponse);
  assert.equal(otherBody.count, 0, "other user should see 0 unread");

  console.log("e2e-notification-badge: ALL PASSED");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
