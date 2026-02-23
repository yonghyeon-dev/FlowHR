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

  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollApiSpec, /application reason codes/i);
  assert.match(payrollContract, /application reason codes/i);
  assert.match(payrollTestCases, /Year-End Application Reason Code Gate/);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Year-End Application Reason Code"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YARC-1001",
    organizationId: organization.id,
    name: "Year-End Reason Code Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YARC-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 2_000_000,
    withholdingTaxKrw: 90_000,
    socialInsuranceKrw: 70_000,
    otherDeductionsKrw: 10_000,
    totalDeductionsKrw: 170_000,
    netPayKrw: 1_830_000,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YARC-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YARC-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YARC-1001"
  });

  const previewResponse = await previewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/preview-settlement",
      {
        year: 2026,
        employeeId: "EMP-YARC-1001",
        nonTaxableAnnualIncomeKrw: 0,
        taxCredits: {
          earnedIncomeTaxCreditKrw: 800_000,
          childTaxCreditKrw: 0,
          additionalTaxCreditKrw: 300_000
        },
        annualIncomeTaxRate: 0.03,
        localIncomeTaxRate: 0.1
      },
      actorHeaders("payroll_operator", "PAY-YARC-1001", organization.id)
    )
  );
  assert.equal(previewResponse.status, 200);
  const previewBody = await readJson<{
    summary: {
      settlementKrw: {
        taxCreditAppliedByItemKrw: {
          earnedIncomeTaxCreditKrw: {
            applicationReasonCode: string;
            applicationReason: string;
          };
          childTaxCreditKrw: {
            applicationReasonCode: string;
            applicationReason: string;
          };
          additionalTaxCreditKrw: {
            applicationReasonCode: string;
            applicationReason: string;
          };
        };
      };
    };
  }>(previewResponse);
  assert.equal(
    previewBody.summary.settlementKrw.taxCreditAppliedByItemKrw.earnedIncomeTaxCreditKrw.applicationReasonCode,
    "CAPPED_BY_RULE"
  );
  assert.equal(
    previewBody.summary.settlementKrw.taxCreditAppliedByItemKrw.childTaxCreditKrw.applicationReasonCode,
    "NO_INPUT"
  );
  assert.equal(
    previewBody.summary.settlementKrw.taxCreditAppliedByItemKrw.additionalTaxCreditKrw.applicationReasonCode,
    "APPLIED_AS_ENTERED"
  );

  const recalculateResponse = await recalculateRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/recalculate-settlement",
      {
        year: 2026,
        employeeId: "EMP-YARC-1001",
        nonTaxableAnnualIncomeKrw: 0,
        taxCredits: {
          earnedIncomeTaxCreditKrw: 800_000,
          childTaxCreditKrw: 0,
          additionalTaxCreditKrw: 300_000
        },
        annualIncomeTaxRate: 0.03,
        localIncomeTaxRate: 0.1,
        deductionItems: {
          personalPensionKrw: 8_000_000,
          insurancePremiumKrw: 0,
          medicalExpenseKrw: 300_000,
          educationExpenseKrw: 0,
          donationKrw: 0,
          housingSavingsKrw: 0
        }
      },
      actorHeaders("payroll_operator", "PAY-YARC-1001", organization.id)
    )
  );
  assert.equal(recalculateResponse.status, 200);
  const recalculateBody = await readJson<{
    recalculation: {
      deductionItemsKrw: {
        capAppliedByItemKrw: {
          personalPensionKrw: { applicationReasonCode: string };
          insurancePremiumKrw: { applicationReasonCode: string };
          medicalExpenseKrw: { applicationReasonCode: string };
        };
      };
      recalculatedSettlementKrw: {
        taxCreditAppliedByItemKrw: {
          earnedIncomeTaxCreditKrw: { applicationReasonCode: string };
        };
      };
    };
  }>(recalculateResponse);
  assert.equal(
    recalculateBody.recalculation.deductionItemsKrw.capAppliedByItemKrw.personalPensionKrw.applicationReasonCode,
    "CAPPED_BY_RULE"
  );
  assert.equal(
    recalculateBody.recalculation.deductionItemsKrw.capAppliedByItemKrw.insurancePremiumKrw.applicationReasonCode,
    "NO_INPUT"
  );
  assert.equal(
    recalculateBody.recalculation.deductionItemsKrw.capAppliedByItemKrw.medicalExpenseKrw.applicationReasonCode,
    "APPLIED_AS_ENTERED"
  );
  assert.equal(
    recalculateBody.recalculation.recalculatedSettlementKrw.taxCreditAppliedByItemKrw.earnedIncomeTaxCreditKrw.applicationReasonCode,
    "CAPPED_BY_RULE"
  );

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YARC-1001",
        nonTaxableAnnualIncomeKrw: 0,
        taxCredits: {
          earnedIncomeTaxCreditKrw: 800_000,
          childTaxCreditKrw: 0,
          additionalTaxCreditKrw: 300_000
        },
        annualIncomeTaxRate: 0.03,
        localIncomeTaxRate: 0.1,
        deductionItems: {
          personalPensionKrw: 8_000_000,
          insurancePremiumKrw: 0,
          medicalExpenseKrw: 300_000,
          educationExpenseKrw: 0,
          donationKrw: 0,
          housingSavingsKrw: 0
        },
        apply: true,
        finalizedByNote: "wi0270 finalize"
      },
      actorHeaders("payroll_operator", "PAY-YARC-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200);
  const finalizeBody = await readJson<{
    settlement: {
      settlementHash: string;
      deductionItemsKrw: {
        capAppliedByItemKrw: {
          personalPensionKrw: {
            applicationReasonCode: string;
            applicationReason: string;
          };
        };
      };
      settlementKrw: {
        taxCreditAppliedByItemKrw: {
          earnedIncomeTaxCreditKrw: {
            applicationReasonCode: string;
            applicationReason: string;
          };
        };
      };
    };
  }>(finalizeResponse);
  assert.match(finalizeBody.settlement.settlementHash, /^[a-f0-9]{64}$/);
  assert.equal(
    finalizeBody.settlement.deductionItemsKrw.capAppliedByItemKrw.personalPensionKrw.applicationReasonCode,
    "CAPPED_BY_RULE"
  );
  assert.equal(
    finalizeBody.settlement.settlementKrw.taxCreditAppliedByItemKrw.earnedIncomeTaxCreditKrw.applicationReasonCode,
    "CAPPED_BY_RULE"
  );

  const exportResponse = await exportRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/export-filing-data",
      {
        year: 2026,
        employeeId: "EMP-YARC-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: finalizeBody.settlement.settlementHash
      },
      actorHeaders("payroll_operator", "PAY-YARC-1001", organization.id)
    )
  );
  assert.equal(exportResponse.status, 200);
  const exportBody = await readJson<{
    filingData: {
      deductionItemsKrw: {
        capAppliedByItemKrw: {
          personalPensionKrw: { applicationReasonCode: string };
        };
      };
      settlementKrw: {
        taxCreditAppliedByItemKrw: {
          earnedIncomeTaxCreditKrw: { applicationReasonCode: string };
        };
      };
    };
  }>(exportResponse);
  assert.equal(
    exportBody.filingData.deductionItemsKrw.capAppliedByItemKrw.personalPensionKrw.applicationReasonCode,
    "CAPPED_BY_RULE"
  );
  assert.equal(
    exportBody.filingData.settlementKrw.taxCreditAppliedByItemKrw.earnedIncomeTaxCreditKrw.applicationReasonCode,
    "CAPPED_BY_RULE"
  );
}

run()
  .then(() => {
    console.log("e2e-wi0270-payroll-year-end-application-reason-code-explainability.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
