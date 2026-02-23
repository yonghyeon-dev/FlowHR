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
  const preflightRoute = await import(
    "../../src/app/api/payroll/year-end/preflight-checklist/route.ts"
  );
  const finalizeRoute = await import("../../src/app/api/payroll/year-end/finalize-settlement/route.ts");
  const filingSubmissionRoute = await import("../../src/app/api/payroll/year-end/filing-submissions/route.ts");
  const filingAckRoute = await import(
    "../../src/app/api/payroll/year-end/filing-submissions/[submissionId]/ack/route.ts"
  );

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1 = "true";

  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollApiSpec, /preflight-checklist/);
  assert.match(payrollContract, /preflight checklist workflow/i);
  assert.match(payrollTestCases, /Year-End Preflight Checklist Gate/);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Year-End Preflight Checklist"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YPFC-1001",
    organizationId: organization.id,
    name: "Preflight Checklist Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YPFC-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 1_900_000,
    withholdingTaxKrw: 70_000,
    socialInsuranceKrw: 60_000,
    otherDeductionsKrw: 10_000,
    totalDeductionsKrw: 140_000,
    netPayKrw: 1_760_000,
    sourceRecordCount: 1
  });
  const runTwo = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YPFC-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 1_600_000,
    withholdingTaxKrw: 60_000,
    socialInsuranceKrw: 50_000,
    otherDeductionsKrw: 10_000,
    totalDeductionsKrw: 120_000,
    netPayKrw: 1_480_000,
    sourceRecordCount: 1
  });

  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YPFC-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YPFC-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YPFC-1001"
  });

  const preflightFailResponse = await preflightRoute.GET(
    getRequest(
      "/api/payroll/year-end/preflight-checklist?year=2026&employeeId=EMP-YPFC-1001&nonTaxableAnnualIncomeKrw=4000000",
      actorHeaders("payroll_operator", "PAY-YPFC-1001", organization.id)
    )
  );
  assert.equal(preflightFailResponse.status, 200);
  const preflightFailBody = await readJson<{
    checklist: {
      summary: {
        readyToFinalize: boolean;
        failCount: number;
      };
      checks: Array<{
        key: string;
        status: "pass" | "fail" | "warn";
      }>;
    };
  }>(preflightFailResponse);
  assert.equal(preflightFailBody.checklist.summary.readyToFinalize, false);
  assert.ok(preflightFailBody.checklist.summary.failCount >= 2);
  assert.equal(
    preflightFailBody.checklist.checks.find((check) => check.key === "no_previewed_runs")?.status,
    "fail"
  );
  assert.equal(
    preflightFailBody.checklist.checks.find((check) => check.key === "non_taxable_within_annual_gross")?.status,
    "fail"
  );

  await memoryDataAccess.payroll.update(runTwo.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YPFC-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YPFC-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YPFC-1001"
  });

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YPFC-1001",
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
        },
        apply: true,
        finalizedByNote: "wi0272 finalize"
      },
      actorHeaders("payroll_operator", "PAY-YPFC-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200);
  const finalizeBody = await readJson<{
    settlement: {
      settlementHash: string;
    };
  }>(finalizeResponse);

  const submitResponse = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YPFC-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: finalizeBody.settlement.settlementHash,
        transport: "manual_portal",
        submissionNote: "wi0272 pending submission"
      },
      actorHeaders("payroll_operator", "PAY-YPFC-1001", organization.id)
    )
  );
  assert.equal(submitResponse.status, 200);
  const submitBody = await readJson<{
    submission: {
      submissionId: string;
    };
  }>(submitResponse);

  const preflightPendingSubmissionResponse = await preflightRoute.GET(
    getRequest(
      "/api/payroll/year-end/preflight-checklist?year=2026&employeeId=EMP-YPFC-1001&nonTaxableAnnualIncomeKrw=0",
      actorHeaders("payroll_operator", "PAY-YPFC-1001", organization.id)
    )
  );
  assert.equal(preflightPendingSubmissionResponse.status, 200);
  const preflightPendingSubmissionBody = await readJson<{
    checklist: {
      summary: {
        readyToFinalize: boolean;
      };
      checks: Array<{
        key: string;
        status: "pass" | "fail" | "warn";
      }>;
    };
  }>(preflightPendingSubmissionResponse);
  assert.equal(preflightPendingSubmissionBody.checklist.summary.readyToFinalize, false);
  assert.equal(
    preflightPendingSubmissionBody.checklist.checks.find(
      (check) => check.key === "no_pending_filing_submissions"
    )?.status,
    "fail"
  );
  assert.equal(
    preflightPendingSubmissionBody.checklist.checks.find(
      (check) => check.key === "settlement_hash_available"
    )?.status,
    "pass"
  );

  const ackResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submitBody.submission.submissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YPFC-1001",
        ackStatus: "accepted",
        ackCode: "ACK-OK",
        ackNote: "wi0272 ack"
      },
      actorHeaders("payroll_operator", "PAY-YPFC-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: submitBody.submission.submissionId
      })
    }
  );
  assert.equal(ackResponse.status, 200);

  const preflightReadyResponse = await preflightRoute.GET(
    getRequest(
      "/api/payroll/year-end/preflight-checklist?year=2026&employeeId=EMP-YPFC-1001&nonTaxableAnnualIncomeKrw=0",
      actorHeaders("payroll_operator", "PAY-YPFC-1001", organization.id)
    )
  );
  assert.equal(preflightReadyResponse.status, 200);
  const preflightReadyBody = await readJson<{
    checklist: {
      summary: {
        readyToFinalize: boolean;
        failCount: number;
      };
    };
  }>(preflightReadyResponse);
  assert.equal(preflightReadyBody.checklist.summary.readyToFinalize, true);
  assert.equal(preflightReadyBody.checklist.summary.failCount, 0);
}

run()
  .then(() => {
    console.log("e2e-wi0272-payroll-year-end-preflight-checklist.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
