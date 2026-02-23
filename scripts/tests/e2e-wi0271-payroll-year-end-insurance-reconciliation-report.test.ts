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

function getRequest(urlPath: string, headers: Record<string, string>) {
  return new Request(`http://localhost${urlPath}`, {
    method: "GET",
    headers
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const finalizeRoute = await import("../../src/app/api/payroll/year-end/finalize-settlement/route.ts");
  const reportRoute = await import(
    "../../src/app/api/payroll/year-end/insurance-reconciliation-report/route.ts"
  );

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "true";

  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollApiSpec, /insurance-reconciliation-report/);
  assert.match(payrollContract, /insurance reconciliation report workflow/i);
  assert.match(payrollTestCases, /Year-End Insurance Reconciliation Gate/);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Insurance Reconciliation Report"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YIRR-1001",
    organizationId: organization.id,
    name: "Insurance Reconciliation Employee"
  });

  const januaryStart = new Date("2026-01-01T00:00:00+09:00");
  const januaryEnd = new Date("2026-01-31T23:59:59+09:00");
  const februaryStart = new Date("2026-02-01T00:00:00+09:00");
  const februaryEnd = new Date("2026-02-28T23:59:59+09:00");

  const runJan = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YIRR-1001",
    periodStart: januaryStart,
    periodEnd: januaryEnd,
    grossPayKrw: 1_800_000,
    withholdingTaxKrw: 60_000,
    socialInsuranceKrw: 40_000,
    otherDeductionsKrw: 10_000,
    totalDeductionsKrw: 110_000,
    netPayKrw: 1_690_000,
    sourceRecordCount: 1
  });
  const runFeb = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YIRR-1001",
    periodStart: februaryStart,
    periodEnd: februaryEnd,
    grossPayKrw: 2_000_000,
    withholdingTaxKrw: 70_000,
    socialInsuranceKrw: 50_000,
    otherDeductionsKrw: 10_000,
    totalDeductionsKrw: 130_000,
    netPayKrw: 1_870_000,
    sourceRecordCount: 1
  });

  await memoryDataAccess.payroll.update(runJan.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-02-05T09:00:00+09:00"),
    confirmedBy: "PAY-YIRR-1001",
    payslipDistributedAt: new Date("2026-02-05T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YIRR-1001",
    payslipReceiptConfirmedAt: new Date("2026-02-05T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YIRR-1001"
  });
  await memoryDataAccess.payroll.update(runFeb.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-03-05T09:00:00+09:00"),
    confirmedBy: "PAY-YIRR-1001",
    payslipDistributedAt: new Date("2026-03-05T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YIRR-1001",
    payslipReceiptConfirmedAt: new Date("2026-03-05T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YIRR-1001"
  });

  const reportPendingResponse = await reportRoute.GET(
    getRequest(
      "/api/payroll/year-end/insurance-reconciliation-report?year=2026&employeeId=EMP-YIRR-1001",
      actorHeaders("payroll_operator", "PAY-YIRR-1001", organization.id)
    )
  );
  assert.equal(reportPendingResponse.status, 200);
  const reportPendingBody = await readJson<{
    report: {
      annualRunSocialInsuranceKrw: number;
      reconciliation: {
        status: "matched" | "mismatch" | "pending_finalization";
        comparedKrw: number;
      };
      monthlyBreakdown: Array<{ month: string }>;
    };
  }>(reportPendingResponse);
  assert.equal(reportPendingBody.report.annualRunSocialInsuranceKrw, 90_000);
  assert.equal(reportPendingBody.report.reconciliation.status, "pending_finalization");
  assert.equal(reportPendingBody.report.reconciliation.comparedKrw, 0);
  assert.deepEqual(
    reportPendingBody.report.monthlyBreakdown.map((row) => row.month),
    ["2026-01", "2026-02"]
  );

  const mismatchFinalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YIRR-1001",
        nonTaxableAnnualIncomeKrw: 0,
        additionalTaxCreditKrw: 0,
        annualIncomeTaxRate: 0.03,
        localIncomeTaxRate: 0.1,
        deductionItems: {
          personalPensionKrw: 0,
          insurancePremiumKrw: 100_000,
          medicalExpenseKrw: 0,
          educationExpenseKrw: 0,
          donationKrw: 0,
          housingSavingsKrw: 0
        },
        apply: true,
        finalizedByNote: "wi0271 mismatch finalize"
      },
      actorHeaders("payroll_operator", "PAY-YIRR-1001", organization.id)
    )
  );
  assert.equal(mismatchFinalizeResponse.status, 200);

  const reportMismatchResponse = await reportRoute.GET(
    getRequest(
      "/api/payroll/year-end/insurance-reconciliation-report?year=2026&employeeId=EMP-YIRR-1001",
      actorHeaders("payroll_operator", "PAY-YIRR-1001", organization.id)
    )
  );
  assert.equal(reportMismatchResponse.status, 200);
  const reportMismatchBody = await readJson<{
    report: {
      finalization: {
        insurancePremiumAppliedKrw: number | null;
        applicationReasonCode: string | null;
      };
      reconciliation: {
        status: "matched" | "mismatch" | "pending_finalization";
        deltaKrw: number;
      };
    };
  }>(reportMismatchResponse);
  assert.equal(reportMismatchBody.report.finalization.insurancePremiumAppliedKrw, 100_000);
  assert.equal(reportMismatchBody.report.reconciliation.status, "mismatch");
  assert.equal(reportMismatchBody.report.reconciliation.deltaKrw, -10_000);
  assert.equal(reportMismatchBody.report.finalization.applicationReasonCode, "APPLIED_AS_ENTERED");

  const matchedFinalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YIRR-1001",
        nonTaxableAnnualIncomeKrw: 0,
        additionalTaxCreditKrw: 0,
        annualIncomeTaxRate: 0.03,
        localIncomeTaxRate: 0.1,
        deductionItems: {
          personalPensionKrw: 0,
          insurancePremiumKrw: 90_000,
          medicalExpenseKrw: 0,
          educationExpenseKrw: 0,
          donationKrw: 0,
          housingSavingsKrw: 0
        },
        apply: true,
        finalizedByNote: "wi0271 matched finalize"
      },
      actorHeaders("payroll_operator", "PAY-YIRR-1001", organization.id)
    )
  );
  assert.equal(matchedFinalizeResponse.status, 200);

  const reportMatchedResponse = await reportRoute.GET(
    getRequest(
      "/api/payroll/year-end/insurance-reconciliation-report?year=2026&employeeId=EMP-YIRR-1001",
      actorHeaders("payroll_operator", "PAY-YIRR-1001", organization.id)
    )
  );
  assert.equal(reportMatchedResponse.status, 200);
  const reportMatchedBody = await readJson<{
    report: {
      finalization: {
        finalizationId: string | null;
        settlementHash: string | null;
      };
      reconciliation: {
        status: "matched" | "mismatch" | "pending_finalization";
        deltaKrw: number;
      };
    };
  }>(reportMatchedResponse);
  assert.equal(reportMatchedBody.report.reconciliation.status, "matched");
  assert.equal(reportMatchedBody.report.reconciliation.deltaKrw, 0);
  assert.ok(reportMatchedBody.report.finalization.finalizationId);
  assert.match(String(reportMatchedBody.report.finalization.settlementHash), /^[a-f0-9]{64}$/);
}

run()
  .then(() => {
    console.log("e2e-wi0271-payroll-year-end-insurance-reconciliation-report.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
