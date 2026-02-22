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
  const { listPayrollKrIncomeSplitItemPresets } = await import(
    "../../src/features/payroll/kr-income-split-item-presets.ts"
  );

  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  const payrollRfc = readUtf8("specs", "payroll", "rfc.md");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const presetFieldComponent = readUtf8(
    "src",
    "components",
    "payroll",
    "PayrollKrIncomeSplitItemPresetField.tsx"
  );

  assert.match(payrollApiSpec, /incomeSplitItemPresetId/);
  assert.match(payrollContract, /income split item preset/i);
  assert.match(payrollTestCases, /income split item preset/i);
  assert.match(payrollRfc, /WI-0225/);
  assert.match(adminPage, /payrollIncomeSplitItemPresetId/);
  assert.match(adminPage, /PayrollKrIncomeSplitItemPresetField/);
  assert.match(presetFieldComponent, /incomeSplitItemPresetId/i);

  const splitItemPresets = listPayrollKrIncomeSplitItemPresets();
  const defaultPreset = splitItemPresets.find((preset) => preset.id === "kr_income_split_template_v2026_01");
  assert.ok(defaultPreset, "expected default WI-0225 split item preset to exist");

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_DEDUCTIONS_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_KR_BASELINE_V1 = "true";

  await memoryDataAccess.employees.create({ id: "EMP-3225" });

  const createResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-3225",
        checkInAt: "2026-02-16T09:00:00+09:00",
        checkOutAt: "2026-02-16T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-3225")
    )
  );
  assert.equal(createResponse.status, 201);
  const createdBody = await readJson<{ record: { id: string } }>(createResponse);

  const approveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-3225")
    }),
    { params: Promise.resolve({ recordId: createdBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(approveResponse.status, 200);

  const presetPreviewResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3225",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          nonTaxableIncomeKrw: 10000,
          incomeTaxLookupPresetId: "kr_simple_monthly_v2026_01",
          incomeSplitItemPresetId: "kr_income_split_template_v2026_01"
        }
      },
      actorHeaders("payroll_operator", "PAY-3225")
    )
  );
  assert.equal(presetPreviewResponse.status, 200, "preset-based split item input should be accepted");
  const presetPreviewBody = await readJson<{
    summary: {
      deductionBreakdown: {
        additional: {
          incomeSplitKrw: { taxableIncomeKrw: number; nonTaxableIncomeKrw: number; taxableSource: string };
          incomeSplitItems: {
            taxableIncomeItemTotalKrw: number;
            nonTaxableIncomeItemTotalKrw: number;
            taxableIncomeItems: Array<{ code: string; category: string; amountKrw: number }>;
            nonTaxableIncomeItems: Array<{ code: string; category: string; amountKrw: number }>;
          };
          incomeSplitItemPreset: { id: string };
        };
      };
    };
  }>(presetPreviewResponse);
  assert.equal(
    presetPreviewBody.summary.deductionBreakdown.additional.incomeSplitItemPreset.id,
    "kr_income_split_template_v2026_01"
  );
  assert.equal(
    presetPreviewBody.summary.deductionBreakdown.additional.incomeSplitKrw.taxableIncomeKrw,
    86000
  );
  assert.equal(
    presetPreviewBody.summary.deductionBreakdown.additional.incomeSplitKrw.nonTaxableIncomeKrw,
    10000
  );
  assert.equal(
    presetPreviewBody.summary.deductionBreakdown.additional.incomeSplitKrw.taxableSource,
    "from_income_split_item_preset"
  );
  assert.equal(
    presetPreviewBody.summary.deductionBreakdown.additional.incomeSplitItems.taxableIncomeItems[0]?.code,
    "TX_SALARY"
  );
  assert.equal(
    presetPreviewBody.summary.deductionBreakdown.additional.incomeSplitItems.nonTaxableIncomeItems[0]?.code,
    "NT_MEAL"
  );
  assert.equal(
    presetPreviewBody.summary.deductionBreakdown.additional.incomeSplitItems.taxableIncomeItemTotalKrw,
    86000
  );
  assert.equal(
    presetPreviewBody.summary.deductionBreakdown.additional.incomeSplitItems.nonTaxableIncomeItemTotalKrw,
    10000
  );

  const unknownPresetResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3225",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          nonTaxableIncomeKrw: 10000,
          incomeSplitItemPresetId: "unknown-preset"
        }
      },
      actorHeaders("payroll_operator", "PAY-3225")
    )
  );
  assert.equal(unknownPresetResponse.status, 400, "unknown preset id should be rejected");
  const unknownPresetBody = await readJson<{ error: string }>(unknownPresetResponse);
  assert.match(unknownPresetBody.error, /incomeSplitItemPresetId is not supported/);

  const conflictPresetResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3225",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          nonTaxableIncomeKrw: 10000,
          incomeSplitItemPresetId: "kr_income_split_template_v2026_01",
          taxableIncomeItems: [{ code: "TX_SALARY", category: "salary", amountKrw: 86000 }]
        }
      },
      actorHeaders("payroll_operator", "PAY-3225")
    )
  );
  assert.equal(
    conflictPresetResponse.status,
    400,
    "preset and manual split item arrays should be mutually exclusive"
  );
  const conflictPresetBody = await readJson<{ error: string }>(conflictPresetResponse);
  assert.equal(conflictPresetBody.error, "invalid payload");
}

run()
  .then(() => {
    console.log("e2e-wi0225-payroll-kr-income-split-item-preset-dataset.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
