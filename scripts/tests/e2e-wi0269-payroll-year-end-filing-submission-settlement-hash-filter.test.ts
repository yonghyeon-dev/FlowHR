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
  const filingSubmissionRoute = await import("../../src/app/api/payroll/year-end/filing-submissions/route.ts");
  const filingAckRoute = await import(
    "../../src/app/api/payroll/year-end/filing-submissions/[submissionId]/ack/route.ts"
  );
  const filingResubmitRoute = await import(
    "../../src/app/api/payroll/year-end/filing-submissions/[submissionId]/resubmit/route.ts"
  );

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1 = "true";

  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollApiSpec, /name:\s+settlementHash/);
  assert.match(payrollContract, /settlement-hash filter workflow/i);
  assert.match(payrollTestCases, /Year-End Filing Settlement Hash Filter Gate/);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Filing Submission Settlement Hash Filter"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YFSF-1001",
    organizationId: organization.id,
    name: "Filing Hash Filter Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YFSF-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 2_500_000,
    withholdingTaxKrw: 92_000,
    socialInsuranceKrw: 78_000,
    otherDeductionsKrw: 8_000,
    totalDeductionsKrw: 178_000,
    netPayKrw: 2_322_000,
    sourceRecordCount: 1
  });
  const runTwo = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YFSF-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 1_600_000,
    withholdingTaxKrw: 66_000,
    socialInsuranceKrw: 55_000,
    otherDeductionsKrw: 9_000,
    totalDeductionsKrw: 130_000,
    netPayKrw: 1_470_000,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YFSF-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YFSF-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFSF-1001"
  });
  await memoryDataAccess.payroll.update(runTwo.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YFSF-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YFSF-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFSF-1001"
  });

  const finalizeAResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YFSF-1001",
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
        finalizedByNote: "wi0269 finalize A"
      },
      actorHeaders("payroll_operator", "PAY-YFSF-1001", organization.id)
    )
  );
  assert.equal(finalizeAResponse.status, 200);
  const finalizeABody = await readJson<{
    settlement: {
      settlementHash: string;
    };
  }>(finalizeAResponse);

  const submitResponse = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YFSF-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: finalizeABody.settlement.settlementHash,
        transport: "manual_portal",
        submissionNote: "wi0269 initial submission"
      },
      actorHeaders("payroll_operator", "PAY-YFSF-1001", organization.id)
    )
  );
  assert.equal(submitResponse.status, 200);
  const submitBody = await readJson<{
    submission: {
      submissionId: string;
      settlementHash: string | null;
    };
  }>(submitResponse);
  assert.equal(submitBody.submission.settlementHash, finalizeABody.settlement.settlementHash);

  const ackRejectedResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submitBody.submission.submissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFSF-1001",
        ackStatus: "rejected",
        ackCode: "ACK-REJECT",
        rejectionReasonCode: "VALIDATION_ERROR",
        rejectionReasonDetail: "wi0269 prepare resubmit"
      },
      actorHeaders("payroll_operator", "PAY-YFSF-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: submitBody.submission.submissionId
      })
    }
  );
  assert.equal(ackRejectedResponse.status, 200);

  const finalizeBResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YFSF-1001",
        nonTaxableAnnualIncomeKrw: 0,
        additionalTaxCreditKrw: 0,
        annualIncomeTaxRate: 0.03,
        localIncomeTaxRate: 0.1,
        deductionItems: {
          personalPensionKrw: 300_000,
          insurancePremiumKrw: 150_000,
          medicalExpenseKrw: 100_000,
          educationExpenseKrw: 0,
          donationKrw: 0,
          housingSavingsKrw: 0
        },
        apply: true,
        finalizedByNote: "wi0269 finalize B"
      },
      actorHeaders("payroll_operator", "PAY-YFSF-1001", organization.id)
    )
  );
  assert.equal(finalizeBResponse.status, 200);
  const finalizeBBody = await readJson<{
    settlement: {
      settlementHash: string;
    };
  }>(finalizeBResponse);
  assert.notEqual(finalizeBBody.settlement.settlementHash, finalizeABody.settlement.settlementHash);

  const resubmitResponse = await filingResubmitRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submitBody.submission.submissionId}/resubmit`,
      {
        year: 2026,
        employeeId: "EMP-YFSF-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: finalizeBBody.settlement.settlementHash,
        transport: "manual_portal",
        submissionNote: "wi0269 resubmission",
        resubmissionReason: "new finalized snapshot"
      },
      actorHeaders("payroll_operator", "PAY-YFSF-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: submitBody.submission.submissionId
      })
    }
  );
  assert.equal(resubmitResponse.status, 200);
  const resubmitBody = await readJson<{
    submission: {
      submissionId: string;
      settlementHash: string | null;
      resubmissionOfSubmissionId: string | null;
    };
  }>(resubmitResponse);
  assert.equal(resubmitBody.submission.resubmissionOfSubmissionId, submitBody.submission.submissionId);
  assert.equal(resubmitBody.submission.settlementHash, finalizeBBody.settlement.settlementHash);

  const listAllResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFSF-1001",
      actorHeaders("payroll_operator", "PAY-YFSF-1001", organization.id)
    )
  );
  assert.equal(listAllResponse.status, 200);
  const listAllBody = await readJson<{
    submissions: Array<{
      submissionId: string;
      settlementHash: string | null;
    }>;
  }>(listAllResponse);
  assert.equal(listAllBody.submissions.length, 2);

  const hashAPrefix = finalizeABody.settlement.settlementHash.slice(0, 10);
  const hashBPrefix = finalizeBBody.settlement.settlementHash.slice(0, 10);

  const listAResponse = await filingSubmissionRoute.GET(
    getRequest(
      `/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFSF-1001&settlementHash=${hashAPrefix}`,
      actorHeaders("payroll_operator", "PAY-YFSF-1001", organization.id)
    )
  );
  assert.equal(listAResponse.status, 200);
  const listABody = await readJson<{
    submissions: Array<{
      submissionId: string;
      settlementHash: string | null;
    }>;
  }>(listAResponse);
  assert.equal(listABody.submissions.length, 1);
  assert.equal(listABody.submissions[0]?.submissionId, submitBody.submission.submissionId);
  assert.ok(
    listABody.submissions.every((submission) =>
      (submission.settlementHash ?? "").toLowerCase().startsWith(hashAPrefix)
    )
  );

  const listBResponse = await filingSubmissionRoute.GET(
    getRequest(
      `/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFSF-1001&settlementHash=${hashBPrefix.toUpperCase()}`,
      actorHeaders("payroll_operator", "PAY-YFSF-1001", organization.id)
    )
  );
  assert.equal(listBResponse.status, 200);
  const listBBody = await readJson<{
    submissions: Array<{
      submissionId: string;
      settlementHash: string | null;
    }>;
  }>(listBResponse);
  assert.equal(listBBody.submissions.length, 1);
  assert.equal(listBBody.submissions[0]?.submissionId, resubmitBody.submission.submissionId);

  const invalidFilterResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFSF-1001&settlementHash=abc",
      actorHeaders("payroll_operator", "PAY-YFSF-1001", organization.id)
    )
  );
  assert.equal(invalidFilterResponse.status, 400);
}

run()
  .then(() => {
    console.log("e2e-wi0269-payroll-year-end-filing-submission-settlement-hash-filter.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
