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
  assert.match(payrollApiSpec, /filing-submissions\/\{submissionId\}\/ack/);
  assert.match(payrollApiSpec, /expectedSettlementHash/);
  assert.match(payrollContract, /acknowledgement settlement-hash guard workflow/i);
  assert.match(payrollTestCases, /Year-End Filing ACK Settlement Hash Gate/);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Filing ACK Settlement Hash Guard"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YFAH-1001",
    organizationId: organization.id,
    name: "Filing ACK Hash Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");

  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YFAH-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 2_200_000,
    withholdingTaxKrw: 82_000,
    socialInsuranceKrw: 74_000,
    otherDeductionsKrw: 8_000,
    totalDeductionsKrw: 164_000,
    netPayKrw: 2_036_000,
    sourceRecordCount: 1
  });
  const runTwo = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YFAH-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 1_800_000,
    withholdingTaxKrw: 65_000,
    socialInsuranceKrw: 62_000,
    otherDeductionsKrw: 7_000,
    totalDeductionsKrw: 134_000,
    netPayKrw: 1_666_000,
    sourceRecordCount: 1
  });

  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-30T11:00:00+09:00"),
    confirmedBy: "PAY-YFAH-1001",
    payslipDistributedAt: new Date("2026-12-30T11:10:00+09:00"),
    payslipDistributedBy: "PAY-YFAH-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-30T11:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFAH-1001"
  });
  await memoryDataAccess.payroll.update(runTwo.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-30T12:00:00+09:00"),
    confirmedBy: "PAY-YFAH-1001",
    payslipDistributedAt: new Date("2026-12-30T12:10:00+09:00"),
    payslipDistributedBy: "PAY-YFAH-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-30T12:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFAH-1001"
  });

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YFAH-1001",
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
        finalizedByNote: "wi0268 finalize"
      },
      actorHeaders("payroll_operator", "PAY-YFAH-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200);
  const finalizeBody = await readJson<{
    settlement: {
      settlementHash: string;
    };
  }>(finalizeResponse);
  assert.match(finalizeBody.settlement.settlementHash, /^[a-f0-9]{64}$/);

  const submitResponse = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YFAH-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: finalizeBody.settlement.settlementHash,
        transport: "manual_portal",
        submissionNote: "wi0268 ack hash guard submit"
      },
      actorHeaders("payroll_operator", "PAY-YFAH-1001", organization.id)
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

  const ackMismatchResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submitBody.submission.submissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFAH-1001",
        expectedSettlementHash: "f".repeat(64),
        ackStatus: "accepted",
        ackCode: "ACK-OK",
        ackNote: "ack mismatch test"
      },
      actorHeaders("payroll_operator", "PAY-YFAH-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: submitBody.submission.submissionId
      })
    }
  );
  assert.equal(ackMismatchResponse.status, 409);
  const ackMismatchBody = await readJson<{
    details: {
      expectedSettlementHash: string;
      submissionSettlementHash: string | null;
    };
  }>(ackMismatchResponse);
  assert.equal(ackMismatchBody.details.expectedSettlementHash, "f".repeat(64));
  assert.equal(
    ackMismatchBody.details.submissionSettlementHash,
    finalizeBody.settlement.settlementHash
  );

  const ackResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submitBody.submission.submissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFAH-1001",
        expectedSettlementHash: finalizeBody.settlement.settlementHash.toUpperCase(),
        ackStatus: "accepted",
        ackCode: "ACK-OK",
        ackNote: "ack with expected hash"
      },
      actorHeaders("payroll_operator", "PAY-YFAH-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: submitBody.submission.submissionId
      })
    }
  );
  assert.equal(ackResponse.status, 200);
  const ackBody = await readJson<{
    submission: {
      status: "submitted" | "acknowledged" | "canceled";
      settlementHash: string | null;
      ack: {
        ackStatus: "accepted" | "rejected";
      } | null;
    };
  }>(ackResponse);
  assert.equal(ackBody.submission.status, "acknowledged");
  assert.equal(ackBody.submission.ack?.ackStatus, "accepted");
  assert.equal(ackBody.submission.settlementHash, finalizeBody.settlement.settlementHash);

  const ackLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_package_acknowledged"],
    entityType: "PayrollYearEnd",
    entityId: "2026_EMP-YFAH-1001",
    limit: 20
  });
  assert.ok(ackLogs.length >= 1);
  const ackPayload = ackLogs[ackLogs.length - 1]?.payload as {
    settlementHash?: string | null;
    expectedSettlementHash?: string | null;
  };
  assert.equal(ackPayload.settlementHash, finalizeBody.settlement.settlementHash);
  assert.equal(
    ackPayload.expectedSettlementHash,
    finalizeBody.settlement.settlementHash.toLowerCase()
  );
}

run()
  .then(() => {
    console.log("e2e-wi0268-payroll-year-end-filing-ack-settlement-hash-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
