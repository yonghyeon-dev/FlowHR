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

function jsonRequest(
  method: string,
  urlPath: string,
  payload: unknown,
  headers: Record<string, string>
) {
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
  const filingTimelineRoute = await import(
    "../../src/app/api/payroll/year-end/filing-submissions/[submissionId]/timeline/route.ts"
  );
  const filingEvidenceNoteRoute = await import(
    "../../src/app/api/payroll/year-end/filing-submissions/[submissionId]/evidence-note/route.ts"
  );

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1 = "true";

  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const filingConsoleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const filingOpsPageSource = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-year-end-filing",
    "ops",
    "page.tsx"
  );
  const filingOpsDashboardSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsDashboard.tsx"
  );
  const filingOpsDashboardModule = await import(
    "../../src/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard.tsx"
  );
  const globalsCssSource = readUtf8("src", "app", "globals.css");
  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops/,
    "admin nav should include filing ops dashboard route"
  );
  assert.match(
    filingOpsPageSource,
    /PayrollYearEndFilingOpsDashboard/,
    "filing ops page should render dedicated ops dashboard component"
  );
  assert.match(
    filingConsoleSource,
    /\/admin\/payroll-year-end-filing\/ops/,
    "filing execution console should cross-link to ops dashboard"
  );
  assert.match(
    filingOpsDashboardSource,
    /Payroll Year-End Filing Ops Dashboard/,
    "ops dashboard should include heading text"
  );
  assert.match(
    filingOpsDashboardSource,
    /id="filing-status-summary"/,
    "ops dashboard should include filing status summary section"
  );
  assert.match(
    filingOpsDashboardSource,
    /id="filing-evidence-summary"/,
    "ops dashboard should include filing evidence summary section"
  );
  assert.match(
    filingOpsDashboardSource,
    /aria-label="filing status summary cards"/,
    "ops dashboard should expose status summary cards container"
  );
  assert.match(
    filingOpsDashboardSource,
    /aria-label="filing evidence summary cards"/,
    "ops dashboard should expose evidence summary cards container"
  );
  assert.match(
    filingOpsDashboardSource,
    /Refresh Ops Dashboard/,
    "ops dashboard should expose refresh action"
  );
  assert.match(
    filingOpsDashboardSource,
    /id="filing-alert-rules"/,
    "ops dashboard should include filing alert-rules section"
  );
  assert.match(
    filingOpsDashboardSource,
    /aria-label="filing alert rule list"/,
    "ops dashboard should expose alert-rule list container"
  );
  assert.match(
    filingOpsDashboardSource,
    /id="filing-ops-drilldown"/,
    "ops dashboard should include filing drilldown section"
  );
  assert.match(
    filingOpsDashboardSource,
    /aria-label="filing ops drilldown list"/,
    "ops dashboard should expose drilldown list container"
  );
  assert.match(
    globalsCssSource,
    /\.ops-drilldown-toolbar/,
    "global styles should include drilldown toolbar style"
  );
  assert.match(
    payrollApiSpec,
    /version:\s*1\.24\.0/,
    "payroll api version should be bumped for WI-0199"
  );
  assert.match(
    payrollContract,
    /year-end filing ops dashboard drilldown and alert-rule workflow/,
    "payroll contract should include WI-0199 drilldown and alert-rule workflow scope"
  );
  assert.match(
    payrollTestCases,
    /alert-rule severity output and drilldown mode presets/,
    "payroll test cases should include WI-0199 alert/drilldown functional coverage"
  );

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Filing Ops Dashboard"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YFOPS-1001",
    organizationId: organization.id,
    name: "Filing Ops Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const confirmedRun = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YFOPS-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 660000,
    withholdingTaxKrw: 33000,
    socialInsuranceKrw: 19000,
    otherDeductionsKrw: 7000,
    totalDeductionsKrw: 59000,
    netPayKrw: 601000,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(confirmedRun.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YFOPS-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YFOPS-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFOPS-1001"
  });

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YFOPS-1001",
        nonTaxableAnnualIncomeKrw: 0,
        additionalTaxCreditKrw: 2000,
        annualIncomeTaxRate: 0.03,
        localIncomeTaxRate: 0.1,
        deductionItems: {
          personalPensionKrw: 10000,
          insurancePremiumKrw: 10000,
          medicalExpenseKrw: 5000,
          educationExpenseKrw: 5000,
          donationKrw: 5000,
          housingSavingsKrw: 5000
        },
        apply: true,
        finalizedByNote: "wi0199 finalize"
      },
      actorHeaders("payroll_operator", "PAY-YFOPS-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200, "finalization should succeed");

  const firstSubmitResponse = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YFOPS-1001",
        format: "csv",
        validationMode: "strict",
        transport: "manual_portal",
        submissionNote: "ops-first-note"
      },
      actorHeaders("payroll_operator", "PAY-YFOPS-1001", organization.id)
    )
  );
  assert.equal(firstSubmitResponse.status, 200, "first submission should succeed");
  const firstSubmitBody = await readJson<{
    submission: { submissionId: string };
  }>(firstSubmitResponse);
  const firstSubmissionId = firstSubmitBody.submission.submissionId;

  const rejectAckResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${firstSubmissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFOPS-1001",
        ackStatus: "rejected",
        ackCode: "ACK-REJECT-VALIDATION",
        rejectionReasonCode: "VALIDATION_ERROR",
        ackNote: "ops-rejected-needs-resubmit"
      },
      actorHeaders("payroll_operator", "PAY-YFOPS-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: firstSubmissionId
      })
    }
  );
  assert.equal(rejectAckResponse.status, 200, "rejected ack should succeed");

  const evidenceResponse = await filingEvidenceNoteRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${firstSubmissionId}/evidence-note`,
      {
        year: 2026,
        employeeId: "EMP-YFOPS-1001",
        note: "ops-evidence-note-1"
      },
      actorHeaders("payroll_operator", "PAY-YFOPS-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: firstSubmissionId
      })
    }
  );
  assert.equal(evidenceResponse.status, 200, "evidence note append should succeed");

  const secondSubmitResponse = await filingResubmitRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${firstSubmissionId}/resubmit`,
      {
        year: 2026,
        employeeId: "EMP-YFOPS-1001",
        submissionId: firstSubmissionId,
        format: "csv",
        validationMode: "strict",
        transport: "hometax_upload",
        resubmissionReason: "ops dashboard baseline retry"
      },
      actorHeaders("payroll_operator", "PAY-YFOPS-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: firstSubmissionId
      })
    }
  );
  assert.equal(secondSubmitResponse.status, 200, "second submission should succeed");
  const secondSubmitBody = await readJson<{
    submission: { submissionId: string };
  }>(secondSubmitResponse);
  const secondSubmissionId = secondSubmitBody.submission.submissionId;

  const listResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFOPS-1001&sortBy=attempt&sortDirection=asc",
      actorHeaders("payroll_operator", "PAY-YFOPS-1001", organization.id)
    )
  );
  assert.equal(listResponse.status, 200, "submission list should succeed");
  const listBody = await readJson<{
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
    };
    submissions: Array<{
      submissionId: string;
      status: "submitted" | "acknowledged" | "canceled";
      submissionNote: string | null;
      ack: {
        ackStatus: "accepted" | "rejected";
        rejectionReasonDetail: string | null;
      } | null;
    }>;
  }>(listResponse);

  assert.equal(listBody.summary.totalCount, 2, "ops summary should count total submissions");
  assert.equal(listBody.summary.filteredCount, 2, "ops summary should count filtered submissions");
  assert.equal(listBody.summary.statusCounts.submitted, 1, "ops summary should count submitted rows");
  assert.equal(
    listBody.summary.statusCounts.acknowledged,
    1,
    "ops summary should count acknowledged rows"
  );
  assert.equal(listBody.summary.statusCounts.canceled, 0, "ops summary should count canceled rows");
  assert.equal(listBody.summary.ackStatusCounts.rejected, 1, "ops summary should count rejected ack");
  assert.equal(listBody.summary.ackStatusCounts.none, 1, "ops summary should count ack none rows");
  assert.equal(
    listBody.submissions[0]?.submissionId,
    firstSubmissionId,
    "attempt asc should return first submission first"
  );
  assert.equal(
    listBody.submissions[1]?.submissionId,
    secondSubmissionId,
    "attempt asc should return second submission second"
  );
  assert.equal(
    listBody.submissions[0]?.ack?.rejectionReasonDetail ?? "",
    "",
    "first rejected ack should keep empty rejection detail for gap detection"
  );
  assert.equal(
    listBody.submissions[1]?.submissionNote,
    null,
    "second row should keep empty submission note for evidence-gap detection"
  );

  const {
    resolveFilingOpsAlertLevel,
    collectFilingOpsDrilldownRows
  } = filingOpsDashboardModule as {
    resolveFilingOpsAlertLevel: (value: number, watchThreshold: number, criticalThreshold: number) => string;
    collectFilingOpsDrilldownRows: (options: {
      mode: "pending" | "rejected" | "validation_fail" | "evidence_gap" | "timeline_failure";
      submissions: Array<{
        submissionId: string;
        status: "submitted" | "acknowledged" | "canceled";
        validationStatus: "pass" | "fail";
        ack: { ackStatus: "accepted" | "rejected" } | null;
      }>;
      evidenceGapSubmissionIds: string[];
      timelineFailureSubmissionIds: string[];
    }) => Array<{ submissionId: string }>;
  };

  assert.equal(
    resolveFilingOpsAlertLevel(0, 1, 3),
    "normal",
    "alert level should be normal below watch threshold"
  );
  assert.equal(
    resolveFilingOpsAlertLevel(1, 1, 3),
    "watch",
    "alert level should be watch at watch threshold"
  );
  assert.equal(
    resolveFilingOpsAlertLevel(3, 1, 3),
    "critical",
    "alert level should be critical at critical threshold"
  );
  assert.equal(
    resolveFilingOpsAlertLevel(2, -1, 1),
    "critical",
    "alert level should sanitize negative threshold values"
  );

  const helperRows = [
    {
      submissionId: "SUB-PENDING",
      status: "submitted" as const,
      validationStatus: "pass" as const,
      ack: null
    },
    {
      submissionId: "SUB-REJECTED",
      status: "acknowledged" as const,
      validationStatus: "pass" as const,
      ack: { ackStatus: "rejected" as const }
    },
    {
      submissionId: "SUB-VALIDATION-FAIL",
      status: "acknowledged" as const,
      validationStatus: "fail" as const,
      ack: { ackStatus: "accepted" as const }
    }
  ];

  assert.deepEqual(
    collectFilingOpsDrilldownRows({
      mode: "pending",
      submissions: helperRows,
      evidenceGapSubmissionIds: [],
      timelineFailureSubmissionIds: []
    }).map((row) => row.submissionId),
    ["SUB-PENDING"],
    "pending mode should include submitted rows only"
  );
  assert.deepEqual(
    collectFilingOpsDrilldownRows({
      mode: "rejected",
      submissions: helperRows,
      evidenceGapSubmissionIds: [],
      timelineFailureSubmissionIds: []
    }).map((row) => row.submissionId),
    ["SUB-REJECTED"],
    "rejected mode should include acknowledged+rejected rows only"
  );
  assert.deepEqual(
    collectFilingOpsDrilldownRows({
      mode: "validation_fail",
      submissions: helperRows,
      evidenceGapSubmissionIds: [],
      timelineFailureSubmissionIds: []
    }).map((row) => row.submissionId),
    ["SUB-VALIDATION-FAIL"],
    "validation_fail mode should include validation fail rows only"
  );
  assert.deepEqual(
    collectFilingOpsDrilldownRows({
      mode: "evidence_gap",
      submissions: helperRows,
      evidenceGapSubmissionIds: ["SUB-PENDING"],
      timelineFailureSubmissionIds: []
    }).map((row) => row.submissionId),
    ["SUB-PENDING"],
    "evidence_gap mode should include ID-matched rows only"
  );
  assert.deepEqual(
    collectFilingOpsDrilldownRows({
      mode: "timeline_failure",
      submissions: helperRows,
      evidenceGapSubmissionIds: [],
      timelineFailureSubmissionIds: ["SUB-REJECTED"]
    }).map((row) => row.submissionId),
    ["SUB-REJECTED"],
    "timeline_failure mode should include timeline-failed rows only"
  );

  const timelineResponse = await filingTimelineRoute.GET(
    getRequest(
      `/api/payroll/year-end/filing-submissions/${firstSubmissionId}/timeline?year=2026&employeeId=EMP-YFOPS-1001`,
      actorHeaders("payroll_operator", "PAY-YFOPS-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: firstSubmissionId
      })
    }
  );
  assert.equal(timelineResponse.status, 200, "timeline query should succeed");
  const timelineBody = await readJson<{
    timeline: Array<{
      action: string;
      evidenceNote: string | null;
    }>;
  }>(timelineResponse);
  assert.ok(
    timelineBody.timeline.some(
      (entry) => entry.action === "evidence_note_added" && entry.evidenceNote === "ops-evidence-note-1"
    ),
    "timeline should include evidence note event for ops evidence summary"
  );

  const unauthorizedListResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFOPS-1001",
      actorHeaders("employee", "EMP-YFOPS-1001", organization.id)
    )
  );
  assert.equal(
    unauthorizedListResponse.status,
    403,
    "employee role should not access filing ops list data"
  );
}

run()
  .then(() => {
    console.log(
      "e2e-wi0199-payroll-year-end-filing-ops-dashboard-drilldown-and-alert-rules-baseline.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
