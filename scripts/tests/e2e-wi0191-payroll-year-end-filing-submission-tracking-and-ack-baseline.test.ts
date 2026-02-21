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

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1 = "true";

  const filingConsoleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");

  assert.match(filingConsoleSource, /Submit Filing Package/, "filing console should support submission action");
  assert.match(filingConsoleSource, /Acknowledge Submission/, "filing console should support ack action");
  assert.match(filingConsoleSource, /Filing Submissions/, "filing console should render submission list panel");
  assert.match(payrollApiSpec, /\/payroll\/year-end\/filing-submissions:/, "api spec should include filing submission endpoint");
  assert.match(payrollApiSpec, /\/payroll\/year-end\/filing-submissions\/\{submissionId\}\/ack:/, "api spec should include filing ack endpoint");
  assert.match(payrollContract, /payroll_year_end_filing_submission_v1/, "contract should include submission feature flag");
  assert.match(payrollContract, /filing_package\.submitted\.v1/, "contract should include filing submission event");
  assert.match(payrollContract, /filing_package\.acknowledged\.v1/, "contract should include filing ack event");

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Filing Submission"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YFS-1001",
    organizationId: organization.id,
    name: "Filing Submission Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YFS-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 200000,
    withholdingTaxKrw: 10000,
    socialInsuranceKrw: 8000,
    otherDeductionsKrw: 2000,
    totalDeductionsKrw: 20000,
    netPayKrw: 180000,
    sourceRecordCount: 1
  });
  const runTwo = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YFS-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 250000,
    withholdingTaxKrw: 12000,
    socialInsuranceKrw: 9000,
    otherDeductionsKrw: 3000,
    totalDeductionsKrw: 24000,
    netPayKrw: 226000,
    sourceRecordCount: 1
  });

  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T11:00:00+09:00"),
    confirmedBy: "PAY-YFS-1001",
    payslipDistributedAt: new Date("2026-12-31T11:10:00+09:00"),
    payslipDistributedBy: "PAY-YFS-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T11:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFS-1001"
  });
  await memoryDataAccess.payroll.update(runTwo.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T12:00:00+09:00"),
    confirmedBy: "PAY-YFS-1001",
    payslipDistributedAt: new Date("2026-12-31T12:10:00+09:00"),
    payslipDistributedBy: "PAY-YFS-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T12:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFS-1001"
  });

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YFS-1001",
        nonTaxableAnnualIncomeKrw: 5000,
        additionalTaxCreditKrw: 2000,
        annualIncomeTaxRate: 0.03,
        localIncomeTaxRate: 0.1,
        deductionItems: {
          personalPensionKrw: 5000,
          insurancePremiumKrw: 5000,
          medicalExpenseKrw: 5000,
          educationExpenseKrw: 5000,
          donationKrw: 5000,
          housingSavingsKrw: 5000
        },
        apply: true,
        finalizedByNote: "wi0191 finalize"
      },
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200, "year-end finalization should succeed before filing submission");

  const submitResponse = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YFS-1001",
        format: "jsonl",
        validationMode: "strict",
        transport: "hometax_upload",
        submissionNote: "submit to hometax"
      },
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    )
  );
  assert.equal(submitResponse.status, 200, "filing submission should succeed");
  const submitBody = await readJson<{
    submission: {
      submissionId: string;
      status: "submitted" | "acknowledged";
      format: "json" | "csv" | "jsonl" | "hometax_csv";
      transport: "manual_portal" | "hometax_upload" | "nts_api_mock";
      ack: null | unknown;
    };
  }>(submitResponse);
  assert.match(submitBody.submission.submissionId, /^YFS-2026-EMP-YFS-1001-/);
  assert.equal(submitBody.submission.status, "submitted");
  assert.equal(submitBody.submission.format, "jsonl");
  assert.equal(submitBody.submission.transport, "hometax_upload");
  assert.equal(submitBody.submission.ack, null);

  const listResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFS-1001",
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    )
  );
  assert.equal(listResponse.status, 200, "filing submission list should succeed");
  const listBody = await readJson<{
    submissions: Array<{ submissionId: string; status: "submitted" | "acknowledged" }>;
  }>(listResponse);
  assert.equal(listBody.submissions.length, 1);
  assert.equal(listBody.submissions[0]!.submissionId, submitBody.submission.submissionId);
  assert.equal(listBody.submissions[0]!.status, "submitted");

  const ackResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submitBody.submission.submissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFS-1001",
        ackStatus: "accepted",
        ackCode: "ACK-2026-OK",
        ackNote: "received"
      },
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: submitBody.submission.submissionId
      })
    }
  );
  assert.equal(ackResponse.status, 200, "filing ack should succeed");
  const ackBody = await readJson<{
    submission: {
      status: "submitted" | "acknowledged";
      ack: {
        ackStatus: "accepted" | "rejected";
        ackCode: string | null;
      } | null;
    };
  }>(ackResponse);
  assert.equal(ackBody.submission.status, "acknowledged");
  assert.equal(ackBody.submission.ack?.ackStatus, "accepted");
  assert.equal(ackBody.submission.ack?.ackCode, "ACK-2026-OK");

  const duplicateAckResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submitBody.submission.submissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFS-1001",
        ackStatus: "accepted"
      },
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: submitBody.submission.submissionId
      })
    }
  );
  assert.equal(duplicateAckResponse.status, 409, "already acknowledged submission should be rejected");

  const unknownAckResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions/YFS-unknown/ack",
      {
        year: 2026,
        employeeId: "EMP-YFS-1001",
        ackStatus: "rejected"
      },
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: "YFS-unknown"
      })
    }
  );
  assert.equal(unknownAckResponse.status, 404, "unknown submission ack should return 404");

  const unauthorizedSubmitResponse = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YFS-1001",
        format: "json",
        validationMode: "basic",
        transport: "manual_portal"
      },
      actorHeaders("employee", "EMP-YFS-1001", organization.id)
    )
  );
  assert.equal(unauthorizedSubmitResponse.status, 403, "employee role should not submit filing package");

  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1 = "false";
  const flagOffListResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFS-1001",
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    )
  );
  assert.equal(flagOffListResponse.status, 409, "submission list should be blocked when feature flag is disabled");

  const submissionLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_package_submitted"],
    entityType: "PayrollYearEnd"
  });
  const ackLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_package_acknowledged"],
    entityType: "PayrollYearEnd"
  });
  const ackFailLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_ack.failed"],
    entityType: "PayrollYearEnd"
  });
  assert.equal(submissionLogs.length, 1, "submission create should append audit log");
  assert.equal(ackLogs.length, 1, "ack success should append audit log");
  assert.equal(ackFailLogs.length, 2, "duplicate and unknown ack should append failure audit logs");
}

run()
  .then(() => {
    console.log("e2e-wi0191-payroll-year-end-filing-submission-tracking-and-ack-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
