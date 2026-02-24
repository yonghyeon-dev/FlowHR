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
  const filingTimelineRoute = await import(
    "../../src/app/api/payroll/year-end/filing-submissions/[submissionId]/timeline/route.ts"
  );
  const filingEvidenceRoute = await import(
    "../../src/app/api/payroll/year-end/filing-submissions/[submissionId]/evidence-note/route.ts"
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
    /copy\.loadSubmissionTimelineAction/,
    "filing console should expose timeline action with locale copy"
  );
  assert.match(
    filingConsoleSource,
    /copy\.addEvidenceNoteAction/,
    "filing console should expose evidence-note action with locale copy"
  );
  assert.match(payrollApiSpec, /\/payroll\/year-end\/filing-submissions\/\{submissionId\}\/timeline:/, "api spec should include timeline endpoint");
  assert.match(payrollApiSpec, /\/payroll\/year-end\/filing-submissions\/\{submissionId\}\/evidence-note:/, "api spec should include evidence-note endpoint");
  assert.match(payrollContract, /payroll\.year_end\.filing_evidence_note\.added\.v1/, "contract should include evidence-note event");

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Filing Timeline"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YFT-1001",
    organizationId: organization.id,
    name: "Filing Timeline Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YFT-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 400000,
    withholdingTaxKrw: 20000,
    socialInsuranceKrw: 15000,
    otherDeductionsKrw: 5000,
    totalDeductionsKrw: 40000,
    netPayKrw: 360000,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YFT-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YFT-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFT-1001"
  });

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YFT-1001",
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
        finalizedByNote: "wi0193 finalize"
      },
      actorHeaders("payroll_operator", "PAY-YFT-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200, "finalization should succeed");

  const submitResponse = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YFT-1001",
        format: "csv",
        validationMode: "strict",
        transport: "manual_portal",
        submissionNote: "timeline baseline submit"
      },
      actorHeaders("payroll_operator", "PAY-YFT-1001", organization.id)
    )
  );
  assert.equal(submitResponse.status, 200, "submission should succeed");
  const submitBody = await readJson<{
    submission: {
      submissionId: string;
      attempt: number;
    };
  }>(submitResponse);
  const firstSubmissionId = submitBody.submission.submissionId;
  assert.equal(submitBody.submission.attempt, 1);

  const rejectAckResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${firstSubmissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFT-1001",
        ackStatus: "rejected",
        ackCode: "ACK-REJECT",
        ackNote: "initial rejection"
      },
      actorHeaders("payroll_operator", "PAY-YFT-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: firstSubmissionId
      })
    }
  );
  assert.equal(rejectAckResponse.status, 200, "ack reject should succeed");

  const resubmitResponse = await filingResubmitRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${firstSubmissionId}/resubmit`,
      {
        year: 2026,
        employeeId: "EMP-YFT-1001",
        format: "jsonl",
        validationMode: "strict",
        transport: "hometax_upload",
        resubmissionReason: "fixed row order"
      },
      actorHeaders("payroll_operator", "PAY-YFT-1001", organization.id)
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
      attempt: number;
    };
  }>(resubmitResponse);
  const secondSubmissionId = resubmitBody.submission.submissionId;
  assert.equal(resubmitBody.submission.attempt, 2);

  const evidenceResponse = await filingEvidenceRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${firstSubmissionId}/evidence-note`,
      {
        year: 2026,
        employeeId: "EMP-YFT-1001",
        note: "attached correction evidence and validation screenshot"
      },
      actorHeaders("payroll_operator", "PAY-YFT-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: firstSubmissionId
      })
    }
  );
  assert.equal(evidenceResponse.status, 200, "evidence note append should succeed");

  const acceptAckResponse = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${secondSubmissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFT-1001",
        ackStatus: "accepted",
        ackCode: "ACK-OK",
        ackNote: "accepted after correction"
      },
      actorHeaders("payroll_operator", "PAY-YFT-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: secondSubmissionId
      })
    }
  );
  assert.equal(acceptAckResponse.status, 200, "ack accept should succeed");

  const firstTimelineResponse = await filingTimelineRoute.GET(
    getRequest(
      `/api/payroll/year-end/filing-submissions/${firstSubmissionId}/timeline?year=2026&employeeId=EMP-YFT-1001`,
      actorHeaders("payroll_operator", "PAY-YFT-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: firstSubmissionId
      })
    }
  );
  assert.equal(firstTimelineResponse.status, 200, "timeline fetch should succeed");
  const firstTimelineBody = await readJson<{
    timeline: Array<{
      action: "submitted" | "resubmitted" | "acknowledged" | "evidence_note_added";
      occurredAt: string;
      evidenceNote: string | null;
    }>;
  }>(firstTimelineResponse);
  assert.ok(
    firstTimelineBody.timeline.some((entry) => entry.action === "submitted"),
    "first timeline should include submitted event"
  );
  assert.ok(
    firstTimelineBody.timeline.some((entry) => entry.action === "acknowledged"),
    "first timeline should include acknowledged event"
  );
  assert.ok(
    firstTimelineBody.timeline.some((entry) => entry.action === "evidence_note_added"),
    "first timeline should include evidence note event"
  );
  const firstTimelineTimes = firstTimelineBody.timeline.map((entry) => Date.parse(entry.occurredAt));
  const firstTimelineSorted = [...firstTimelineTimes].sort((left, right) => left - right);
  assert.deepEqual(firstTimelineTimes, firstTimelineSorted, "timeline events should be chronologically ordered");
  assert.ok(
    firstTimelineBody.timeline.some(
      (entry) =>
        entry.action === "evidence_note_added" &&
        (entry.evidenceNote ?? "").includes("validation screenshot")
    ),
    "evidence-note event should carry note text"
  );

  const secondTimelineResponse = await filingTimelineRoute.GET(
    getRequest(
      `/api/payroll/year-end/filing-submissions/${secondSubmissionId}/timeline?year=2026&employeeId=EMP-YFT-1001`,
      actorHeaders("payroll_operator", "PAY-YFT-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: secondSubmissionId
      })
    }
  );
  assert.equal(secondTimelineResponse.status, 200);
  const secondTimelineBody = await readJson<{
    timeline: Array<{
      action: "submitted" | "resubmitted" | "acknowledged" | "evidence_note_added";
    }>;
  }>(secondTimelineResponse);
  assert.ok(
    secondTimelineBody.timeline.some((entry) => entry.action === "resubmitted"),
    "resubmitted submission timeline should include resubmitted event"
  );
  assert.ok(
    secondTimelineBody.timeline.some((entry) => entry.action === "acknowledged"),
    "resubmitted submission timeline should include acknowledged event"
  );

  const unauthorizedTimeline = await filingTimelineRoute.GET(
    getRequest(
      `/api/payroll/year-end/filing-submissions/${firstSubmissionId}/timeline?year=2026&employeeId=EMP-YFT-1001`,
      actorHeaders("employee", "EMP-YFT-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: firstSubmissionId
      })
    }
  );
  assert.equal(unauthorizedTimeline.status, 403, "employee role should not access filing timeline");

  const unknownTimeline = await filingTimelineRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions/YFS-UNKNOWN/timeline?year=2026&employeeId=EMP-YFT-1001",
      actorHeaders("payroll_operator", "PAY-YFT-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: "YFS-UNKNOWN"
      })
    }
  );
  assert.equal(unknownTimeline.status, 404, "timeline should reject unknown submission");

  const unauthorizedEvidence = await filingEvidenceRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${firstSubmissionId}/evidence-note`,
      {
        year: 2026,
        employeeId: "EMP-YFT-1001",
        note: "unauthorized note"
      },
      actorHeaders("employee", "EMP-YFT-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: firstSubmissionId
      })
    }
  );
  assert.equal(unauthorizedEvidence.status, 403, "employee role should not add evidence note");

  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1 = "false";
  const flagOffEvidence = await filingEvidenceRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${firstSubmissionId}/evidence-note`,
      {
        year: 2026,
        employeeId: "EMP-YFT-1001",
        note: "flag off note"
      },
      actorHeaders("payroll_operator", "PAY-YFT-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId: firstSubmissionId
      })
    }
  );
  assert.equal(flagOffEvidence.status, 409, "evidence-note should be blocked when feature flag is disabled");

  const evidenceLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_evidence_note_added"],
    entityType: "PayrollYearEnd"
  });
  const timelineFailLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_timeline.failed"],
    entityType: "PayrollYearEnd"
  });
  const evidenceFailLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_evidence_note.failed"],
    entityType: "PayrollYearEnd"
  });
  assert.equal(evidenceLogs.length, 1, "evidence-note append should be audited once");
  assert.ok(timelineFailLogs.length >= 2, "timeline failures should be audited");
  assert.ok(evidenceFailLogs.length >= 2, "evidence-note failures should be audited");
}

run()
  .then(() => {
    console.log("e2e-wi0193-payroll-year-end-filing-submission-timeline-and-evidence-note-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
