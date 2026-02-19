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

type JsonPayload = Record<string, unknown>;
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

function jsonRequest(
  method: string,
  path: string,
  payload: JsonPayload,
  headers: Record<string, string>
) {
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
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceApproveRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
  );
  const payrollPreviewWithDeductionsRoute = await import(
    "../../src/app/api/payroll/runs/preview-with-deductions/route.ts"
  );
  const payrollRunsRoute = await import("../../src/app/api/payroll/runs/route.ts");
  const payrollConfirmRoute = await import("../../src/app/api/payroll/runs/[runId]/confirm/route.ts");

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_DEDUCTIONS_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_KR_BASELINE_V1 = "true";

  await memoryDataAccess.employees.create({ id: "EMP-SELF-0112" });
  await memoryDataAccess.employees.create({ id: "EMP-OTHER-0112" });

  async function createApprovedAttendance(employeeId: string, date: string) {
    const createResponse = await attendanceCreateRoute.POST(
      jsonRequest(
        "POST",
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: `${date}T09:00:00+09:00`,
          checkOutAt: `${date}T18:00:00+09:00`,
          breakMinutes: 60,
          isHoliday: false
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(createResponse.status, 201);
    const createBody = await readJson<{ record: { id: string } }>(createResponse);

    const approveResponse = await attendanceApproveRoute.POST(
      new Request(`http://localhost/api/attendance/records/${createBody.record.id}/approve`, {
        method: "POST",
        headers: actorHeaders("manager", "MGR-0112")
      }),
      { params: Promise.resolve({ recordId: createBody.record.id }) } as RouteContext<{ recordId: string }>
    );
    assert.equal(approveResponse.status, 200);
  }

  async function previewStatutory(employeeId: string) {
    const response = await payrollPreviewWithDeductionsRoute.POST(
      jsonRequest(
        "POST",
        "/api/payroll/runs/preview-with-deductions",
        {
          periodStart: "2026-02-01T00:00:00+09:00",
          periodEnd: "2026-02-28T23:59:59+09:00",
          employeeId,
          hourlyRateKrw: 12000,
          deductionMode: "statutory_kr_baseline",
          statutory: {
            nonTaxableIncomeKrw: 10000,
            otherDeductionsKrw: 500,
            incomeTaxBrackets: [
              { upToKrw: 50000, rate: 0.06 },
              { upToKrw: null, rate: 0.15 }
            ],
            additionalTaxCreditKrw: 1500,
            dependentCount: 1,
            dependentTaxCreditPerPersonKrw: 1000,
            requireMonthlyBoundary: true
          }
        },
        actorHeaders("payroll_operator", "PAY-0112")
      )
    );
    assert.equal(response.status, 200);
    return await readJson<{
      run: {
        id: string;
        employeeId: string | null;
        state: "PREVIEWED" | "CONFIRMED";
        withholdingTaxKrw: number;
        socialInsuranceKrw: number;
        otherDeductionsKrw: number;
        totalDeductionsKrw: number;
        netPayKrw: number;
        deductionBreakdown: Record<string, unknown>;
      };
    }>(response);
  }

  async function confirmRun(runId: string) {
    const response = await payrollConfirmRoute.POST(
      new Request(`http://localhost/api/payroll/runs/${runId}/confirm`, {
        method: "POST",
        headers: actorHeaders("payroll_operator", "PAY-0112")
      }),
      { params: Promise.resolve({ runId }) } as RouteContext<{ runId: string }>
    );
    assert.equal(response.status, 200);
  }

  await createApprovedAttendance("EMP-SELF-0112", "2026-02-14");
  await createApprovedAttendance("EMP-OTHER-0112", "2026-02-15");

  const selfConfirmedPreview = await previewStatutory("EMP-SELF-0112");
  await confirmRun(selfConfirmedPreview.run.id);
  const selfUnconfirmedPreview = await previewStatutory("EMP-SELF-0112");
  const otherConfirmedPreview = await previewStatutory("EMP-OTHER-0112");
  await confirmRun(otherConfirmedPreview.run.id);

  const selfPayslipListResponse = await payrollRunsRoute.GET(
    new Request(
      "http://localhost/api/payroll/runs?from=2026-02-01T00:00:00+09:00&to=2026-02-28T23:59:59+09:00&employeeId=EMP-SELF-0112",
      {
        method: "GET",
        headers: actorHeaders("employee", "EMP-SELF-0112")
      }
    )
  );
  assert.equal(selfPayslipListResponse.status, 200);
  const selfPayslipListBody = await readJson<{
    runs: Array<{
      id: string;
      employeeId: string | null;
      state: "PREVIEWED" | "CONFIRMED";
      withholdingTaxKrw: number | null;
      socialInsuranceKrw: number | null;
      otherDeductionsKrw: number | null;
      totalDeductionsKrw: number | null;
      netPayKrw: number | null;
      deductionBreakdown: Record<string, unknown> | null;
    }>;
  }>(selfPayslipListResponse);

  assert.equal(selfPayslipListBody.runs.length, 1, "employee must receive only own confirmed run");
  const payslip = selfPayslipListBody.runs[0];
  assert.equal(payslip.id, selfConfirmedPreview.run.id);
  assert.equal(payslip.employeeId, "EMP-SELF-0112");
  assert.equal(payslip.state, "CONFIRMED");
  assert.ok(payslip.withholdingTaxKrw !== null);
  assert.ok(payslip.socialInsuranceKrw !== null);
  assert.ok(payslip.totalDeductionsKrw !== null);
  assert.ok(payslip.netPayKrw !== null);
  const additional = (payslip.deductionBreakdown as { additional?: { taxMethod?: string } } | null)
    ?.additional;
  assert.equal(additional?.taxMethod, "progressive_brackets");
  assert.ok(!selfPayslipListBody.runs.some((run) => run.id === selfUnconfirmedPreview.run.id));
  assert.ok(!selfPayslipListBody.runs.some((run) => run.id === otherConfirmedPreview.run.id));

  const denyPreviewStateResponse = await payrollRunsRoute.GET(
    new Request(
      "http://localhost/api/payroll/runs?from=2026-02-01T00:00:00+09:00&to=2026-02-28T23:59:59+09:00&employeeId=EMP-SELF-0112&state=PREVIEWED",
      {
        method: "GET",
        headers: actorHeaders("employee", "EMP-SELF-0112")
      }
    )
  );
  assert.equal(denyPreviewStateResponse.status, 403);

  const denyOtherEmployeeResponse = await payrollRunsRoute.GET(
    new Request(
      "http://localhost/api/payroll/runs?from=2026-02-01T00:00:00+09:00&to=2026-02-28T23:59:59+09:00&employeeId=EMP-OTHER-0112",
      {
        method: "GET",
        headers: actorHeaders("employee", "EMP-SELF-0112")
      }
    )
  );
  assert.equal(denyOtherEmployeeResponse.status, 403);

  console.log("e2e-wi0112-payslip-statutory-self-service.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
