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
  const filingCancelRoute = await import(
    "../../src/app/api/payroll/year-end/filing-submissions/[submissionId]/cancel/route.ts"
  );
  const filingReopenRoute = await import(
    "../../src/app/api/payroll/year-end/filing-submissions/[submissionId]/reopen/route.ts"
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
    /copy\.cancelSubmissionAction/,
    "filing console should expose cancel action with locale copy"
  );
  assert.match(
    filingConsoleSource,
    /copy\.reopenSubmissionAction/,
    "filing console should expose reopen action with locale copy"
  );
  assert.match(
    payrollApiSpec,
    /\/payroll\/year-end\/filing-submissions\/\{submissionId\}\/cancel:/,
    "api spec should include cancel endpoint"
  );
  assert.match(
    payrollApiSpec,
    /\/payroll\/year-end\/filing-submissions\/\{submissionId\}\/reopen:/,
    "api spec should include reopen endpoint"
  );
  assert.match(
    payrollContract,
    /payroll\.year_end\.filing_package\.canceled\.v1/,
    "contract should include canceled event"
  );
  assert.match(
    payrollContract,
    /payroll\.year_end\.filing_package\.reopened\.v1/,
    "contract should include reopened event"
  );

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Filing Cancel Reopen"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YFC-1001",
    organizationId: organization.id,
    name: "Filing Cancel Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YFC-1001",
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
    confirmedBy: "PAY-YFC-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YFC-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFC-1001"
  });

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YFC-1001",
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
        finalizedByNote: "wi0195 finalize"
      },
      actorHeaders("payroll_operator", "PAY-YFC-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200, "finalization should succeed");

  const submitResponse = await filingSubmissionRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/filing-submissions",
      {
        year: 2026,
        employeeId: "EMP-YFC-1001",
        format: "csv",
        validationMode: "strict",
        transport: "manual_portal",
        submissionNote: "cancel/reopen baseline submit"
      },
      actorHeaders("payroll_operator", "PAY-YFC-1001", organization.id)
    )
  );
  assert.equal(submitResponse.status, 200, "submission should succeed");
  const submitBody = await readJson<{
    submission: {
      submissionId: string;
      status: "submitted" | "acknowledged" | "canceled";
    };
  }>(submitResponse);
  const submissionId = submitBody.submission.submissionId;
  assert.equal(submitBody.submission.status, "submitted");

  const reopenBeforeCancel = await filingReopenRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submissionId}/reopen`,
      {
        year: 2026,
        employeeId: "EMP-YFC-1001"
      },
      actorHeaders("payroll_operator", "PAY-YFC-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(reopenBeforeCancel.status, 409, "reopen should reject non-canceled submission");

  const cancelResponse = await filingCancelRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submissionId}/cancel`,
      {
        year: 2026,
        employeeId: "EMP-YFC-1001"
      },
      actorHeaders("payroll_operator", "PAY-YFC-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(cancelResponse.status, 200, "cancel should succeed for submitted submission");
  const cancelBody = await readJson<{
    submission: {
      submissionId: string;
      status: "submitted" | "acknowledged" | "canceled";
    };
  }>(cancelResponse);
  assert.equal(cancelBody.submission.submissionId, submissionId);
  assert.equal(cancelBody.submission.status, "canceled");

  const acknowledgeCanceled = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFC-1001",
        ackStatus: "accepted",
        ackCode: "ACK-OK",
        ackNote: "should fail"
      },
      actorHeaders("payroll_operator", "PAY-YFC-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(acknowledgeCanceled.status, 409, "ack should reject canceled submission");

  const resubmitCanceled = await filingResubmitRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submissionId}/resubmit`,
      {
        year: 2026,
        employeeId: "EMP-YFC-1001",
        format: "csv",
        validationMode: "strict",
        transport: "manual_portal",
        resubmissionReason: "should fail"
      },
      actorHeaders("payroll_operator", "PAY-YFC-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(resubmitCanceled.status, 409, "resubmit should reject canceled submission");

  const cancelAgain = await filingCancelRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submissionId}/cancel`,
      {
        year: 2026,
        employeeId: "EMP-YFC-1001"
      },
      actorHeaders("payroll_operator", "PAY-YFC-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(cancelAgain.status, 409, "cancel should reject already canceled submission");

  const reopenResponse = await filingReopenRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submissionId}/reopen`,
      {
        year: 2026,
        employeeId: "EMP-YFC-1001"
      },
      actorHeaders("payroll_operator", "PAY-YFC-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(reopenResponse.status, 200, "reopen should succeed for canceled submission");
  const reopenBody = await readJson<{
    submission: {
      submissionId: string;
      status: "submitted" | "acknowledged" | "canceled";
    };
  }>(reopenResponse);
  assert.equal(reopenBody.submission.submissionId, submissionId);
  assert.equal(reopenBody.submission.status, "submitted");

  const acknowledgeReopened = await filingAckRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submissionId}/ack`,
      {
        year: 2026,
        employeeId: "EMP-YFC-1001",
        ackStatus: "accepted",
        ackCode: "ACK-OK",
        ackNote: "reopened ack success"
      },
      actorHeaders("payroll_operator", "PAY-YFC-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(acknowledgeReopened.status, 200, "ack should succeed after reopen");

  const cancelAfterAck = await filingCancelRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submissionId}/cancel`,
      {
        year: 2026,
        employeeId: "EMP-YFC-1001"
      },
      actorHeaders("payroll_operator", "PAY-YFC-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(cancelAfterAck.status, 409, "cancel should reject acknowledged submission");

  const reopenAfterAck = await filingReopenRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submissionId}/reopen`,
      {
        year: 2026,
        employeeId: "EMP-YFC-1001"
      },
      actorHeaders("payroll_operator", "PAY-YFC-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(reopenAfterAck.status, 409, "reopen should reject non-canceled acknowledged submission");

  const timelineResponse = await filingTimelineRoute.GET(
    getRequest(
      `/api/payroll/year-end/filing-submissions/${submissionId}/timeline?year=2026&employeeId=EMP-YFC-1001`,
      actorHeaders("payroll_operator", "PAY-YFC-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(timelineResponse.status, 200, "timeline should succeed");
  const timelineBody = await readJson<{
    timeline: Array<{
      action: "submitted" | "resubmitted" | "canceled" | "reopened" | "acknowledged" | "evidence_note_added";
    }>;
  }>(timelineResponse);
  assert.ok(
    timelineBody.timeline.some((entry) => entry.action === "submitted"),
    "timeline should include submit event"
  );
  assert.ok(
    timelineBody.timeline.some((entry) => entry.action === "canceled"),
    "timeline should include canceled event"
  );
  assert.ok(
    timelineBody.timeline.some((entry) => entry.action === "reopened"),
    "timeline should include reopened event"
  );
  assert.ok(
    timelineBody.timeline.some((entry) => entry.action === "acknowledged"),
    "timeline should include acknowledged event"
  );

  const listResponse = await filingSubmissionRoute.GET(
    getRequest(
      "/api/payroll/year-end/filing-submissions?year=2026&employeeId=EMP-YFC-1001",
      actorHeaders("payroll_operator", "PAY-YFC-1001", organization.id)
    )
  );
  assert.equal(listResponse.status, 200, "submission list should succeed");
  const listBody = await readJson<{
    submissions: Array<{
      submissionId: string;
      status: "submitted" | "acknowledged" | "canceled";
    }>;
  }>(listResponse);
  const listed = listBody.submissions.find((item) => item.submissionId === submissionId);
  assert.equal(listed?.status, "acknowledged", "final status should be acknowledged");

  const unauthorizedCancel = await filingCancelRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submissionId}/cancel`,
      {
        year: 2026,
        employeeId: "EMP-YFC-1001"
      },
      actorHeaders("employee", "EMP-YFC-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(unauthorizedCancel.status, 403, "employee role should not cancel filing submission");

  const unauthorizedReopen = await filingReopenRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submissionId}/reopen`,
      {
        year: 2026,
        employeeId: "EMP-YFC-1001"
      },
      actorHeaders("employee", "EMP-YFC-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(unauthorizedReopen.status, 403, "employee role should not reopen filing submission");

  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1 = "false";
  const flagOffReopen = await filingReopenRoute.POST(
    jsonRequest(
      "POST",
      `/api/payroll/year-end/filing-submissions/${submissionId}/reopen`,
      {
        year: 2026,
        employeeId: "EMP-YFC-1001"
      },
      actorHeaders("payroll_operator", "PAY-YFC-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        submissionId
      })
    }
  );
  assert.equal(flagOffReopen.status, 409, "reopen should be blocked when feature flag is disabled");

  const canceledLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_package_canceled"],
    entityType: "PayrollYearEnd"
  });
  const reopenedLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_package_reopened"],
    entityType: "PayrollYearEnd"
  });
  const cancelFailLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_cancel.failed"],
    entityType: "PayrollYearEnd"
  });
  const reopenFailLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_reopen.failed"],
    entityType: "PayrollYearEnd"
  });
  assert.equal(canceledLogs.length, 1, "cancel success should append one cancel audit");
  assert.equal(reopenedLogs.length, 1, "reopen success should append one reopen audit");
  assert.ok(cancelFailLogs.length >= 3, "failed cancel attempts should be audited");
  assert.ok(reopenFailLogs.length >= 3, "failed reopen attempts should be audited");
}

run()
  .then(() => {
    console.log("e2e-wi0195-payroll-year-end-filing-submission-cancel-and-reopen-guard-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
