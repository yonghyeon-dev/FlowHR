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
  const filingTimelineRoute = await import(
    "../../src/app/api/payroll/year-end/filing-submissions/[submissionId]/timeline/route.ts"
  );
  const filingAckCatalogRoute = await import(
    "../../src/app/api/payroll/year-end/filing-ack-catalog/route.ts"
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
    /copy\.loadAckCatalogAction/,
    "filing console should expose ack catalog action with locale copy"
  );
  assert.match(payrollApiSpec, /\/payroll\/year-end\/filing-ack-catalog:/, "api spec should include ack catalog endpoint");
  assert.match(
    payrollContract,
    /\/payroll\/year-end\/filing-ack-catalog/,
    "contract should include ack catalog endpoint"
  );

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Filing ACK Catalog"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YFA-1001",
    organizationId: organization.id,
    name: "Filing ACK Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YFA-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 360000,
    withholdingTaxKrw: 18000,
    socialInsuranceKrw: 14000,
    otherDeductionsKrw: 4000,
    totalDeductionsKrw: 36000,
    netPayKrw: 324000,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YFA-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YFA-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFA-1001"
  });

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YFA-1001",
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
        finalizedByNote: "wi0194 finalize"
      },
      actorHeaders("payroll_operator", "PAY-YFA-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200, "finalization should succeed");

  const submitResponse = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YFA-1001",
        format: "csv",
        validationMode: "strict",
        transport: "manual_portal",
        submissionNote: "ack catalog baseline submit"
      },
      actorHeaders("payroll_operator", "PAY-YFA-1001", organization.id)
    )
  );
  assert.equal(submitResponse.status, 200, "submission should succeed");
  const submitBody = await readJson<{
    submission: {
      submissionId: string;
    };
  }>(submitResponse);
  const submissionId = submitBody.submission.submissionId;

  const catalogResponse = await filingAckCatalogRoute.GET(
    getRequest("/api/payroll/year-end/filing-ack-catalog", actorHeaders("payroll_operator", "PAY-YFA-1001", organization.id))
  );
  assert.equal(catalogResponse.status, 200, "ack catalog should load");
  const catalogBody = await readJson<{
    acceptedCodes: Array<{ code: string }>;
    rejectedCodes: Array<{ code: string }>;
    rejectionReasons: Array<{ code: string }>;
  }>(catalogResponse);
  assert.ok(catalogBody.acceptedCodes.some((item) => item.code === "ACK-OK"));
  assert.ok(catalogBody.rejectedCodes.some((item) => item.code === "ACK-REJECT"));
  assert.ok(catalogBody.rejectionReasons.some((item) => item.code === "OTHER"));

  const invalidAckCodeResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFA-1001",
        ackStatus: "accepted",
        ackCode: "ACK-UNKNOWN",
        ackNote: "invalid code"
      },
      actorHeaders("payroll_operator", "PAY-YFA-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(invalidAckCodeResponse.status, 409, "unknown ack code should be rejected");

  const acceptedWithRejectionReasonResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFA-1001",
        ackStatus: "accepted",
        ackCode: "ACK-OK",
        rejectionReasonCode: "VALIDATION_ERROR"
      },
      actorHeaders("payroll_operator", "PAY-YFA-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(
    acceptedWithRejectionReasonResponse.status,
    409,
    "accepted ack should reject rejection reason fields"
  );

  const validRejectedAckResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFA-1001",
        ackStatus: "rejected",
        ackCode: "ACK-REJECT-VALIDATION",
        rejectionReasonCode: "VALIDATION_ERROR",
        rejectionReasonDetail: "line 12 amount field mismatch",
        ackNote: "please correct and resubmit"
      },
      actorHeaders("payroll_operator", "PAY-YFA-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(validRejectedAckResponse.status, 200, "valid rejected ack should succeed");
  const validRejectedAckBody = await readJson<{
    submission: {
      ack: {
        ackCode: string | null;
        rejectionReasonCode: string | null;
        rejectionReasonDetail: string | null;
      } | null;
    };
  }>(validRejectedAckResponse);
  assert.equal(validRejectedAckBody.submission.ack?.ackCode, "ACK-REJECT-VALIDATION");
  assert.equal(validRejectedAckBody.submission.ack?.rejectionReasonCode, "VALIDATION_ERROR");
  assert.equal(
    validRejectedAckBody.submission.ack?.rejectionReasonDetail,
    "line 12 amount field mismatch"
  );

  const submissionsListResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFA-1001",
      actorHeaders("payroll_operator", "PAY-YFA-1001", organization.id)
    )
  );
  assert.equal(submissionsListResponse.status, 200);
  const submissionsListBody = await readJson<{
    submissions: Array<{
      submissionId: string;
      ack: {
        ackCode: string | null;
        rejectionReasonCode: string | null;
      } | null;
    }>;
  }>(submissionsListResponse);
  const acknowledgedSubmission = submissionsListBody.submissions.find(
    (item) => item.submissionId === submissionId
  );
  assert.ok(acknowledgedSubmission?.ack);
  assert.equal(acknowledgedSubmission?.ack?.ackCode, "ACK-REJECT-VALIDATION");
  assert.equal(acknowledgedSubmission?.ack?.rejectionReasonCode, "VALIDATION_ERROR");

  const timelineResponse = await filingTimelineRoute.GET(
    getRequest(
      `/api/payroll/year-end/filing-submissions/${submissionId}/timeline?year=2026&employeeId=EMP-YFA-1001`,
      actorHeaders("payroll_operator", "PAY-YFA-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(timelineResponse.status, 200);
  const timelineBody = await readJson<{
    timeline: Array<{
      action: "submitted" | "resubmitted" | "acknowledged" | "evidence_note_added";
      ackCode: string | null;
      rejectionReasonCode: string | null;
    }>;
  }>(timelineResponse);
  const ackTimeline = timelineBody.timeline.find((entry) => entry.action === "acknowledged");
  assert.equal(ackTimeline?.ackCode, "ACK-REJECT-VALIDATION");
  assert.equal(ackTimeline?.rejectionReasonCode, "VALIDATION_ERROR");

  const unauthorizedCatalog = await filingAckCatalogRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-ack-catalog",
      actorHeaders("employee", "EMP-YFA-1001", organization.id)
    )
  );
  assert.equal(unauthorizedCatalog.status, 403, "employee role should not access ack catalog");

  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1 = "false";
  const flagOffCatalog = await filingAckCatalogRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-ack-catalog",
      actorHeaders("payroll_operator", "PAY-YFA-1001", organization.id)
    )
  );
  assert.equal(flagOffCatalog.status, 409, "ack catalog should be blocked when feature flag is disabled");

  const ackFailureLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_ack.failed"],
    entityType: "PayrollYearEnd"
  });
  const catalogFailureLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_ack_catalog.failed"],
    entityType: "PayrollYearEnd"
  });
  assert.ok(ackFailureLogs.length >= 2, "invalid acknowledgement attempts should be audited");
  assert.ok(catalogFailureLogs.length >= 2, "catalog failures should be audited");
}

run()
  .then(() => {
    console.log("e2e-wi0194-payroll-year-end-filing-ack-code-dictionary-and-rejection-reason-catalog-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
