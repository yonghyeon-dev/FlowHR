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

type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

function actorHeaders(role: string, actorId: string, organizationId: string) {
  return {
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
  const payslipsRoute = await import("../../src/app/api/payslips/route.ts");
  const payslipDetailRoute = await import("../../src/app/api/payslips/[id]/route.ts");

  resetMemoryDataAccess();

  const organizationA = await memoryDataAccess.organizations.create({ name: "WI0954 Org A" });
  const organizationB = await memoryDataAccess.organizations.create({ name: "WI0954 Org B" });

  const employeeOwnId = "EMP-WI0954-1001";
  const employeeOtherId = "EMP-WI0954-1002";
  const employeeOutsideOrgId = "EMP-WI0954-2001";

  await memoryDataAccess.employees.create({
    id: employeeOwnId,
    organizationId: organizationA.id,
    name: "Alice"
  });
  await memoryDataAccess.employees.create({
    id: employeeOtherId,
    organizationId: organizationA.id,
    name: "Bob"
  });
  await memoryDataAccess.employees.create({
    id: employeeOutsideOrgId,
    organizationId: organizationB.id,
    name: "Carol"
  });

  const runOwnJanPreview = await memoryDataAccess.payroll.create({
    organizationId: organizationA.id,
    employeeId: employeeOwnId,
    periodStart: new Date("2026-01-01T00:00:00+09:00"),
    periodEnd: new Date("2026-01-31T23:59:59+09:00"),
    grossPayKrw: 900000,
    withholdingTaxKrw: 40000,
    socialInsuranceKrw: 70000,
    otherDeductionsKrw: 10000,
    totalDeductionsKrw: 120000,
    netPayKrw: 780000,
    deductionBreakdown: {
      additional: {
        overtimePayKrw: 100000
      }
    },
    sourceRecordCount: 20
  });

  const runOwnJan = await memoryDataAccess.payroll.create({
    organizationId: organizationA.id,
    employeeId: employeeOwnId,
    periodStart: new Date("2026-01-01T00:00:00+09:00"),
    periodEnd: new Date("2026-01-31T23:59:59+09:00"),
    grossPayKrw: 1000000,
    withholdingTaxKrw: 55000,
    socialInsuranceKrw: 80000,
    otherDeductionsKrw: 15000,
    totalDeductionsKrw: 150000,
    netPayKrw: 850000,
    deductionBreakdown: {
      additional: {
        overtimePayKrw: 120000,
        components: {
          incomeTaxKrw: 50000,
          localIncomeTaxKrw: 5000,
          nationalPensionKrw: 40000,
          healthInsuranceKrw: 30000,
          employmentInsuranceKrw: 10000
        }
      }
    },
    sourceRecordCount: 20
  });
  const runOwnJanConfirmed = await memoryDataAccess.payroll.update(runOwnJan.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-02-05T10:00:00+09:00"),
    confirmedBy: "PAY-WI0954"
  });

  const runOtherJan = await memoryDataAccess.payroll.create({
    organizationId: organizationA.id,
    employeeId: employeeOtherId,
    periodStart: new Date("2026-01-01T00:00:00+09:00"),
    periodEnd: new Date("2026-01-31T23:59:59+09:00"),
    grossPayKrw: 1100000,
    withholdingTaxKrw: 60000,
    socialInsuranceKrw: 85000,
    otherDeductionsKrw: 5000,
    totalDeductionsKrw: 150000,
    netPayKrw: 950000,
    sourceRecordCount: 20
  });
  const runOtherJanConfirmed = await memoryDataAccess.payroll.update(runOtherJan.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-02-05T10:00:00+09:00"),
    confirmedBy: "PAY-WI0954"
  });

  const runOwnFeb = await memoryDataAccess.payroll.create({
    organizationId: organizationA.id,
    employeeId: employeeOwnId,
    periodStart: new Date("2026-02-01T00:00:00+09:00"),
    periodEnd: new Date("2026-02-28T23:59:59+09:00"),
    grossPayKrw: 1050000,
    withholdingTaxKrw: 55000,
    socialInsuranceKrw: 82000,
    otherDeductionsKrw: 13000,
    totalDeductionsKrw: 150000,
    netPayKrw: 900000,
    sourceRecordCount: 20
  });
  const runOwnFebConfirmed = await memoryDataAccess.payroll.update(runOwnFeb.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-03-05T10:00:00+09:00"),
    confirmedBy: "PAY-WI0954"
  });

  const runOutsideOrgJan = await memoryDataAccess.payroll.create({
    organizationId: organizationB.id,
    employeeId: employeeOutsideOrgId,
    periodStart: new Date("2026-01-01T00:00:00+09:00"),
    periodEnd: new Date("2026-01-31T23:59:59+09:00"),
    grossPayKrw: 990000,
    withholdingTaxKrw: 50000,
    socialInsuranceKrw: 79000,
    otherDeductionsKrw: 11000,
    totalDeductionsKrw: 140000,
    netPayKrw: 850000,
    sourceRecordCount: 20
  });
  await memoryDataAccess.payroll.update(runOutsideOrgJan.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-02-05T10:00:00+09:00"),
    confirmedBy: "PAY-WI0954"
  });

  const employeeListResponse = await payslipsRoute.GET(
    new Request("http://localhost/api/payslips?period=2026-01", {
      method: "GET",
      headers: actorHeaders("employee", employeeOwnId, organizationA.id)
    })
  );
  assert.equal(employeeListResponse.status, 200, "employee own payslip list should succeed");
  const employeeListBody = await readJson<
    Array<{
      id: string;
      employeeId: string;
      employeeName: string;
      period: string;
      basePay: number;
      overtimePay: number;
      totalDeductions: number;
      netPay: number;
      status: "PREVIEWED" | "CONFIRMED";
      confirmedAt: string | null;
    }>
  >(employeeListResponse);
  assert.equal(employeeListBody.length, 1, "employee should only see own confirmed payslip");
  assert.equal(employeeListBody[0]?.id, runOwnJanConfirmed.id);
  assert.equal(employeeListBody[0]?.employeeId, employeeOwnId);
  assert.equal(employeeListBody[0]?.employeeName, "Alice");
  assert.equal(employeeListBody[0]?.period, "2026-01");
  assert.equal(employeeListBody[0]?.basePay, 1000000);
  assert.equal(employeeListBody[0]?.overtimePay, 120000);
  assert.equal(employeeListBody[0]?.totalDeductions, 150000);
  assert.equal(employeeListBody[0]?.netPay, 850000);
  assert.equal(employeeListBody[0]?.status, "CONFIRMED");
  assert.ok(employeeListBody[0]?.confirmedAt);
  assert.ok(
    !employeeListBody.some((entry) => entry.id === runOwnJanPreview.id),
    "employee list should not include preview runs"
  );
  assert.ok(
    !employeeListBody.some((entry) => entry.id === runOtherJanConfirmed.id),
    "employee list should not include other employees"
  );

  const employeeOwnDetailResponse = await payslipDetailRoute.GET(
    new Request(`http://localhost/api/payslips/${runOwnJanConfirmed.id}`, {
      method: "GET",
      headers: actorHeaders("employee", employeeOwnId, organizationA.id)
    }),
    { params: Promise.resolve({ id: runOwnJanConfirmed.id }) } as RouteContext<{ id: string }>
  );
  assert.equal(employeeOwnDetailResponse.status, 200, "employee should access own payslip");

  const employeeOtherDetailResponse = await payslipDetailRoute.GET(
    new Request(`http://localhost/api/payslips/${runOtherJanConfirmed.id}`, {
      method: "GET",
      headers: actorHeaders("employee", employeeOwnId, organizationA.id)
    }),
    { params: Promise.resolve({ id: runOtherJanConfirmed.id }) } as RouteContext<{ id: string }>
  );
  assert.equal(employeeOtherDetailResponse.status, 403, "employee should be forbidden from other payslip");

  const adminDetailResponse = await payslipDetailRoute.GET(
    new Request(`http://localhost/api/payslips/${runOtherJanConfirmed.id}`, {
      method: "GET",
      headers: actorHeaders("admin", "ADM-WI0954-1001", organizationA.id)
    }),
    { params: Promise.resolve({ id: runOtherJanConfirmed.id }) } as RouteContext<{ id: string }>
  );
  assert.equal(adminDetailResponse.status, 200, "admin should access any payslip in organization");

  const adminJanListResponse = await payslipsRoute.GET(
    new Request("http://localhost/api/payslips?period=2026-01", {
      method: "GET",
      headers: actorHeaders("admin", "ADM-WI0954-1001", organizationA.id)
    })
  );
  assert.equal(adminJanListResponse.status, 200, "admin January filter should succeed");
  const adminJanListBody = await readJson<Array<{ id: string }>>(adminJanListResponse);
  assert.deepEqual(
    adminJanListBody.map((entry) => entry.id).sort(),
    [runOwnJanConfirmed.id, runOtherJanConfirmed.id].sort(),
    "admin January list should return organization A confirmed runs only"
  );

  const adminEmployeeFilterResponse = await payslipsRoute.GET(
    new Request(`http://localhost/api/payslips?period=2026-01&employeeId=${employeeOtherId}`, {
      method: "GET",
      headers: actorHeaders("admin", "ADM-WI0954-1001", organizationA.id)
    })
  );
  assert.equal(adminEmployeeFilterResponse.status, 200, "admin employeeId filter should succeed");
  const adminEmployeeFilterBody = await readJson<Array<{ id: string }>>(adminEmployeeFilterResponse);
  assert.deepEqual(adminEmployeeFilterBody.map((entry) => entry.id), [runOtherJanConfirmed.id]);

  const adminFebruaryResponse = await payslipsRoute.GET(
    new Request("http://localhost/api/payslips?period=2026-02", {
      method: "GET",
      headers: actorHeaders("admin", "ADM-WI0954-1001", organizationA.id)
    })
  );
  assert.equal(adminFebruaryResponse.status, 200, "period filter should return correct month");
  const adminFebruaryBody = await readJson<Array<{ id: string }>>(adminFebruaryResponse);
  assert.deepEqual(adminFebruaryBody.map((entry) => entry.id), [runOwnFebConfirmed.id]);

  const detailBreakdownResponse = await payslipDetailRoute.GET(
    new Request(`http://localhost/api/payslips/${runOwnJanConfirmed.id}`, {
      method: "GET",
      headers: actorHeaders("admin", "ADM-WI0954-1001", organizationA.id)
    }),
    { params: Promise.resolve({ id: runOwnJanConfirmed.id }) } as RouteContext<{ id: string }>
  );
  assert.equal(detailBreakdownResponse.status, 200, "detail should include breakdown payload");
  const detailBreakdownBody = await readJson<{
    id: string;
    items: Array<{ type: string; amount: number }>;
    deductions: Array<{ type: string; amount: number }>;
  }>(detailBreakdownResponse);
  assert.equal(detailBreakdownBody.id, runOwnJanConfirmed.id);
  assert.ok(
    detailBreakdownBody.items.some((item) => item.type === "base_pay" && item.amount === 1000000),
    "detail items should include base pay"
  );
  assert.ok(
    detailBreakdownBody.items.some((item) => item.type === "overtime_pay" && item.amount === 120000),
    "detail items should include overtime pay"
  );
  assert.ok(
    detailBreakdownBody.deductions.some((item) => item.type === "income_tax" && item.amount === 50000),
    "detail deductions should include tax components"
  );
  assert.ok(
    detailBreakdownBody.deductions.some(
      (item) => item.type === "national_pension" && item.amount === 40000
    ),
    "detail deductions should include insurance components"
  );

  console.log("e2e-wi0954-payslip-view.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
