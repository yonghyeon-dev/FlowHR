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

async function seedConfirmedDistributedReceiptRuns(
  organizationId: string,
  employeeId: string,
  withholdingTaxKrwA: number,
  withholdingTaxKrwB: number
) {
  const { memoryDataAccess } = await import("../../src/features/shared/memory-data-access.ts");

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");

  const runA = await memoryDataAccess.payroll.create({
    organizationId,
    employeeId,
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 2_000_000,
    withholdingTaxKrw: withholdingTaxKrwA,
    socialInsuranceKrw: 70_000,
    otherDeductionsKrw: 10_000,
    totalDeductionsKrw: withholdingTaxKrwA + 80_000,
    netPayKrw: 2_000_000 - (withholdingTaxKrwA + 80_000),
    sourceRecordCount: 1
  });
  const runB = await memoryDataAccess.payroll.create({
    organizationId,
    employeeId,
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 2_000_000,
    withholdingTaxKrw: withholdingTaxKrwB,
    socialInsuranceKrw: 70_000,
    otherDeductionsKrw: 10_000,
    totalDeductionsKrw: withholdingTaxKrwB + 80_000,
    netPayKrw: 2_000_000 - (withholdingTaxKrwB + 80_000),
    sourceRecordCount: 1
  });

  await memoryDataAccess.payroll.update(runA.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YWB-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YWB-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: employeeId
  });
  await memoryDataAccess.payroll.update(runB.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YWB-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YWB-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: employeeId
  });
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
  const exportRoute = await import("../../src/app/api/payroll/year-end/export-filing-data/route.ts");

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "true";

  const yearEndConsoleSource = readUtf8("src", "components", "payroll-year-end", "PayrollYearEndConsole.tsx");
  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(yearEndConsoleSource, /Additional Withholding Due/);
  assert.match(payrollApiSpec, /refund\/additional-due/i);
  assert.match(payrollContract, /additionalWithholdingDueKrw/);
  assert.match(payrollTestCases, /Year-End Withholding Breakdown Gate/);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Year End Withholding Breakdown"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YWB-DUE",
    organizationId: organization.id,
    name: "Year End Withholding Due Employee"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YWB-REFUND",
    organizationId: organization.id,
    name: "Year End Withholding Refund Employee"
  });

  await seedConfirmedDistributedReceiptRuns(organization.id, "EMP-YWB-DUE", 80_000, 20_000);
  await seedConfirmedDistributedReceiptRuns(organization.id, "EMP-YWB-REFUND", 200_000, 100_000);

  const payloadBase = {
    year: 2026,
    nonTaxableAnnualIncomeKrw: 0,
    additionalTaxCreditKrw: 0,
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

  const duePreviewResponse = await previewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/preview-settlement",
      {
        ...payloadBase,
        employeeId: "EMP-YWB-DUE"
      },
      actorHeaders("payroll_operator", "PAY-YWB-1001", organization.id)
    )
  );
  assert.equal(duePreviewResponse.status, 200);
  const duePreviewBody = await readJson<{
    summary: {
      settlementKrw: {
        annualTaxLiabilityKrw: number;
        priorWithheldTaxKrw: number;
        withholdingDeltaKrw: number;
        additionalWithholdingDueKrw: number;
        withholdingRefundKrw: number;
      };
    };
  }>(duePreviewResponse);
  assert.equal(duePreviewBody.summary.settlementKrw.annualTaxLiabilityKrw, 132_000);
  assert.equal(duePreviewBody.summary.settlementKrw.priorWithheldTaxKrw, 100_000);
  assert.equal(duePreviewBody.summary.settlementKrw.withholdingDeltaKrw, 32_000);
  assert.equal(duePreviewBody.summary.settlementKrw.additionalWithholdingDueKrw, 32_000);
  assert.equal(duePreviewBody.summary.settlementKrw.withholdingRefundKrw, 0);

  const refundPreviewResponse = await previewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/preview-settlement",
      {
        ...payloadBase,
        employeeId: "EMP-YWB-REFUND"
      },
      actorHeaders("payroll_operator", "PAY-YWB-1001", organization.id)
    )
  );
  assert.equal(refundPreviewResponse.status, 200);
  const refundPreviewBody = await readJson<{
    summary: {
      settlementKrw: {
        annualTaxLiabilityKrw: number;
        priorWithheldTaxKrw: number;
        withholdingDeltaKrw: number;
        additionalWithholdingDueKrw: number;
        withholdingRefundKrw: number;
      };
    };
  }>(refundPreviewResponse);
  assert.equal(refundPreviewBody.summary.settlementKrw.annualTaxLiabilityKrw, 132_000);
  assert.equal(refundPreviewBody.summary.settlementKrw.priorWithheldTaxKrw, 300_000);
  assert.equal(refundPreviewBody.summary.settlementKrw.withholdingDeltaKrw, -168_000);
  assert.equal(refundPreviewBody.summary.settlementKrw.additionalWithholdingDueKrw, 0);
  assert.equal(refundPreviewBody.summary.settlementKrw.withholdingRefundKrw, 168_000);

  const recalcResponse = await recalculateRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/recalculate-settlement",
      {
        ...payloadBase,
        employeeId: "EMP-YWB-DUE"
      },
      actorHeaders("payroll_operator", "PAY-YWB-1001", organization.id)
    )
  );
  assert.equal(recalcResponse.status, 200);
  const recalcBody = await readJson<{
    recalculation: {
      baselineSettlementKrw: {
        additionalWithholdingDueKrw: number;
        withholdingRefundKrw: number;
      };
      recalculatedSettlementKrw: {
        additionalWithholdingDueKrw: number;
        withholdingRefundKrw: number;
      };
    };
  }>(recalcResponse);
  assert.equal(recalcBody.recalculation.baselineSettlementKrw.additionalWithholdingDueKrw, 32_000);
  assert.equal(recalcBody.recalculation.baselineSettlementKrw.withholdingRefundKrw, 0);
  assert.equal(recalcBody.recalculation.recalculatedSettlementKrw.additionalWithholdingDueKrw, 32_000);
  assert.equal(recalcBody.recalculation.recalculatedSettlementKrw.withholdingRefundKrw, 0);

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        ...payloadBase,
        employeeId: "EMP-YWB-DUE",
        apply: true,
        finalizedByNote: "wi0264 withholding breakdown"
      },
      actorHeaders("payroll_operator", "PAY-YWB-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200);
  const finalizeBody = await readJson<{
    settlement: {
      settlementKrw: {
        additionalWithholdingDueKrw: number;
        withholdingRefundKrw: number;
      };
    };
  }>(finalizeResponse);
  assert.equal(finalizeBody.settlement.settlementKrw.additionalWithholdingDueKrw, 32_000);
  assert.equal(finalizeBody.settlement.settlementKrw.withholdingRefundKrw, 0);

  const exportResponse = await exportRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/export-filing-data",
      {
        year: 2026,
        employeeId: "EMP-YWB-DUE",
        format: "json",
        validationMode: "strict"
      },
      actorHeaders("payroll_operator", "PAY-YWB-1001", organization.id)
    )
  );
  assert.equal(exportResponse.status, 200);
  const exportBody = await readJson<{
    filingData: {
      settlementKrw: {
        additionalWithholdingDueKrw: number;
        withholdingRefundKrw: number;
      };
    };
  }>(exportResponse);
  assert.equal(exportBody.filingData.settlementKrw.additionalWithholdingDueKrw, 32_000);
  assert.equal(exportBody.filingData.settlementKrw.withholdingRefundKrw, 0);
}

run()
  .then(() => {
    console.log("e2e-wi0264-payroll-year-end-withholding-delta-breakdown-ux.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
