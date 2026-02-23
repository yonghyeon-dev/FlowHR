import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";

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

function jsonRequest(method: string, path: string, payload: JsonPayload, headers: Record<string, string>) {
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: JSON.stringify(payload)
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
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

  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollApiSpec, /incomeTaxLookupPresetAuto/);
  assert.match(payrollApiSpec, /incomeTaxLookupAsOf/);
  assert.match(payrollContract, /incomeTaxLookupPresetAuto/);
  assert.match(payrollContract, /effective date reference/i);
  assert.match(payrollTestCases, /preset auto-selection/i);

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_DEDUCTIONS_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_KR_BASELINE_V1 = "true";

  await memoryDataAccess.employees.create({ id: "EMP-3282" });

  const createResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-3282",
        checkInAt: "2026-08-14T09:00:00+09:00",
        checkOutAt: "2026-08-14T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-3282")
    )
  );
  assert.equal(createResponse.status, 201);
  const createdBody = await readJson<{ record: { id: string } }>(createResponse);

  const approveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-3282")
    }),
    { params: Promise.resolve({ recordId: createdBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(approveResponse.status, 200);

  const basePayload = {
    periodStart: "2026-08-01T00:00:00+09:00",
    periodEnd: "2026-08-31T23:59:59+09:00",
    employeeId: "EMP-3282",
    hourlyRateKrw: 12000,
    deductionMode: "statutory_kr_baseline",
    statutory: {
      nonTaxableIncomeKrw: 10000,
      otherDeductionsKrw: 500,
      additionalTaxCreditKrw: 0,
      dependentCount: 0,
      dependentTaxCreditPerPersonKrw: 0,
      incomeTaxLookupPresetAuto: true
    }
  };

  const explicitAsOfResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        ...basePayload,
        statutory: {
          ...basePayload.statutory,
          incomeTaxLookupAsOf: "2026-02-28T23:59:59+09:00"
        }
      },
      actorHeaders("payroll_operator", "PAY-3282")
    )
  );
  assert.equal(explicitAsOfResponse.status, 200, "asOf-based auto preset preview should succeed");
  const explicitAsOfBody = await readJson<{
    summary: {
      deductionBreakdown: {
        additional: {
          selectedIncomeTaxLookupRow: { upToKrw: number | null; taxKrw: number } | null;
          incomeTaxLookupPreset: { id: string } | null;
          incomeTaxLookupPresetAuto: {
            enabled: boolean;
            autoSelected: boolean;
            resolvedBy: string;
            asOf: string;
          };
        };
      };
    };
  }>(explicitAsOfResponse);
  assert.equal(
    explicitAsOfBody.summary.deductionBreakdown.additional.incomeTaxLookupPreset?.id,
    "kr_simple_monthly_v2026_01"
  );
  assert.deepEqual(explicitAsOfBody.summary.deductionBreakdown.additional.selectedIncomeTaxLookupRow, {
    upToKrw: 100000,
    taxKrw: 7200
  });
  assert.deepEqual(explicitAsOfBody.summary.deductionBreakdown.additional.incomeTaxLookupPresetAuto, {
    enabled: true,
    autoSelected: true,
    resolvedBy: "statutory.incomeTaxLookupAsOf",
    asOf: "2026-02-28T14:59:59.000Z"
  });

  const periodEndBasedResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      basePayload,
      actorHeaders("payroll_operator", "PAY-3282")
    )
  );
  assert.equal(periodEndBasedResponse.status, 200, "periodEnd-based auto preset preview should succeed");
  const periodEndBasedBody = await readJson<{
    summary: {
      deductionBreakdown: {
        additional: {
          selectedIncomeTaxLookupRow: { upToKrw: number | null; taxKrw: number } | null;
          incomeTaxLookupPreset: { id: string } | null;
          incomeTaxLookupPresetAuto: {
            enabled: boolean;
            autoSelected: boolean;
            resolvedBy: string;
            asOf: string;
          };
        };
      };
    };
  }>(periodEndBasedResponse);
  assert.equal(
    periodEndBasedBody.summary.deductionBreakdown.additional.incomeTaxLookupPreset?.id,
    "kr_simple_monthly_v2026_07"
  );
  assert.deepEqual(periodEndBasedBody.summary.deductionBreakdown.additional.selectedIncomeTaxLookupRow, {
    upToKrw: 100000,
    taxKrw: 7600
  });
  assert.deepEqual(periodEndBasedBody.summary.deductionBreakdown.additional.incomeTaxLookupPresetAuto, {
    enabled: true,
    autoSelected: true,
    resolvedBy: "periodEnd",
    asOf: "2026-08-31T14:59:59.000Z"
  });

  const mixedModeResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        ...basePayload,
        statutory: {
          ...basePayload.statutory,
          incomeTaxLookupPresetId: "kr_simple_monthly_v2026_01"
        }
      },
      actorHeaders("payroll_operator", "PAY-3282")
    )
  );
  assert.equal(
    mixedModeResponse.status,
    400,
    "auto preset and explicit preset id should be mutually exclusive"
  );

  const noEligiblePresetResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        ...basePayload,
        statutory: {
          ...basePayload.statutory,
          incomeTaxLookupAsOf: "2024-12-31T23:59:59+09:00"
        }
      },
      actorHeaders("payroll_operator", "PAY-3282")
    )
  );
  assert.equal(
    noEligiblePresetResponse.status,
    400,
    "auto preset should fail when no eligible preset exists for asOf"
  );
}

run()
  .then(() => {
    console.log("e2e-wi0282-payroll-kr-lookup-preset-effective-date-auto-resolution.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
