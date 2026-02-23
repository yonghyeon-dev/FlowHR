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

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const previewRoute = await import("../../src/app/api/payroll/year-end/preview-settlement/route.ts");
  const recalculateRoute = await import(
    "../../src/app/api/payroll/year-end/recalculate-settlement/route.ts"
  );
  const finalizeRoute = await import("../../src/app/api/payroll/year-end/finalize-settlement/route.ts");

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "true";

  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollApiSpec, /non-taxable annual income/i);
  assert.match(payrollContract, /non-taxable annual income upper-bound/i);
  assert.match(payrollTestCases, /Year-End Non-Taxable Upper-Bound Gate/);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Year End Non Taxable Guard"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YENT-1001",
    organizationId: organization.id,
    name: "Year End Non Taxable Guard Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YENT-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 2_000_000,
    withholdingTaxKrw: 80_000,
    socialInsuranceKrw: 70_000,
    otherDeductionsKrw: 10_000,
    totalDeductionsKrw: 160_000,
    netPayKrw: 1_840_000,
    sourceRecordCount: 1
  });
  const runTwo = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YENT-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 1_000_000,
    withholdingTaxKrw: 40_000,
    socialInsuranceKrw: 35_000,
    otherDeductionsKrw: 5_000,
    totalDeductionsKrw: 80_000,
    netPayKrw: 920_000,
    sourceRecordCount: 1
  });

  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T10:00:00+09:00"),
    confirmedBy: "PAY-YENT-1001",
    payslipDistributedAt: new Date("2026-12-31T10:10:00+09:00"),
    payslipDistributedBy: "PAY-YENT-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T10:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YENT-1001"
  });
  await memoryDataAccess.payroll.update(runTwo.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T10:00:00+09:00"),
    confirmedBy: "PAY-YENT-1001",
    payslipDistributedAt: new Date("2026-12-31T10:10:00+09:00"),
    payslipDistributedBy: "PAY-YENT-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T10:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YENT-1001"
  });

  const invalidPayload = {
    year: 2026,
    employeeId: "EMP-YENT-1001",
    nonTaxableAnnualIncomeKrw: 3_500_000,
    additionalTaxCreditKrw: 5_000,
    annualIncomeTaxRate: 0.03,
    localIncomeTaxRate: 0.1,
    deductionItems: {
      personalPensionKrw: 0,
      insurancePremiumKrw: 0,
      medicalExpenseKrw: 0,
      educationExpenseKrw: 0,
      donationKrw: 0,
      housingSavingsKrw: 0
    }
  };

  const previewBlocked = await previewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/preview-settlement",
      invalidPayload,
      actorHeaders("payroll_operator", "PAY-YENT-1001", organization.id)
    )
  );
  assert.equal(previewBlocked.status, 409);
  const previewBlockedBody = await readJson<{
    details: { annualGrossPayKrw: number; nonTaxableAnnualIncomeKrw: number; overflowKrw: number };
  }>(previewBlocked);
  assert.equal(previewBlockedBody.details.annualGrossPayKrw, 3_000_000);
  assert.equal(previewBlockedBody.details.nonTaxableAnnualIncomeKrw, 3_500_000);
  assert.equal(previewBlockedBody.details.overflowKrw, 500_000);

  const recalcBlocked = await recalculateRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/recalculate-settlement",
      invalidPayload,
      actorHeaders("payroll_operator", "PAY-YENT-1001", organization.id)
    )
  );
  assert.equal(recalcBlocked.status, 409);

  const finalizeBlocked = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        ...invalidPayload,
        apply: false,
        finalizedByNote: "wi0263 non-taxable upper bound"
      },
      actorHeaders("payroll_operator", "PAY-YENT-1001", organization.id)
    )
  );
  assert.equal(finalizeBlocked.status, 409);

  const validPreviewResponse = await previewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/preview-settlement",
      {
        ...invalidPayload,
        nonTaxableAnnualIncomeKrw: 3_000_000
      },
      actorHeaders("payroll_operator", "PAY-YENT-1001", organization.id)
    )
  );
  assert.equal(validPreviewResponse.status, 200);
  const validPreviewBody = await readJson<{
    summary: { settlementKrw: { taxableAnnualIncomeKrw: number } };
  }>(validPreviewResponse);
  assert.equal(validPreviewBody.summary.settlementKrw.taxableAnnualIncomeKrw, 0);
}

run()
  .then(() => {
    console.log("e2e-wi0263-payroll-year-end-non-taxable-income-upper-bound-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
