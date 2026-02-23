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
  const exportRoute = await import("../../src/app/api/payroll/year-end/export-filing-data/route.ts");
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

  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollContract, /hash guard/i);
  assert.match(payrollTestCases, /Year-End Hash Guard Regression Suite Gate/);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Year-End Hash Guard Regression Suite"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YHGR-1001",
    organizationId: organization.id,
    name: "Year-End Hash Guard Regression Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YHGR-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 2_100_000,
    withholdingTaxKrw: 80_000,
    socialInsuranceKrw: 70_000,
    otherDeductionsKrw: 10_000,
    totalDeductionsKrw: 160_000,
    netPayKrw: 1_940_000,
    sourceRecordCount: 1
  });
  const runTwo = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YHGR-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 1_700_000,
    withholdingTaxKrw: 65_000,
    socialInsuranceKrw: 55_000,
    otherDeductionsKrw: 10_000,
    totalDeductionsKrw: 130_000,
    netPayKrw: 1_570_000,
    sourceRecordCount: 1
  });
  for (const run of [runOne, runTwo]) {
    await memoryDataAccess.payroll.update(run.id, {
      state: "CONFIRMED",
      confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
      confirmedBy: "PAY-YHGR-1001",
      payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
      payslipDistributedBy: "PAY-YHGR-1001",
      payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
      payslipReceiptConfirmedBy: "EMP-YHGR-1001"
    });
  }

  const baseFinalizePayload = {
    year: 2026,
    employeeId: "EMP-YHGR-1001",
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

  const previewFinalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        ...baseFinalizePayload,
        apply: false,
        finalizedByNote: "wi0273 preview"
      },
      actorHeaders("payroll_operator", "PAY-YHGR-1001", organization.id)
    )
  );
  assert.equal(previewFinalizeResponse.status, 200);
  const previewFinalizeBody = await readJson<{
    settlement: {
      settlementHash: string;
    };
  }>(previewFinalizeResponse);
  const settlementHash = previewFinalizeBody.settlement.settlementHash;
  assert.match(settlementHash, /^[a-f0-9]{64}$/);

  const applyMismatchResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        ...baseFinalizePayload,
        apply: true,
        finalizedByNote: "wi0273 apply mismatch",
        expectedSettlementHash: "0".repeat(64)
      },
      actorHeaders("payroll_operator", "PAY-YHGR-1001", organization.id)
    )
  );
  assert.equal(applyMismatchResponse.status, 409);

  const applyResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        ...baseFinalizePayload,
        apply: true,
        finalizedByNote: "wi0273 apply",
        expectedSettlementHash: settlementHash
      },
      actorHeaders("payroll_operator", "PAY-YHGR-1001", organization.id)
    )
  );
  assert.equal(applyResponse.status, 200);

  const exportMismatchResponse = await exportRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/export-filing-data",
      {
        year: 2026,
        employeeId: "EMP-YHGR-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: "f".repeat(64)
      },
      actorHeaders("payroll_operator", "PAY-YHGR-1001", organization.id)
    )
  );
  assert.equal(exportMismatchResponse.status, 409);

  const exportResponse = await exportRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/export-filing-data",
      {
        year: 2026,
        employeeId: "EMP-YHGR-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: settlementHash
      },
      actorHeaders("payroll_operator", "PAY-YHGR-1001", organization.id)
    )
  );
  assert.equal(exportResponse.status, 200);

  const submitMismatchResponse = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YHGR-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: "a".repeat(64),
        transport: "manual_portal",
        submissionNote: "wi0273 submit mismatch"
      },
      actorHeaders("payroll_operator", "PAY-YHGR-1001", organization.id)
    )
  );
  assert.equal(submitMismatchResponse.status, 409);

  const submitResponse = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YHGR-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: settlementHash,
        transport: "manual_portal",
        submissionNote: "wi0273 submit"
      },
      actorHeaders("payroll_operator", "PAY-YHGR-1001", organization.id)
    )
  );
  assert.equal(submitResponse.status, 200);
  const submitBody = await readJson<{
    submission: {
      submissionId: string;
      settlementHash: string | null;
    };
  }>(submitResponse);
  assert.equal(submitBody.submission.settlementHash, settlementHash);

  const ackHashMismatchResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submitBody.submission.submissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YHGR-1001",
        expectedSettlementHash: "b".repeat(64),
        ackStatus: "accepted",
        ackCode: "ACK-OK"
      },
      actorHeaders("payroll_operator", "PAY-YHGR-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: submitBody.submission.submissionId
      })
    }
  );
  assert.equal(ackHashMismatchResponse.status, 409);

  const ackRejectedResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submitBody.submission.submissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YHGR-1001",
        expectedSettlementHash: settlementHash,
        ackStatus: "rejected",
        ackCode: "ACK-REJECT",
        rejectionReasonCode: "VALIDATION_ERROR",
        rejectionReasonDetail: "wi0273 prepare resubmit"
      },
      actorHeaders("payroll_operator", "PAY-YHGR-1001", organization.id)
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
        employeeId: "EMP-YHGR-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: "c".repeat(64),
        transport: "manual_portal",
        submissionNote: "wi0273 resubmit mismatch",
        resubmissionReason: "hash mismatch regression"
      },
      actorHeaders("payroll_operator", "PAY-YHGR-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: submitBody.submission.submissionId
      })
    }
  );
  assert.equal(resubmitMismatchResponse.status, 409);

  const resubmitResponse = await filingResubmitRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submitBody.submission.submissionId}/resubmit`,
      {
        year: 2026,
        employeeId: "EMP-YHGR-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: settlementHash,
        transport: "manual_portal",
        submissionNote: "wi0273 resubmit",
        resubmissionReason: "hash guard suite"
      },
      actorHeaders("payroll_operator", "PAY-YHGR-1001", organization.id)
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
    };
  }>(resubmitResponse);
  assert.equal(resubmitBody.submission.settlementHash, settlementHash);

  const listByHashResponse = await filingSubmissionRoute.GET(
    getRequest(
      `/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YHGR-1001&settlementHash=${settlementHash.slice(0, 12)}`,
      actorHeaders("payroll_operator", "PAY-YHGR-1001", organization.id)
    )
  );
  assert.equal(listByHashResponse.status, 200);
  const listByHashBody = await readJson<{
    submissions: Array<{
      settlementHash: string | null;
    }>;
  }>(listByHashResponse);
  assert.ok(listByHashBody.submissions.length >= 2);
  assert.ok(
    listByHashBody.submissions.every((submission) =>
      (submission.settlementHash ?? "").startsWith(settlementHash.slice(0, 12))
    )
  );
}

run()
  .then(() => {
    console.log("e2e-wi0273-payroll-year-end-hash-guard-regression-suite.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
