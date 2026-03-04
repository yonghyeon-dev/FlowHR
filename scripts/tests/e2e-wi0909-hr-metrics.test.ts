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

async function readJson(response: Response) {
  return (await response.json()) as unknown;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const adminMetricsRoute = await import("../../src/app/api/admin/metrics/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0909 Org" });
  const departmentA = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "D-A",
    name: "Department A"
  });
  await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "D-B",
    name: "Department B"
  });

  await memoryDataAccess.employees.create({
    id: "EMP-WI0909-1",
    organizationId: organization.id,
    departmentId: departmentA.id,
    active: true
  });
  await memoryDataAccess.employees.create({
    id: "EMP-WI0909-2",
    organizationId: organization.id,
    departmentId: departmentA.id,
    active: true
  });
  await memoryDataAccess.employees.create({
    id: "EMP-WI0909-3",
    organizationId: organization.id,
    active: true
  });

  const leaveRequest = await memoryDataAccess.leave.create({
    employeeId: "EMP-WI0909-1",
    leaveType: "ANNUAL",
    startDate: new Date(),
    endDate: new Date(),
    days: 1
  });

  await memoryDataAccess.approvals.createExecution({
    organizationId: organization.id,
    domain: "LEAVE",
    targetEntityType: "LEAVE_REQUEST",
    targetEntityId: leaveRequest.id,
    totalStages: 1,
    currentStageIndex: 1,
    state: "PENDING"
  });

  await memoryDataAccess.attendance.create({
    employeeId: "EMP-WI0909-1",
    checkInAt: new Date(),
    checkOutAt: null,
    breakMinutes: 60,
    isHoliday: false
  });

  const benefit = await memoryDataAccess.benefits.createCatalogItem({
    organizationId: organization.id,
    name: "WI-0909 Benefit",
    description: "metrics",
    annualLimitKrw: 500000,
    status: "ACTIVE"
  });
  await memoryDataAccess.benefits.createRequest({
    organizationId: organization.id,
    benefitId: benefit.id,
    employeeId: "EMP-WI0909-2",
    amountKrw: 100000,
    reason: "metrics test",
    requestedAt: new Date()
  });

  await memoryDataAccess.recruitment.createOpening({
    organizationId: organization.id,
    title: "WI-0909 Recruiter",
    department: "People",
    employmentType: "FULL_TIME",
    status: "OPEN"
  });

  const adminHeaders = actorHeaders("admin", "ADM-WI0909-1", organization.id);
  const employeeHeaders = actorHeaders("employee", "EMP-WI0909-1", organization.id);

  const metricsResponse = await adminMetricsRoute.GET(
    new Request("http://localhost/api/admin/metrics", {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(metricsResponse.status, 200, "admin metrics should be readable by admin");
  const metricsBody = (await readJson(metricsResponse)) as {
    headcount: number;
    departmentCount: number;
    pendingLeaveRequests: number;
    pendingApprovals: number;
    todayAttendanceCount: number;
    activeBenefitRequests: number;
    openRecruitmentOpenings: number;
  };
  assert.equal(metricsBody.headcount, 3, "headcount should be 3");
  assert.equal(metricsBody.departmentCount, 2, "department count should be 2");
  assert.equal(metricsBody.pendingLeaveRequests, 1, "pending leave requests should be 1");
  assert.equal(metricsBody.pendingApprovals, 1, "pending approvals should be 1");
  assert.equal(metricsBody.todayAttendanceCount, 1, "today attendance count should be 1");
  assert.equal(metricsBody.activeBenefitRequests, 1, "active benefit requests should be 1");
  assert.equal(metricsBody.openRecruitmentOpenings, 1, "open recruitment openings should be 1");

  const forbiddenResponse = await adminMetricsRoute.GET(
    new Request("http://localhost/api/admin/metrics", {
      method: "GET",
      headers: employeeHeaders
    })
  );
  assert.equal(forbiddenResponse.status, 403, "employee role should be forbidden from admin metrics");
}

run()
  .then(() => {
    console.log("e2e-wi0909-hr-metrics.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
