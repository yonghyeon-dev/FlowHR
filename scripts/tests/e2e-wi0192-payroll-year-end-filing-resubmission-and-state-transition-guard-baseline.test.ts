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

  const filingConsoleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");

  assert.match(
    filingConsoleSource,
    /copy\.resubmitSubmissionAction/,
    "filing console should expose resubmit action with locale copy"
  );
  assert.match(payrollApiSpec, /\/payroll\/year-end\/filing-submissions\/\{submissionId\}\/resubmit:/, "api spec should include resubmit endpoint");
  assert.match(payrollContract, /payroll\.year_end\.filing_package\.resubmitted\.v1/, "contract should include resubmitted event");

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Filing Resubmission"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YFR-1001",
    organizationId: organization.id,
    name: "Filing Resubmit Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YFR-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 300000,
    withholdingTaxKrw: 15000,
    socialInsuranceKrw: 12000,
    otherDeductionsKrw: 3000,
    totalDeductionsKrw: 30000,
    netPayKrw: 270000,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YFR-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YFR-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFR-1001"
  });

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YFR-1001",
        nonTaxableAnnualIncomeKrw: 10000,
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
        finalizedByNote: "wi0192 finalize"
      },
      actorHeaders("payroll_operator", "PAY-YFR-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200, "finalization should succeed");

  const initialSubmitResponse = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YFR-1001",
        format: "csv",
        validationMode: "strict",
        transport: "manual_portal",
        submissionNote: "initial submit"
      },
      actorHeaders("payroll_operator", "PAY-YFR-1001", organization.id)
    )
  );
  assert.equal(initialSubmitResponse.status, 200, "initial submission should succeed");
  const initialSubmitBody = await readJson<{
    submission: {
      submissionId: string;
      attempt: number;
      status: "submitted" | "acknowledged";
    };
  }>(initialSubmitResponse);
  assert.equal(initialSubmitBody.submission.attempt, 1);
  assert.equal(initialSubmitBody.submission.status, "submitted");

  const secondSubmitWhilePending = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YFR-1001",
        format: "jsonl",
        validationMode: "strict",
        transport: "nts_api_mock"
      },
      actorHeaders("payroll_operator", "PAY-YFR-1001", organization.id)
    )
  );
  assert.equal(secondSubmitWhilePending.status, 409, "pending submission should block new submission");

  const resubmitBeforeAck = await filingResubmitRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${initialSubmitBody.submission.submissionId}/resubmit`,
      {
        year: 2026,
        employeeId: "EMP-YFR-1001",
        format: "json",
        validationMode: "basic",
        transport: "hometax_upload",
        resubmissionReason: "before ack"
      },
      actorHeaders("payroll_operator", "PAY-YFR-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: initialSubmitBody.submission.submissionId
      })
    }
  );
  assert.equal(resubmitBeforeAck.status, 409, "resubmit should be blocked before rejected ack");

  const rejectAckResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${initialSubmitBody.submission.submissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFR-1001",
        ackStatus: "rejected",
        ackCode: "ACK-REJECT",
        ackNote: "schema issue"
      },
      actorHeaders("payroll_operator", "PAY-YFR-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: initialSubmitBody.submission.submissionId
      })
    }
  );
  assert.equal(rejectAckResponse.status, 200, "reject ack should succeed");

  const resubmitResponse = await filingResubmitRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${initialSubmitBody.submission.submissionId}/resubmit`,
      {
        year: 2026,
        employeeId: "EMP-YFR-1001",
        format: "jsonl",
        validationMode: "strict",
        transport: "hometax_upload",
        resubmissionReason: "fixed validation issue",
        submissionNote: "resubmit #1"
      },
      actorHeaders("payroll_operator", "PAY-YFR-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: initialSubmitBody.submission.submissionId
      })
    }
  );
  assert.equal(resubmitResponse.status, 200, "resubmission should succeed after rejected ack");
  const resubmitBody = await readJson<{
    submission: {
      submissionId: string;
      attempt: number;
      resubmissionOfSubmissionId: string | null;
      status: "submitted" | "acknowledged";
    };
  }>(resubmitResponse);
  assert.equal(resubmitBody.submission.attempt, 2);
  assert.equal(resubmitBody.submission.resubmissionOfSubmissionId, initialSubmitBody.submission.submissionId);
  assert.equal(resubmitBody.submission.status, "submitted");

  const acceptAckForResubmitted = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${resubmitBody.submission.submissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFR-1001",
        ackStatus: "accepted",
        ackCode: "ACK-OK"
      },
      actorHeaders("payroll_operator", "PAY-YFR-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: resubmitBody.submission.submissionId
      })
    }
  );
  assert.equal(acceptAckForResubmitted.status, 200, "ack for resubmitted submission should succeed");

  const duplicateResubmitFromSameSource = await filingResubmitRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${initialSubmitBody.submission.submissionId}/resubmit`,
      {
        year: 2026,
        employeeId: "EMP-YFR-1001",
        format: "json",
        validationMode: "basic",
        transport: "manual_portal"
      },
      actorHeaders("payroll_operator", "PAY-YFR-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: initialSubmitBody.submission.submissionId
      })
    }
  );
  assert.equal(duplicateResubmitFromSameSource.status, 409, "duplicate resubmission should be blocked");

  const resubmitFromAccepted = await filingResubmitRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${resubmitBody.submission.submissionId}/resubmit`,
      {
        year: 2026,
        employeeId: "EMP-YFR-1001",
        format: "json",
        validationMode: "basic",
        transport: "manual_portal"
      },
      actorHeaders("payroll_operator", "PAY-YFR-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: resubmitBody.submission.submissionId
      })
    }
  );
  assert.equal(resubmitFromAccepted.status, 409, "accepted submission should not be resubmitted");

  const listResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFR-1001",
      actorHeaders("payroll_operator", "PAY-YFR-1001", organization.id)
    )
  );
  assert.equal(listResponse.status, 200);
  const listBody = await readJson<{
    submissions: Array<{
      submissionId: string;
      attempt: number;
      resubmissionOfSubmissionId: string | null;
      status: "submitted" | "acknowledged";
      ack: { ackStatus: "accepted" | "rejected" } | null;
    }>;
  }>(listResponse);
  assert.equal(listBody.submissions.length, 2);
  const firstAttempt = listBody.submissions.find((item) => item.attempt === 1);
  const secondAttempt = listBody.submissions.find((item) => item.attempt === 2);
  assert.ok(firstAttempt);
  assert.ok(secondAttempt);
  assert.equal(firstAttempt!.status, "acknowledged");
  assert.equal(firstAttempt!.ack?.ackStatus, "rejected");
  assert.equal(secondAttempt!.status, "acknowledged");
  assert.equal(secondAttempt!.ack?.ackStatus, "accepted");
  assert.equal(secondAttempt!.resubmissionOfSubmissionId, firstAttempt!.submissionId);

  const unauthorizedResubmit = await filingResubmitRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${firstAttempt!.submissionId}/resubmit`,
      {
        year: 2026,
        employeeId: "EMP-YFR-1001",
        format: "json",
        validationMode: "basic",
        transport: "manual_portal"
      },
      actorHeaders("employee", "EMP-YFR-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: firstAttempt!.submissionId
      })
    }
  );
  assert.equal(unauthorizedResubmit.status, 403, "employee role should not resubmit filing package");

  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1 = "false";
  const flagOffResubmit = await filingResubmitRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${firstAttempt!.submissionId}/resubmit`,
      {
        year: 2026,
        employeeId: "EMP-YFR-1001",
        format: "json",
        validationMode: "basic",
        transport: "manual_portal"
      },
      actorHeaders("payroll_operator", "PAY-YFR-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: firstAttempt!.submissionId
      })
    }
  );
  assert.equal(flagOffResubmit.status, 409, "resubmit should be blocked when feature flag is disabled");

  const submittedLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_package_submitted"],
    entityType: "PayrollYearEnd"
  });
  const resubmittedLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_package_resubmitted"],
    entityType: "PayrollYearEnd"
  });
  const ackLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_package_acknowledged"],
    entityType: "PayrollYearEnd"
  });
  const resubmitFailLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_resubmit.failed"],
    entityType: "PayrollYearEnd"
  });
  assert.equal(submittedLogs.length, 1, "initial submit should append submission audit");
  assert.equal(resubmittedLogs.length, 1, "resubmit should append resubmission audit");
  assert.equal(ackLogs.length, 2, "two acknowledgements should be audited");
  assert.ok(resubmitFailLogs.length >= 4, "failed resubmit attempts should be audited");
}

run()
  .then(() => {
    console.log("e2e-wi0192-payroll-year-end-filing-resubmission-and-state-transition-guard-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
