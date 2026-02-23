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
  assert.match(payrollApiSpec, /filing-submissions/);
  assert.match(payrollApiSpec, /expectedSettlementHash/);
  assert.match(payrollApiSpec, /settlementHash/);
  assert.match(payrollContract, /submit\/resubmit settlement-hash guard/i);
  assert.match(payrollContract, /settlementHash/);
  assert.match(payrollTestCases, /Year-End Filing Submission Settlement Hash Gate/);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Filing Submission Settlement Hash Guard"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YFSH-1001",
    organizationId: organization.id,
    name: "Filing Settlement Hash Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YFSH-1001",
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
    employeeId: "EMP-YFSH-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 1_500_000,
    withholdingTaxKrw: 60_000,
    socialInsuranceKrw: 55_000,
    otherDeductionsKrw: 5_000,
    totalDeductionsKrw: 120_000,
    netPayKrw: 1_380_000,
    sourceRecordCount: 1
  });

  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T11:00:00+09:00"),
    confirmedBy: "PAY-YFSH-1001",
    payslipDistributedAt: new Date("2026-12-31T11:10:00+09:00"),
    payslipDistributedBy: "PAY-YFSH-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T11:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFSH-1001"
  });
  await memoryDataAccess.payroll.update(runTwo.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T12:00:00+09:00"),
    confirmedBy: "PAY-YFSH-1001",
    payslipDistributedAt: new Date("2026-12-31T12:10:00+09:00"),
    payslipDistributedBy: "PAY-YFSH-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T12:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFSH-1001"
  });

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YFSH-1001",
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
        finalizedByNote: "wi0267 finalize"
      },
      actorHeaders("payroll_operator", "PAY-YFSH-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200);
  const finalizeBody = await readJson<{
    settlement: {
      settlementHash: string;
    };
  }>(finalizeResponse);
  assert.match(finalizeBody.settlement.settlementHash, /^[a-f0-9]{64}$/);

  const submitMismatchResponse = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YFSH-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: "0".repeat(64),
        transport: "manual_portal",
        submissionNote: "submit mismatch hash"
      },
      actorHeaders("payroll_operator", "PAY-YFSH-1001", organization.id)
    )
  );
  assert.equal(submitMismatchResponse.status, 409);
  const submitMismatchBody = await readJson<{
    details: {
      expectedSettlementHash: string;
      computedSettlementHash: string;
    };
  }>(submitMismatchResponse);
  assert.equal(submitMismatchBody.details.expectedSettlementHash, "0".repeat(64));
  assert.equal(
    submitMismatchBody.details.computedSettlementHash,
    finalizeBody.settlement.settlementHash
  );

  const submitResponse = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YFSH-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: finalizeBody.settlement.settlementHash,
        transport: "manual_portal",
        submissionNote: "submit with expected hash"
      },
      actorHeaders("payroll_operator", "PAY-YFSH-1001", organization.id)
    )
  );
  assert.equal(submitResponse.status, 200);
  const submitBody = await readJson<{
    submission: {
      submissionId: string;
      settlementHash: string | null;
      status: "submitted" | "acknowledged";
    };
  }>(submitResponse);
  assert.equal(submitBody.submission.status, "submitted");
  assert.equal(submitBody.submission.settlementHash, finalizeBody.settlement.settlementHash);

  const ackRejectedResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submitBody.submission.submissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFSH-1001",
        ackStatus: "rejected",
        ackCode: "ACK-REJECT",
        rejectionReasonCode: "MISSING_SUPPORTING_EVIDENCE",
        rejectionReasonDetail: "hash guard regression"
      },
      actorHeaders("payroll_operator", "PAY-YFSH-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: submitBody.submission.submissionId
      })
    }
  );
  assert.equal(ackRejectedResponse.status, 200);

  const resubmitMismatchResponse = await filingResubmitRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submitBody.submission.submissionId}/resubmit`,
      {
        year: 2026,
        employeeId: "EMP-YFSH-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: "f".repeat(64),
        transport: "manual_portal",
        submissionNote: "resubmit mismatch hash",
        resubmissionReason: "hash mismatch regression"
      },
      actorHeaders("payroll_operator", "PAY-YFSH-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: submitBody.submission.submissionId
      })
    }
  );
  assert.equal(resubmitMismatchResponse.status, 409);
  const resubmitMismatchBody = await readJson<{
    details: {
      expectedSettlementHash: string;
      computedSettlementHash: string;
    };
  }>(resubmitMismatchResponse);
  assert.equal(resubmitMismatchBody.details.expectedSettlementHash, "f".repeat(64));
  assert.equal(
    resubmitMismatchBody.details.computedSettlementHash,
    finalizeBody.settlement.settlementHash
  );

  const resubmitResponse = await filingResubmitRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submitBody.submission.submissionId}/resubmit`,
      {
        year: 2026,
        employeeId: "EMP-YFSH-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: finalizeBody.settlement.settlementHash,
        transport: "manual_portal",
        submissionNote: "resubmit with expected hash",
        resubmissionReason: "hash guard success path"
      },
      actorHeaders("payroll_operator", "PAY-YFSH-1001", organization.id)
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
      settlementHash: string | null;
      status: "submitted" | "acknowledged";
      resubmissionOfSubmissionId: string | null;
    };
  }>(resubmitResponse);
  assert.equal(resubmitBody.submission.status, "submitted");
  assert.equal(resubmitBody.submission.resubmissionOfSubmissionId, submitBody.submission.submissionId);
  assert.equal(resubmitBody.submission.settlementHash, finalizeBody.settlement.settlementHash);

  const listResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFSH-1001",
      actorHeaders("payroll_operator", "PAY-YFSH-1001", organization.id)
    )
  );
  assert.equal(listResponse.status, 200);
  const listBody = await readJson<{
    submissions: Array<{
      submissionId: string;
      settlementHash: string | null;
    }>;
  }>(listResponse);
  assert.ok(listBody.submissions.length >= 2);
  assert.ok(
    listBody.submissions.every(
      (submission) => submission.settlementHash === finalizeBody.settlement.settlementHash
    )
  );
}

run()
  .then(() => {
    console.log("e2e-wi0267-payroll-year-end-filing-submission-settlement-hash-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
