import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

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
  const notificationsRoute = await import("../../src/app/api/notifications/route.ts");
  const readRoute = await import("../../src/app/api/notifications/[notificationId]/read/route.ts");
  const markAllReadRoute = await import("../../src/app/api/notifications/mark-all-read/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({
    name: "WI-0926 Notification Center Org"
  });
  const employeeId = "EMP-WI0926-1001";
  const otherEmployeeId = "EMP-WI0926-1002";

  await memoryDataAccess.employees.create({
    id: employeeId,
    organizationId: organization.id,
    name: "Employee WI-0926"
  });
  await memoryDataAccess.employees.create({
    id: otherEmployeeId,
    organizationId: organization.id,
    name: "Other Employee WI-0926"
  });

  await memoryDataAccess.inAppNotifications.create({
    id: "IAPN-WI0926-0001",
    organizationId: organization.id,
    recipientId: employeeId,
    type: "leave_approved",
    title: "Leave approved",
    body: "Your leave request has been approved.",
    createdAt: "2026-03-05T00:00:00.000Z"
  });
  await memoryDataAccess.inAppNotifications.create({
    id: "IAPN-WI0926-0002",
    organizationId: organization.id,
    recipientId: employeeId,
    type: "payslip_ready",
    title: "Payslip ready",
    body: "Your payslip is ready.",
    createdAt: "2026-03-05T01:00:00.000Z"
  });
  await memoryDataAccess.inAppNotifications.create({
    id: "IAPN-WI0926-0003",
    organizationId: organization.id,
    recipientId: employeeId,
    type: "attendance_anomaly",
    title: "Attendance anomaly",
    body: "An anomaly has been detected.",
    createdAt: "2026-03-05T02:00:00.000Z"
  });
  await memoryDataAccess.inAppNotifications.create({
    id: "IAPN-WI0926-0004",
    organizationId: organization.id,
    recipientId: otherEmployeeId,
    type: "system",
    title: "System notice",
    body: "This is another user's notification.",
    createdAt: "2026-03-05T03:00:00.000Z"
  });

  const actor1Headers = actorHeaders("employee", employeeId, organization.id);
  const actor2Headers = actorHeaders("employee", otherEmployeeId, organization.id);

  const listResponse = await notificationsRoute.GET(
    new Request("http://localhost/api/notifications", {
      method: "GET",
      headers: actor1Headers
    })
  );
  assert.equal(listResponse.status, 200, "GET /api/notifications should succeed");
  const listBody = await readJson<{
    notifications: Array<{ id: string; recipientId: string; isRead: boolean }>;
  }>(listResponse);
  assert.equal(listBody.notifications.length, 3, "should return only own notifications");
  assert.deepEqual(
    listBody.notifications.map((notification) => notification.id),
    ["IAPN-WI0926-0003", "IAPN-WI0926-0002", "IAPN-WI0926-0001"],
    "notifications should be sorted by createdAt desc"
  );
  assert.ok(
    listBody.notifications.every((notification) => notification.recipientId === employeeId),
    "notifications should be scoped to actor"
  );
  assert.ok(
    listBody.notifications.every((notification) => notification.isRead === false),
    "seeded notifications should be unread"
  );

  const unreadListResponse = await notificationsRoute.GET(
    new Request("http://localhost/api/notifications?unreadOnly=true", {
      method: "GET",
      headers: actor1Headers
    })
  );
  assert.equal(unreadListResponse.status, 200, "GET unread-only should succeed");
  const unreadListBody = await readJson<{
    notifications: Array<{ id: string; isRead: boolean }>;
  }>(unreadListResponse);
  assert.equal(unreadListBody.notifications.length, 3, "all should be unread initially");

  const markOneReadResponse = await readRoute.PATCH(
    new Request("http://localhost/api/notifications/IAPN-WI0926-0003/read", {
      method: "PATCH",
      headers: actor1Headers
    }),
    {
      params: Promise.resolve({ notificationId: "IAPN-WI0926-0003" })
    } as RouteContext<{ notificationId: string }>
  );
  assert.equal(markOneReadResponse.status, 200, "PATCH read should succeed for owner");
  const markOneReadBody = await readJson<{
    notification: { id: string; isRead: boolean; readAt?: string };
  }>(markOneReadResponse);
  assert.equal(markOneReadBody.notification.id, "IAPN-WI0926-0003");
  assert.equal(markOneReadBody.notification.isRead, true);
  assert.ok(markOneReadBody.notification.readAt, "read notification should include readAt");

  const unreadAfterSingleReadResponse = await notificationsRoute.GET(
    new Request("http://localhost/api/notifications?unreadOnly=true", {
      method: "GET",
      headers: actor1Headers
    })
  );
  assert.equal(unreadAfterSingleReadResponse.status, 200);
  const unreadAfterSingleReadBody = await readJson<{
    notifications: Array<{ id: string; isRead: boolean }>;
  }>(unreadAfterSingleReadResponse);
  assert.deepEqual(
    unreadAfterSingleReadBody.notifications.map((notification) => notification.id),
    ["IAPN-WI0926-0002", "IAPN-WI0926-0001"],
    "read notification should be excluded from unread list"
  );

  const markAllReadResponse = await markAllReadRoute.POST(
    new Request("http://localhost/api/notifications/mark-all-read", {
      method: "POST",
      headers: actor1Headers
    })
  );
  assert.equal(markAllReadResponse.status, 200, "POST mark-all-read should succeed");
  const markAllReadBody = await readJson<{ count: number }>(markAllReadResponse);
  assert.equal(markAllReadBody.count, 2, "should mark remaining unread notifications as read");

  const unreadAfterMarkAllResponse = await notificationsRoute.GET(
    new Request("http://localhost/api/notifications?unreadOnly=true", {
      method: "GET",
      headers: actor1Headers
    })
  );
  assert.equal(unreadAfterMarkAllResponse.status, 200);
  const unreadAfterMarkAllBody = await readJson<{
    notifications: Array<{ id: string; isRead: boolean }>;
  }>(unreadAfterMarkAllResponse);
  assert.equal(unreadAfterMarkAllBody.notifications.length, 0, "all notifications should be read");

  const listAfterMarkAllResponse = await notificationsRoute.GET(
    new Request("http://localhost/api/notifications", {
      method: "GET",
      headers: actor1Headers
    })
  );
  assert.equal(listAfterMarkAllResponse.status, 200);
  const listAfterMarkAllBody = await readJson<{
    notifications: Array<{ id: string; isRead: boolean }>;
  }>(listAfterMarkAllResponse);
  assert.equal(listAfterMarkAllBody.notifications.length, 3);
  assert.ok(
    listAfterMarkAllBody.notifications.every((notification) => notification.isRead),
    "all own notifications should be marked as read"
  );

  const forbiddenResponse = await readRoute.PATCH(
    new Request("http://localhost/api/notifications/IAPN-WI0926-0003/read", {
      method: "PATCH",
      headers: actor2Headers
    }),
    {
      params: Promise.resolve({ notificationId: "IAPN-WI0926-0003" })
    } as RouteContext<{ notificationId: string }>
  );
  assert.equal(forbiddenResponse.status, 403, "other users must not access someone else's notification");

  const otherUserUnreadResponse = await notificationsRoute.GET(
    new Request("http://localhost/api/notifications?unreadOnly=true", {
      method: "GET",
      headers: actor2Headers
    })
  );
  assert.equal(otherUserUnreadResponse.status, 200);
  const otherUserUnreadBody = await readJson<{
    notifications: Array<{ id: string; isRead: boolean }>;
  }>(otherUserUnreadResponse);
  assert.deepEqual(
    otherUserUnreadBody.notifications.map((notification) => notification.id),
    ["IAPN-WI0926-0004"],
    "other user notifications should remain isolated"
  );
}

run()
  .then(() => {
    console.log("e2e-wi0926-notification-center.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
