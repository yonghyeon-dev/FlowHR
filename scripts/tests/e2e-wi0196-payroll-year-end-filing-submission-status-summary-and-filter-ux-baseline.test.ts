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
    /copy\.submissionStatusFilterLabel/,
    "filing console should expose submission status filter with locale copy"
  );
  assert.match(
    filingConsoleSource,
    /copy\.ackStatusFilterLabel/,
    "filing console should expose ack status filter with locale copy"
  );
  assert.match(payrollApiSpec, /name:\s*status/, "api spec should include status query filter");
  assert.match(payrollApiSpec, /name:\s*ackStatus/, "api spec should include ackStatus query filter");
  assert.match(
    payrollContract,
    /status\/ackStatus\/validationStatus\/transport/,
    "contract should include filing submission filter coverage"
  );

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Filing Submission Filter"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YFS-1001",
    organizationId: organization.id,
    name: "Filing Filter Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YFS-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 400000,
    withholdingTaxKrw: 22000,
    socialInsuranceKrw: 15000,
    otherDeductionsKrw: 5000,
    totalDeductionsKrw: 42000,
    netPayKrw: 358000,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YFS-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YFS-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFS-1001"
  });

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YFS-1001",
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
        finalizedByNote: "wi0196 finalize"
      },
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200, "finalization should succeed");

  const initialSubmitResponse = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YFS-1001",
        format: "csv",
        validationMode: "strict",
        transport: "manual_portal",
        submissionNote: "status summary baseline submit"
      },
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    )
  );
  assert.equal(initialSubmitResponse.status, 200, "initial submission should succeed");
  const initialSubmitBody = await readJson<{
    submission: {
      submissionId: string;
    };
  }>(initialSubmitResponse);
  const firstSubmissionId = initialSubmitBody.submission.submissionId;

  const rejectedAckResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${firstSubmissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFS-1001",
        ackStatus: "rejected",
        ackCode: "ACK-REJECT-VALIDATION",
        rejectionReasonCode: "VALIDATION_ERROR",
        rejectionReasonDetail: "line mismatch",
        ackNote: "correct and retry"
      },
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
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
        employeeId: "EMP-YFS-1001",
        format: "csv",
        validationMode: "strict",
        transport: "manual_portal",
        submissionNote: "status summary resubmit",
        resubmissionReason: "retry after rejection"
      },
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
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
        employeeId: "EMP-YFS-1001"
      },
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: secondSubmissionId
      })
    }
  );
  assert.equal(cancelResponse.status, 200, "cancel should succeed");

  const listAllResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFS-1001",
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    )
  );
  assert.equal(listAllResponse.status, 200, "list all should succeed");
  const listAllBody = await readJson<{
    summary: {
      totalCount: number;
      filteredCount: number;
      statusCounts: {
        submitted: number;
        acknowledged: number;
        canceled: number;
      };
      ackStatusCounts: {
        accepted: number;
        rejected: number;
        none: number;
      };
      validationStatusCounts: {
        pass: number;
        fail: number;
      };
      transportCounts: {
        manual_portal: number;
        hometax_upload: number;
        nts_api_mock: number;
      };
    };
    submissions: Array<{
      submissionId: string;
      status: "submitted" | "acknowledged" | "canceled";
      ack: {
        ackStatus: "accepted" | "rejected";
      } | null;
    }>;
  }>(listAllResponse);
  assert.equal(listAllBody.summary.totalCount, 2);
  assert.equal(listAllBody.summary.filteredCount, 2);
  assert.equal(listAllBody.summary.statusCounts.submitted, 0);
  assert.equal(listAllBody.summary.statusCounts.acknowledged, 1);
  assert.equal(listAllBody.summary.statusCounts.canceled, 1);
  assert.equal(listAllBody.summary.ackStatusCounts.accepted, 0);
  assert.equal(listAllBody.summary.ackStatusCounts.rejected, 1);
  assert.equal(listAllBody.summary.ackStatusCounts.none, 1);
  assert.equal(listAllBody.summary.validationStatusCounts.pass, 2);
  assert.equal(listAllBody.summary.validationStatusCounts.fail, 0);
  assert.equal(listAllBody.summary.transportCounts.manual_portal, 2);
  assert.equal(listAllBody.summary.transportCounts.hometax_upload, 0);
  assert.equal(listAllBody.summary.transportCounts.nts_api_mock, 0);
  assert.equal(listAllBody.submissions.length, 2);

  const listCanceledResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFS-1001&status=canceled",
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    )
  );
  assert.equal(listCanceledResponse.status, 200);
  const listCanceledBody = await readJson<{
    summary: {
      filteredCount: number;
    };
    submissions: Array<{
      submissionId: string;
      status: "submitted" | "acknowledged" | "canceled";
    }>;
  }>(listCanceledResponse);
  assert.equal(listCanceledBody.summary.filteredCount, 1);
  assert.deepEqual(
    listCanceledBody.submissions.map((item) => item.submissionId),
    [secondSubmissionId],
    "canceled filter should return canceled submission only"
  );
  assert.equal(listCanceledBody.submissions[0]?.status, "canceled");

  const listRejectedAckResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFS-1001&ackStatus=rejected",
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    )
  );
  assert.equal(listRejectedAckResponse.status, 200);
  const listRejectedAckBody = await readJson<{
    submissions: Array<{
      submissionId: string;
      ack: {
        ackStatus: "accepted" | "rejected";
      } | null;
    }>;
  }>(listRejectedAckResponse);
  assert.equal(listRejectedAckBody.submissions.length, 1);
  assert.equal(listRejectedAckBody.submissions[0]?.submissionId, firstSubmissionId);
  assert.equal(listRejectedAckBody.submissions[0]?.ack?.ackStatus, "rejected");

  const listNoAckResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFS-1001&ackStatus=none",
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    )
  );
  assert.equal(listNoAckResponse.status, 200);
  const listNoAckBody = await readJson<{
    submissions: Array<{
      submissionId: string;
      ack: {
        ackStatus: "accepted" | "rejected";
      } | null;
    }>;
  }>(listNoAckResponse);
  assert.equal(listNoAckBody.submissions.length, 1);
  assert.equal(listNoAckBody.submissions[0]?.submissionId, secondSubmissionId);
  assert.equal(listNoAckBody.submissions[0]?.ack, null);

  const listCombinedFilterResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFS-1001&status=acknowledged&ackStatus=rejected",
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    )
  );
  assert.equal(listCombinedFilterResponse.status, 200);
  const listCombinedFilterBody = await readJson<{
    summary: {
      filteredCount: number;
    };
    submissions: Array<{
      submissionId: string;
    }>;
  }>(listCombinedFilterResponse);
  assert.equal(listCombinedFilterBody.summary.filteredCount, 1);
  assert.equal(listCombinedFilterBody.submissions[0]?.submissionId, firstSubmissionId);

  const listSubmittedOnlyResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFS-1001&status=submitted",
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    )
  );
  assert.equal(listSubmittedOnlyResponse.status, 200);
  const listSubmittedOnlyBody = await readJson<{
    summary: {
      filteredCount: number;
    };
    submissions: Array<unknown>;
  }>(listSubmittedOnlyResponse);
  assert.equal(listSubmittedOnlyBody.summary.filteredCount, 0);
  assert.equal(listSubmittedOnlyBody.submissions.length, 0);

  const listTransportFilterResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFS-1001&transport=manual_portal",
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    )
  );
  assert.equal(listTransportFilterResponse.status, 200);
  const listTransportFilterBody = await readJson<{
    submissions: Array<unknown>;
  }>(listTransportFilterResponse);
  assert.equal(listTransportFilterBody.submissions.length, 2);

  const listInvalidQuery = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFS-1001&status=invalid",
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    )
  );
  assert.equal(listInvalidQuery.status, 400, "invalid status query should be rejected");

  const unauthorizedListResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFS-1001&status=canceled",
      actorHeaders("employee", "EMP-YFS-1001", organization.id)
    )
  );
  assert.equal(unauthorizedListResponse.status, 403, "employee role should not list filing submissions");

  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1 = "false";
  const flagOffListResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFS-1001&status=canceled",
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    )
  );
  assert.equal(flagOffListResponse.status, 409, "list filter should be blocked when feature flag is disabled");

  const listFailureLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_submission_list.failed"],
    entityType: "PayrollYearEnd"
  });
  assert.ok(listFailureLogs.length >= 2, "submission list failures should be audited");
}

run()
  .then(() => {
    console.log(
      "e2e-wi0196-payroll-year-end-filing-submission-status-summary-and-filter-ux-baseline.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
