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
  const exportRoute = await import("../../src/app/api/payroll/year-end/export-filing-data/route.ts");

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "true";

  const yearEndConsoleSource = readUtf8("src", "components", "payroll-year-end", "PayrollYearEndConsole.tsx");
  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(yearEndConsoleSource, /copy\.earnedIncomeTaxCreditLabel/);
  assert.match(payrollApiSpec, /tax credit cap/i);
  assert.match(payrollContract, /year-end tax credit caps/i);
  assert.match(payrollTestCases, /Year-end tax credit caps/i);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Year End Tax Credit Cap"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YTC-1001",
    organizationId: organization.id,
    name: "Year End Tax Credit Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YTC-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 2_500_000,
    withholdingTaxKrw: 120_000,
    socialInsuranceKrw: 100_000,
    otherDeductionsKrw: 20_000,
    totalDeductionsKrw: 240_000,
    netPayKrw: 2_260_000,
    sourceRecordCount: 1
  });
  const runTwo = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YTC-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 2_000_000,
    withholdingTaxKrw: 90_000,
    socialInsuranceKrw: 80_000,
    otherDeductionsKrw: 10_000,
    totalDeductionsKrw: 180_000,
    netPayKrw: 1_820_000,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T11:00:00+09:00"),
    confirmedBy: "PAY-YTC-1001",
    payslipDistributedAt: new Date("2026-12-31T11:10:00+09:00"),
    payslipDistributedBy: "PAY-YTC-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T11:15:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YTC-1001"
  });
  await memoryDataAccess.payroll.update(runTwo.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T11:00:00+09:00"),
    confirmedBy: "PAY-YTC-1001",
    payslipDistributedAt: new Date("2026-12-31T11:20:00+09:00"),
    payslipDistributedBy: "PAY-YTC-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T11:25:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YTC-1001"
  });

  const payload = {
    year: 2026,
    employeeId: "EMP-YTC-1001",
    nonTaxableAnnualIncomeKrw: 0,
    additionalTaxCreditKrw: 25_000,
    taxCredits: {
      earnedIncomeTaxCreditKrw: 2_000_000,
      childTaxCreditKrw: 1_500_000,
      additionalTaxCreditKrw: 2_000_000
    },
    annualIncomeTaxRate: 0.03,
    localIncomeTaxRate: 0.1
  };

  const previewResponse = await previewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/preview-settlement",
      payload,
      actorHeaders("payroll_operator", "PAY-YTC-1001", organization.id)
    )
  );
  assert.equal(previewResponse.status, 200, "year-end preview should include tax credit cap summary");
  const previewBody = await readJson<{
    summary: {
      annualTotalsKrw: { grossPayKrw: number; withholdingTaxKrw: number };
      settlementKrw: {
        annualIncomeTaxBeforeCreditKrw: number;
        additionalTaxCreditKrw: number;
        totalTaxCreditInputKrw: number;
        totalTaxCreditAppliedKrw: number;
        annualIncomeTaxAfterCreditKrw: number;
        annualLocalIncomeTaxKrw: number;
        annualTaxLiabilityKrw: number;
        withholdingDeltaKrw: number;
        taxCreditRulesKrw: {
          earnedIncomeTaxCreditKrw: number;
          childTaxCreditKrw: number;
          additionalTaxCreditKrw: number;
        };
        taxCreditAppliedByItemKrw: Record<
          string,
          { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean }
        >;
      };
    };
  }>(previewResponse);

  assert.equal(previewBody.summary.annualTotalsKrw.grossPayKrw, 4_500_000);
  assert.equal(previewBody.summary.annualTotalsKrw.withholdingTaxKrw, 210_000);
  assert.equal(previewBody.summary.settlementKrw.annualIncomeTaxBeforeCreditKrw, 135_000);
  assert.equal(previewBody.summary.settlementKrw.additionalTaxCreditKrw, 1_000_000);
  assert.equal(previewBody.summary.settlementKrw.totalTaxCreditInputKrw, 5_500_000);
  assert.equal(previewBody.summary.settlementKrw.totalTaxCreditAppliedKrw, 2_640_000);
  assert.deepEqual(previewBody.summary.settlementKrw.taxCreditRulesKrw, {
    earnedIncomeTaxCreditKrw: 740_000,
    childTaxCreditKrw: 900_000,
    additionalTaxCreditKrw: 1_000_000
  });
  assert.equal(
    previewBody.summary.settlementKrw.taxCreditAppliedByItemKrw.earnedIncomeTaxCreditKrw.capped,
    true
  );
  assert.equal(
    previewBody.summary.settlementKrw.taxCreditAppliedByItemKrw.childTaxCreditKrw.appliedKrw,
    900_000
  );
  assert.equal(previewBody.summary.settlementKrw.annualIncomeTaxAfterCreditKrw, 0);
  assert.equal(previewBody.summary.settlementKrw.annualLocalIncomeTaxKrw, 0);
  assert.equal(previewBody.summary.settlementKrw.annualTaxLiabilityKrw, 0);
  assert.equal(previewBody.summary.settlementKrw.withholdingDeltaKrw, -210_000);

  const legacyPreviewResponse = await previewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/preview-settlement",
      {
        year: 2026,
        employeeId: "EMP-YTC-1001",
        nonTaxableAnnualIncomeKrw: 0,
        additionalTaxCreditKrw: 25_000,
        annualIncomeTaxRate: 0.03,
        localIncomeTaxRate: 0.1
      },
      actorHeaders("payroll_operator", "PAY-YTC-1001", organization.id)
    )
  );
  assert.equal(legacyPreviewResponse.status, 200, "legacy additionalTaxCreditKrw input should remain valid");
  const legacyPreviewBody = await readJson<{
    summary: { settlementKrw: { additionalTaxCreditKrw: number; totalTaxCreditInputKrw: number; totalTaxCreditAppliedKrw: number } };
  }>(legacyPreviewResponse);
  assert.equal(legacyPreviewBody.summary.settlementKrw.additionalTaxCreditKrw, 25_000);
  assert.equal(legacyPreviewBody.summary.settlementKrw.totalTaxCreditInputKrw, 25_000);
  assert.equal(legacyPreviewBody.summary.settlementKrw.totalTaxCreditAppliedKrw, 25_000);

  const recalcResponse = await recalculateRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/recalculate-settlement",
      {
        ...payload,
        deductionItems: {
          personalPensionKrw: 0,
          insurancePremiumKrw: 0,
          medicalExpenseKrw: 0,
          educationExpenseKrw: 0,
          donationKrw: 0,
          housingSavingsKrw: 0
        }
      },
      actorHeaders("payroll_operator", "PAY-YTC-1001", organization.id)
    )
  );
  assert.equal(recalcResponse.status, 200, "year-end recalculation should keep tax-credit cap summary");
  const recalcBody = await readJson<{
    recalculation: {
      baselineSettlementKrw: { totalTaxCreditAppliedKrw: number };
      recalculatedSettlementKrw: {
        totalTaxCreditInputKrw: number;
        totalTaxCreditAppliedKrw: number;
        taxCreditAppliedByItemKrw: Record<string, { capped: boolean }>;
      };
    };
  }>(recalcResponse);
  assert.equal(recalcBody.recalculation.baselineSettlementKrw.totalTaxCreditAppliedKrw, 2_640_000);
  assert.equal(recalcBody.recalculation.recalculatedSettlementKrw.totalTaxCreditInputKrw, 5_500_000);
  assert.equal(recalcBody.recalculation.recalculatedSettlementKrw.totalTaxCreditAppliedKrw, 2_640_000);
  assert.equal(
    recalcBody.recalculation.recalculatedSettlementKrw.taxCreditAppliedByItemKrw.additionalTaxCreditKrw.capped,
    true
  );

  const recalcReplayResponse = await recalculateRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/recalculate-settlement",
      {
        ...payload,
        deductionItems: {
          personalPensionKrw: 0,
          insurancePremiumKrw: 0,
          medicalExpenseKrw: 0,
          educationExpenseKrw: 0,
          donationKrw: 0,
          housingSavingsKrw: 0
        }
      },
      actorHeaders("payroll_operator", "PAY-YTC-1001", organization.id)
    )
  );
  assert.equal(recalcReplayResponse.status, 200);
  const recalcReplayBody = await readJson<typeof recalcBody>(recalcReplayResponse);
  assert.deepEqual(recalcReplayBody, recalcBody, "same payload should remain deterministic");

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        ...payload,
        apply: true,
        finalizedByNote: "wi0261 tax credit cap accuracy",
        deductionItems: {
          personalPensionKrw: 0,
          insurancePremiumKrw: 0,
          medicalExpenseKrw: 0,
          educationExpenseKrw: 0,
          donationKrw: 0,
          housingSavingsKrw: 0
        }
      },
      actorHeaders("payroll_operator", "PAY-YTC-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200, "year-end finalization should keep tax-credit cap summary");
  const finalizeBody = await readJson<{
    settlement: { settlementKrw: { totalTaxCreditAppliedKrw: number; additionalTaxCreditKrw: number } };
  }>(finalizeResponse);
  assert.equal(finalizeBody.settlement.settlementKrw.totalTaxCreditAppliedKrw, 2_640_000);
  assert.equal(finalizeBody.settlement.settlementKrw.additionalTaxCreditKrw, 1_000_000);

  const exportResponse = await exportRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/export-filing-data",
      {
        year: 2026,
        employeeId: "EMP-YTC-1001",
        format: "json",
        validationMode: "strict"
      },
      actorHeaders("payroll_operator", "PAY-YTC-1001", organization.id)
    )
  );
  assert.equal(exportResponse.status, 200, "year-end export should preserve tax-credit cap summary");
  const exportBody = await readJson<{
    filingData: {
      settlementKrw: {
        totalTaxCreditAppliedKrw: number;
        taxCreditAppliedByItemKrw: Record<string, { capKrw: number; appliedKrw: number }>;
      };
    };
  }>(exportResponse);
  assert.equal(exportBody.filingData.settlementKrw.totalTaxCreditAppliedKrw, 2_640_000);
  assert.equal(
    exportBody.filingData.settlementKrw.taxCreditAppliedByItemKrw.earnedIncomeTaxCreditKrw.capKrw,
    740_000
  );
  assert.equal(
    exportBody.filingData.settlementKrw.taxCreditAppliedByItemKrw.childTaxCreditKrw.appliedKrw,
    900_000
  );
}

run()
  .then(() => {
    console.log("e2e-wi0261-payroll-year-end-tax-credit-cap-accuracy-v1.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
