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
  const payrollRfc = readUtf8("specs", "payroll", "rfc.md");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const splitGuideComponent = readUtf8(
    "src",
    "components",
    "payroll",
    "PayrollKrIncomeSplitGuideField.tsx"
  );

  assert.match(payrollApiSpec, /taxableIncomeKrw/);
  assert.match(payrollContract, /taxableIncomeKrw/);
  assert.match(payrollContract, /nonTaxableIncomeKrw must not exceed grossPayKrw/);
  assert.match(payrollTestCases, /taxable\/non-taxable split rule/);
  assert.match(payrollRfc, /WI-0223/);
  assert.match(adminPage, /payrollTaxableIncomeKrw/);
  assert.match(adminPage, /PayrollKrIncomeSplitGuideField/);
  assert.match(
    splitGuideComponent,
    /taxable \+ non-taxable must equal grossPayKrw/i,
    "split guide copy should explain sum-validation rule"
  );

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_DEDUCTIONS_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_KR_BASELINE_V1 = "true";

  await memoryDataAccess.employees.create({ id: "EMP-3223" });

  const createResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-3223",
        checkInAt: "2026-02-15T09:00:00+09:00",
        checkOutAt: "2026-02-15T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-3223")
    )
  );
  assert.equal(createResponse.status, 201);
  const createdBody = await readJson<{ record: { id: string } }>(createResponse);

  const approveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-3223")
    }),
    { params: Promise.resolve({ recordId: createdBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(approveResponse.status, 200);

  const successResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3223",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          nonTaxableIncomeKrw: 10000,
          taxableIncomeKrw: 86000,
          incomeTaxLookupPresetId: "kr_simple_monthly_v2026_01"
        }
      },
      actorHeaders("payroll_operator", "PAY-3223")
    )
  );
  assert.equal(successResponse.status, 200, "valid split should be accepted");
  const successBody = await readJson<{
    summary: {
      grossPayKrw: number;
      deductionBreakdown: {
        additional: {
          taxableBaseKrw: number;
          incomeSplitKrw: {
            grossPayKrw: number;
            taxableIncomeKrw: number;
            nonTaxableIncomeKrw: number;
            taxableSource: string;
            validated: boolean;
          };
        };
      };
    };
  }>(successResponse);

  assert.equal(successBody.summary.grossPayKrw, 96000);
  assert.equal(successBody.summary.deductionBreakdown.additional.taxableBaseKrw, 86000);
  assert.deepEqual(successBody.summary.deductionBreakdown.additional.incomeSplitKrw, {
    grossPayKrw: 96000,
    taxableIncomeKrw: 86000,
    nonTaxableIncomeKrw: 10000,
    taxableSource: "explicit",
    validated: true
  });

  const splitMismatchResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3223",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          nonTaxableIncomeKrw: 10000,
          taxableIncomeKrw: 85000
        }
      },
      actorHeaders("payroll_operator", "PAY-3223")
    )
  );
  assert.equal(splitMismatchResponse.status, 400, "mismatched split sum should be rejected");
  const splitMismatchBody = await readJson<{ error: string }>(splitMismatchResponse);
  assert.match(
    splitMismatchBody.error,
    /taxableIncomeKrw plus statutory\.nonTaxableIncomeKrw must equal grossPayKrw/
  );

  const nonTaxableExceedResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3223",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          nonTaxableIncomeKrw: 120000
        }
      },
      actorHeaders("payroll_operator", "PAY-3223")
    )
  );
  assert.equal(nonTaxableExceedResponse.status, 400, "non-taxable above gross should be rejected");
  const nonTaxableExceedBody = await readJson<{ error: string }>(nonTaxableExceedResponse);
  assert.match(nonTaxableExceedBody.error, /nonTaxableIncomeKrw cannot exceed grossPayKrw/);
}

run()
  .then(() => {
    console.log("e2e-wi0223-payroll-kr-taxable-non-taxable-split-rule.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
