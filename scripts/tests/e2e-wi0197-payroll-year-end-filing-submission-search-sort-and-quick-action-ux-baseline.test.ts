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
  const filingCancelRoute = await import(
    "../../src/app/api/payroll/year-end/filing-submissions/[submissionId]/cancel/route.ts"
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
    /Submission Search/,
    "filing console should expose submission search input"
  );
  assert.match(
    filingConsoleSource,
    /Submission Sort By/,
    "filing console should expose submission sort selector"
  );
  assert.match(
    filingConsoleSource,
    /Quick ACK Accepted/,
    "filing console should expose quick acknowledge action"
  );
  assert.match(
    filingConsoleSource,
    /Quick Resubmit/,
    "filing console should expose quick resubmit action"
  );
  assert.match(payrollApiSpec, /name:\s*search/, "api spec should include search query");
  assert.match(payrollApiSpec, /name:\s*sortBy/, "api spec should include sortBy query");
  assert.match(
    payrollApiSpec,
    /name:\s*sortDirection/,
    "api spec should include sortDirection query"
  );
  assert.match(
    payrollContract,
    /search\/sort/,
    "contract should include filing submission search/sort coverage"
  );

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Filing Search Sort"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YFSR-1001",
    organizationId: organization.id,
    name: "Filing Search Sort Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YFSR-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 520000,
    withholdingTaxKrw: 26000,
    socialInsuranceKrw: 16000,
    otherDeductionsKrw: 6000,
    totalDeductionsKrw: 48000,
    netPayKrw: 472000,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YFSR-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YFSR-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFSR-1001"
  });

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YFSR-1001",
        nonTaxableAnnualIncomeKrw: 10000,
        additionalTaxCreditKrw: 3000,
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
        finalizedByNote: "wi0197 finalize"
      },
      actorHeaders("payroll_operator", "PAY-YFSR-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200, "finalization should succeed");

  const submitResponse = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YFSR-1001",
        format: "csv",
        validationMode: "strict",
        transport: "manual_portal",
        submissionNote: "alpha-search-target"
      },
      actorHeaders("payroll_operator", "PAY-YFSR-1001", organization.id)
    )
  );
  assert.equal(submitResponse.status, 200, "initial submission should succeed");
  const submitBody = await readJson<{
    submission: {
      submissionId: string;
    };
  }>(submitResponse);
  const firstSubmissionId = submitBody.submission.submissionId;

  const rejectedAckResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${firstSubmissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFSR-1001",
        ackStatus: "rejected",
        ackCode: "ACK-REJECT-VALIDATION",
        rejectionReasonCode: "VALIDATION_ERROR",
        rejectionReasonDetail: "record mismatch",
        ackNote: "retry after correction"
      },
      actorHeaders("payroll_operator", "PAY-YFSR-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: firstSubmissionId
      })
    }
  );
  assert.equal(rejectedAckResponse.status, 200, "rejected ack should succeed");

  const resubmitResponse = await filingResubmitRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${firstSubmissionId}/resubmit`,
      {
        year: 2026,
        employeeId: "EMP-YFSR-1001",
        format: "csv",
        validationMode: "strict",
        transport: "hometax_upload",
        submissionNote: "beta-resubmit-target",
        resubmissionReason: "retry after rejection"
      },
      actorHeaders("payroll_operator", "PAY-YFSR-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: firstSubmissionId
      })
    }
  );
  assert.equal(resubmitResponse.status, 200, "resubmit should succeed");
  const resubmitBody = await readJson<{
    submission: {
      submissionId: string;
    };
  }>(resubmitResponse);
  const secondSubmissionId = resubmitBody.submission.submissionId;

  const cancelResponse = await filingCancelRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${secondSubmissionId}/cancel`,
      {
        year: 2026,
        employeeId: "EMP-YFSR-1001"
      },
      actorHeaders("payroll_operator", "PAY-YFSR-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: secondSubmissionId
      })
    }
  );
  assert.equal(cancelResponse.status, 200, "cancel should succeed");

  const listSearchByNoteResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFSR-1001&search=alpha-search-target",
      actorHeaders("payroll_operator", "PAY-YFSR-1001", organization.id)
    )
  );
  assert.equal(listSearchByNoteResponse.status, 200, "search by note should succeed");
  const listSearchByNoteBody = await readJson<{
    submissions: Array<{
      submissionId: string;
    }>;
  }>(listSearchByNoteResponse);
  assert.deepEqual(
    listSearchByNoteBody.submissions.map((item) => item.submissionId),
    [firstSubmissionId],
    "search should match first submission note"
  );

  const listSearchByAckCodeResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFSR-1001&search=ACK-REJECT-VALIDATION",
      actorHeaders("payroll_operator", "PAY-YFSR-1001", organization.id)
    )
  );
  assert.equal(listSearchByAckCodeResponse.status, 200, "search by ack code should succeed");
  const listSearchByAckCodeBody = await readJson<{
    submissions: Array<{
      submissionId: string;
    }>;
  }>(listSearchByAckCodeResponse);
  assert.deepEqual(
    listSearchByAckCodeBody.submissions.map((item) => item.submissionId),
    [firstSubmissionId],
    "search should match acknowledged submission ack code"
  );

  const listSearchAndFilterResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFSR-1001&status=canceled&search=beta-resubmit-target",
      actorHeaders("payroll_operator", "PAY-YFSR-1001", organization.id)
    )
  );
  assert.equal(listSearchAndFilterResponse.status, 200, "search + filter should succeed");
  const listSearchAndFilterBody = await readJson<{
    submissions: Array<{
      submissionId: string;
      status: "submitted" | "acknowledged" | "canceled";
    }>;
  }>(listSearchAndFilterResponse);
  assert.deepEqual(
    listSearchAndFilterBody.submissions.map((item) => item.submissionId),
    [secondSubmissionId],
    "combined search/filter should match canceled resubmission"
  );
  assert.equal(listSearchAndFilterBody.submissions[0]?.status, "canceled");

  const listAttemptAscResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFSR-1001&sortBy=attempt&sortDirection=asc",
      actorHeaders("payroll_operator", "PAY-YFSR-1001", organization.id)
    )
  );
  assert.equal(listAttemptAscResponse.status, 200, "attempt asc sort should succeed");
  const listAttemptAscBody = await readJson<{
    submissions: Array<{
      submissionId: string;
      attempt: number;
    }>;
  }>(listAttemptAscResponse);
  assert.deepEqual(
    listAttemptAscBody.submissions.map((item) => item.submissionId),
    [firstSubmissionId, secondSubmissionId],
    "attempt asc should return attempt 1 then 2"
  );
  assert.deepEqual(
    listAttemptAscBody.submissions.map((item) => item.attempt),
    [1, 2],
    "attempt asc should return deterministic attempt ordering"
  );

  const listAttemptDescResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFSR-1001&sortBy=attempt&sortDirection=desc",
      actorHeaders("payroll_operator", "PAY-YFSR-1001", organization.id)
    )
  );
  assert.equal(listAttemptDescResponse.status, 200, "attempt desc sort should succeed");
  const listAttemptDescBody = await readJson<{
    submissions: Array<{
      submissionId: string;
      attempt: number;
    }>;
  }>(listAttemptDescResponse);
  assert.deepEqual(
    listAttemptDescBody.submissions.map((item) => item.submissionId),
    [secondSubmissionId, firstSubmissionId],
    "attempt desc should return attempt 2 then 1"
  );
  assert.deepEqual(
    listAttemptDescBody.submissions.map((item) => item.attempt),
    [2, 1],
    "attempt desc should return deterministic attempt ordering"
  );

  const listStatusAscResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFSR-1001&sortBy=status&sortDirection=asc",
      actorHeaders("payroll_operator", "PAY-YFSR-1001", organization.id)
    )
  );
  assert.equal(listStatusAscResponse.status, 200, "status asc sort should succeed");
  const listStatusAscBody = await readJson<{
    submissions: Array<{
      submissionId: string;
      status: "submitted" | "acknowledged" | "canceled";
    }>;
  }>(listStatusAscResponse);
  assert.equal(
    listStatusAscBody.submissions[0]?.submissionId,
    firstSubmissionId,
    "status asc should place acknowledged before canceled"
  );
  assert.equal(listStatusAscBody.submissions[0]?.status, "acknowledged");
  assert.equal(listStatusAscBody.submissions[1]?.submissionId, secondSubmissionId);
  assert.equal(listStatusAscBody.submissions[1]?.status, "canceled");

  const listAckStatusAscResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFSR-1001&sortBy=ackStatus&sortDirection=asc",
      actorHeaders("payroll_operator", "PAY-YFSR-1001", organization.id)
    )
  );
  assert.equal(listAckStatusAscResponse.status, 200, "ackStatus asc sort should succeed");
  const listAckStatusAscBody = await readJson<{
    submissions: Array<{
      submissionId: string;
      ack: {
        ackStatus: "accepted" | "rejected";
      } | null;
    }>;
  }>(listAckStatusAscResponse);
  assert.equal(
    listAckStatusAscBody.submissions[0]?.submissionId,
    secondSubmissionId,
    "ackStatus asc should place ack-none canceled submission first"
  );
  assert.equal(listAckStatusAscBody.submissions[0]?.ack, null);
  assert.equal(listAckStatusAscBody.submissions[1]?.submissionId, firstSubmissionId);
  assert.equal(listAckStatusAscBody.submissions[1]?.ack?.ackStatus, "rejected");

  const listTransportAscResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFSR-1001&sortBy=transport&sortDirection=asc",
      actorHeaders("payroll_operator", "PAY-YFSR-1001", organization.id)
    )
  );
  assert.equal(listTransportAscResponse.status, 200, "transport asc sort should succeed");
  const listTransportAscBody = await readJson<{
    submissions: Array<{
      submissionId: string;
      transport: "manual_portal" | "hometax_upload" | "nts_api_mock";
    }>;
  }>(listTransportAscResponse);
  assert.equal(listTransportAscBody.submissions[0]?.submissionId, firstSubmissionId);
  assert.equal(listTransportAscBody.submissions[0]?.transport, "manual_portal");
  assert.equal(listTransportAscBody.submissions[1]?.submissionId, secondSubmissionId);
  assert.equal(listTransportAscBody.submissions[1]?.transport, "hometax_upload");

  const invalidSortByResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFSR-1001&sortBy=invalid",
      actorHeaders("payroll_operator", "PAY-YFSR-1001", organization.id)
    )
  );
  assert.equal(invalidSortByResponse.status, 400, "invalid sortBy should be rejected");

  const unauthorizedListResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFSR-1001&search=alpha&sortBy=attempt&sortDirection=asc",
      actorHeaders("employee", "EMP-YFSR-1001", organization.id)
    )
  );
  assert.equal(unauthorizedListResponse.status, 403, "employee role should not list filing submissions");

  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1 = "false";
  const flagOffListResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFSR-1001&search=alpha&sortBy=attempt&sortDirection=asc",
      actorHeaders("payroll_operator", "PAY-YFSR-1001", organization.id)
    )
  );
  assert.equal(
    flagOffListResponse.status,
    409,
    "search/sort list query should be blocked when feature flag is disabled"
  );

  const listFailureLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_submission_list.failed"],
    entityType: "PayrollYearEnd"
  });
  assert.ok(listFailureLogs.length >= 2, "search/sort list failures should be audited");
}

run()
  .then(() => {
    console.log(
      "e2e-wi0197-payroll-year-end-filing-submission-search-sort-and-quick-action-ux-baseline.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
