import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

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

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId
  };
  if (organizationId) {
    headers["x-actor-organization-id"] = organizationId;
  }
  return headers;
}

function jsonRequest(method: string, urlPath: string, payload: unknown, headers: Record<string, string>) {
  return new Request(`http://localhost${urlPath}`, {
    method,
    headers,
    body: JSON.stringify(payload)
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

function expectClose(actual: number, expected: number, message: string) {
  assert.ok(Math.abs(actual - expected) < 0.0000001, `${message}: expected ${expected}, got ${actual}`);
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceApproveRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
  );
  const insuranceSettlementPreviewRoute = await import(
    "../../src/app/api/payroll/runs/preview-insurance-settlement/route.ts"
  );

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_KR_INSURANCE_SETTLEMENT_V1 = "true";

  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollApiSpec, /settlement insuranceRounding/i);
  assert.match(payrollContract, /settlement insurance rounding/i);
  assert.match(payrollTestCases, /Insurance settlement rounding rules/i);

  const organization = await memoryDataAccess.organizations.create({ name: "Org Payroll Insurance Rounding" });
  await memoryDataAccess.employees.create({
    id: "EMP-INS-259",
    organizationId: organization.id,
    name: "Insurance Rounding Employee"
  });

  const attendanceCreateResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-INS-259",
        checkInAt: "2026-02-14T09:00:00+09:00",
        checkOutAt: "2026-02-14T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-INS-259", organization.id)
    )
  );
  assert.equal(attendanceCreateResponse.status, 201);
  const attendanceCreateBody = await readJson<{ record: { id: string } }>(attendanceCreateResponse);

  const attendanceApproveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceCreateBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-INS-259", organization.id)
    }),
    { params: Promise.resolve({ recordId: attendanceCreateBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(attendanceApproveResponse.status, 200);

  const previewPayload = {
    periodStart: "2026-02-01T00:00:00+09:00",
    periodEnd: "2026-02-28T23:59:59+09:00",
    employeeId: "EMP-INS-259",
    hourlyRateKrw: 12000,
    settlement: {
      nonTaxableIncomeKrw: 10000,
      requireMonthlyBoundary: true,
      insuranceRounding: {
        mode: "floor",
        nationalPensionUnitKrw: 10,
        healthInsuranceUnitKrw: 100,
        longTermCareUnitKrw: 10,
        employmentInsuranceUnitKrw: 100,
        industrialAccidentUnitKrw: 100
      },
      priorWithheldKrw: 7900,
      priorEmployerPaidKrw: 9000
    }
  };

  const previewResponse = await insuranceSettlementPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-insurance-settlement",
      previewPayload,
      actorHeaders("payroll_operator", "PAY-INS-259", organization.id)
    )
  );
  assert.equal(previewResponse.status, 200, "insurance settlement preview should succeed");
  const previewBody = await readJson<{
    summary: {
      sourceRecordCount: number;
      grossPayKrw: number;
      taxableBaseKrw: number;
      rounding: {
        mode: string;
        unitsKrw: {
          nationalPensionUnitKrw: number;
          healthInsuranceUnitKrw: number;
          longTermCareUnitKrw: number;
          employmentInsuranceUnitKrw: number;
          industrialAccidentUnitKrw: number;
        };
      };
      rawContributionKrw: {
        employee: {
          nationalPensionKrw: number;
          healthInsuranceKrw: number;
          longTermCareKrw: number;
          employmentInsuranceKrw: number;
        };
        employer: {
          nationalPensionKrw: number;
          healthInsuranceKrw: number;
          longTermCareKrw: number;
          employmentInsuranceKrw: number;
          industrialAccidentKrw: number;
        };
      };
      employeeContributionKrw: {
        nationalPensionKrw: number;
        healthInsuranceKrw: number;
        longTermCareKrw: number;
        employmentInsuranceKrw: number;
        totalKrw: number;
      };
      employerContributionKrw: {
        nationalPensionKrw: number;
        healthInsuranceKrw: number;
        longTermCareKrw: number;
        employmentInsuranceKrw: number;
        industrialAccidentKrw: number;
        totalKrw: number;
      };
      settlementKrw: {
        employeeDeltaKrw: number;
        employerDeltaKrw: number;
        totalDeltaKrw: number;
      };
    };
  }>(previewResponse);

  assert.equal(previewBody.summary.sourceRecordCount, 1);
  assert.equal(previewBody.summary.grossPayKrw, 96000);
  assert.equal(previewBody.summary.taxableBaseKrw, 86000);
  assert.deepEqual(previewBody.summary.rounding, {
    mode: "floor",
    unitsKrw: {
      nationalPensionUnitKrw: 10,
      healthInsuranceUnitKrw: 100,
      longTermCareUnitKrw: 10,
      employmentInsuranceUnitKrw: 100,
      industrialAccidentUnitKrw: 100
    }
  });
  assert.deepEqual(previewBody.summary.employeeContributionKrw, {
    nationalPensionKrw: 3870,
    healthInsuranceKrw: 3000,
    longTermCareKrw: 380,
    employmentInsuranceKrw: 700,
    totalKrw: 7950
  });
  assert.deepEqual(previewBody.summary.employerContributionKrw, {
    nationalPensionKrw: 3870,
    healthInsuranceKrw: 3000,
    longTermCareKrw: 380,
    employmentInsuranceKrw: 900,
    industrialAccidentKrw: 1200,
    totalKrw: 9350
  });
  expectClose(
    previewBody.summary.rawContributionKrw.employee.healthInsuranceKrw,
    3048.7,
    "employee health raw contribution"
  );
  expectClose(
    previewBody.summary.rawContributionKrw.employee.longTermCareKrw,
    388.5,
    "employee long-term-care raw contribution"
  );
  expectClose(
    previewBody.summary.rawContributionKrw.employer.employmentInsuranceKrw,
    989,
    "employer employment-insurance raw contribution"
  );
  assert.deepEqual(previewBody.summary.settlementKrw, {
    priorWithheldKrw: 7900,
    priorEmployerPaidKrw: 9000,
    employeeDeltaKrw: 50,
    employerDeltaKrw: 350,
    totalDeltaKrw: 400
  });

  const replayResponse = await insuranceSettlementPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-insurance-settlement",
      previewPayload,
      actorHeaders("payroll_operator", "PAY-INS-259", organization.id)
    )
  );
  assert.equal(replayResponse.status, 200, "same input replay should remain deterministic");
  const replayBody = await readJson<typeof previewBody>(replayResponse);
  assert.deepEqual(replayBody, previewBody, "same payload should produce deterministic settlement output");

  const invalidUnitResponse = await insuranceSettlementPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-insurance-settlement",
      {
        ...previewPayload,
        settlement: {
          ...previewPayload.settlement,
          insuranceRounding: {
            ...previewPayload.settlement.insuranceRounding,
            healthInsuranceUnitKrw: 0
          }
        }
      },
      actorHeaders("payroll_operator", "PAY-INS-259", organization.id)
    )
  );
  assert.equal(invalidUnitResponse.status, 400, "insurance rounding unit must be positive integer");
}

run()
  .then(() => {
    console.log("e2e-wi0259-payroll-insurance-settlement-rounding-accuracy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
