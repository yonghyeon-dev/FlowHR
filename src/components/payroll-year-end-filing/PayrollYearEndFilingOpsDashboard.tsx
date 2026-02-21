"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { currentYear } from "@/components/payroll-year-end/types";
import type {
  ApiLog,
  PayrollYearEndFilingSubmission,
  PayrollYearEndFilingSubmissionAckStatusFilter,
  PayrollYearEndFilingSubmissionListResponse,
  PayrollYearEndFilingSubmissionListSummary,
  PayrollYearEndFilingSubmissionSortBy,
  PayrollYearEndFilingSubmissionSortDirection,
  PayrollYearEndFilingSubmissionStatusFilter,
  PayrollYearEndFilingSubmissionTimelineResponse,
  PayrollYearEndFilingSubmissionTransportFilter,
  PayrollYearEndFilingSubmissionValidationStatusFilter
} from "@/components/payroll-year-end-filing/types";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

type EvidenceSummary = {
  scannedCount: number;
  submissionNoteCount: number;
  ackNoteCount: number;
  timelineEvidenceSubmissionCount: number;
  timelineEvidenceEventCount: number;
  evidenceGapCount: number;
  rejectedMissingReasonDetailCount: number;
  timelineFailureCount: number;
  latestEvidenceAt: string | null;
};

type DrilldownMode =
  | "pending"
  | "rejected"
  | "validation_fail"
  | "evidence_gap"
  | "timeline_failure";

type EvidenceScanResult = {
  summary: EvidenceSummary;
  evidenceGapSubmissionIds: string[];
  rejectedMissingReasonDetailSubmissionIds: string[];
  timelineFailureSubmissionIds: string[];
};

type DrilldownCounts = Record<DrilldownMode, number>;

type DrilldownPreset = {
  mode: DrilldownMode;
  label: string;
  description: string;
};

type AlertMetric = "pending" | "rejected" | "validationFail" | "evidenceGap" | "timelineFailure";
export type FilingOpsAlertLevel = "normal" | "watch" | "critical";

type FilingOpsAlertRule = {
  metric: AlertMetric;
  label: string;
  detail: string;
  value: number;
  watchThreshold: number;
  criticalThreshold: number;
  level: FilingOpsAlertLevel;
};

const MAX_EVIDENCE_SCAN_LIMIT = 50;
const DEFAULT_EVIDENCE_SCAN_LIMIT = 20;

const EMPTY_EVIDENCE_SUMMARY: EvidenceSummary = {
  scannedCount: 0,
  submissionNoteCount: 0,
  ackNoteCount: 0,
  timelineEvidenceSubmissionCount: 0,
  timelineEvidenceEventCount: 0,
  evidenceGapCount: 0,
  rejectedMissingReasonDetailCount: 0,
  timelineFailureCount: 0,
  latestEvidenceAt: null
};

const EMPTY_EVIDENCE_SCAN_RESULT: EvidenceScanResult = {
  summary: EMPTY_EVIDENCE_SUMMARY,
  evidenceGapSubmissionIds: [],
  rejectedMissingReasonDetailSubmissionIds: [],
  timelineFailureSubmissionIds: []
};

const DRILLDOWN_PRESETS: DrilldownPreset[] = [
  { mode: "pending", label: "Pending Queue", description: "submitted status rows" },
  { mode: "rejected", label: "Rejected ACK", description: "acknowledged + rejected rows" },
  { mode: "validation_fail", label: "Validation Fail", description: "validation fail rows" },
  { mode: "evidence_gap", label: "Evidence Gap", description: "rows without note evidence" },
  { mode: "timeline_failure", label: "Timeline Failures", description: "timeline lookup failed rows" }
];

function parseRequiredInt(value: string, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`);
  }
  return parsed;
}

function parseEvidenceScanLimit(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("evidence scan limit must be a positive integer");
  }
  return Math.min(parsed, MAX_EVIDENCE_SCAN_LIMIT);
}

function parseThresholdInput(value: string, fallback: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function formatEvidenceTimestamp(value: string | null) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString("ko-KR");
}

function normalizeSearch(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function formatAlertLevelLabel(level: FilingOpsAlertLevel) {
  if (level === "critical") {
    return "CRITICAL";
  }
  if (level === "watch") {
    return "WATCH";
  }
  return "NORMAL";
}

export function resolveFilingOpsAlertLevel(
  value: number,
  watchThreshold: number,
  criticalThreshold: number
): FilingOpsAlertLevel {
  const watch = Math.max(0, watchThreshold);
  const critical = Math.max(watch, criticalThreshold);
  if (value >= critical) {
    return "critical";
  }
  if (value >= watch) {
    return "watch";
  }
  return "normal";
}

export function collectFilingOpsDrilldownRows(options: {
  mode: DrilldownMode;
  submissions: PayrollYearEndFilingSubmission[];
  evidenceGapSubmissionIds: string[];
  timelineFailureSubmissionIds: string[];
}) {
  const evidenceGapIds = new Set(options.evidenceGapSubmissionIds);
  const timelineFailureIds = new Set(options.timelineFailureSubmissionIds);
  if (options.mode === "pending") {
    return options.submissions.filter((submission) => submission.status === "submitted");
  }
  if (options.mode === "rejected") {
    return options.submissions.filter(
      (submission) =>
        submission.status === "acknowledged" && submission.ack?.ackStatus === "rejected"
    );
  }
  if (options.mode === "validation_fail") {
    return options.submissions.filter((submission) => submission.validationStatus === "fail");
  }
  if (options.mode === "evidence_gap") {
    return options.submissions.filter((submission) => evidenceGapIds.has(submission.submissionId));
  }
  return options.submissions.filter((submission) => timelineFailureIds.has(submission.submissionId));
}

export default function PayrollYearEndFilingOpsDashboard() {
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [accessToken, setAccessToken] = useState("");
  const [year, setYear] = useState(String(currentYear()));
  const [employeeId, setEmployeeId] = useState("EMP-1001");
  const [submissionStatusFilter, setSubmissionStatusFilter] =
    useState<PayrollYearEndFilingSubmissionStatusFilter>("all");
  const [submissionAckStatusFilter, setSubmissionAckStatusFilter] =
    useState<PayrollYearEndFilingSubmissionAckStatusFilter>("all");
  const [submissionValidationStatusFilter, setSubmissionValidationStatusFilter] =
    useState<PayrollYearEndFilingSubmissionValidationStatusFilter>("all");
  const [submissionTransportFilter, setSubmissionTransportFilter] =
    useState<PayrollYearEndFilingSubmissionTransportFilter>("all");
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionSortBy, setSubmissionSortBy] =
    useState<PayrollYearEndFilingSubmissionSortBy>("submittedAt");
  const [submissionSortDirection, setSubmissionSortDirection] =
    useState<PayrollYearEndFilingSubmissionSortDirection>("desc");
  const [evidenceScanLimit, setEvidenceScanLimit] = useState(String(DEFAULT_EVIDENCE_SCAN_LIMIT));

  const [pendingWatchThresholdInput, setPendingWatchThresholdInput] = useState("1");
  const [pendingCriticalThresholdInput, setPendingCriticalThresholdInput] = useState("3");
  const [rejectedWatchThresholdInput, setRejectedWatchThresholdInput] = useState("1");
  const [rejectedCriticalThresholdInput, setRejectedCriticalThresholdInput] = useState("2");
  const [validationFailWatchThresholdInput, setValidationFailWatchThresholdInput] = useState("1");
  const [validationFailCriticalThresholdInput, setValidationFailCriticalThresholdInput] = useState("2");
  const [evidenceGapWatchThresholdInput, setEvidenceGapWatchThresholdInput] = useState("1");
  const [evidenceGapCriticalThresholdInput, setEvidenceGapCriticalThresholdInput] = useState("2");
  const [timelineFailureWatchThresholdInput, setTimelineFailureWatchThresholdInput] = useState("1");
  const [timelineFailureCriticalThresholdInput, setTimelineFailureCriticalThresholdInput] = useState("1");

  const [drilldownMode, setDrilldownMode] = useState<DrilldownMode>("pending");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [submissionListSummary, setSubmissionListSummary] =
    useState<PayrollYearEndFilingSubmissionListSummary | null>(null);
  const [submissions, setSubmissions] = useState<PayrollYearEndFilingSubmission[]>([]);
  const [evidenceSummary, setEvidenceSummary] = useState<EvidenceSummary>(EMPTY_EVIDENCE_SUMMARY);
  const [evidenceGapSubmissionIds, setEvidenceGapSubmissionIds] = useState<string[]>([]);
  const [rejectedMissingReasonDetailSubmissionIds, setRejectedMissingReasonDetailSubmissionIds] =
    useState<string[]>([]);
  const [timelineFailureSubmissionIds, setTimelineFailureSubmissionIds] = useState<string[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);

  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  const statusSummaryCards = useMemo(() => {
    const summary = submissionListSummary;
    if (!summary) {
      return [
        { label: "Total Submissions", value: 0, detail: "No list loaded" },
        { label: "Filtered Rows", value: 0, detail: "No filter result" },
        { label: "Submitted", value: 0, detail: "pending queue" },
        { label: "ACK Rejected", value: 0, detail: "needs resubmit" },
        { label: "Validation Fail", value: 0, detail: "strict fail rows" },
        { label: "Canceled", value: 0, detail: "reopen candidates" }
      ];
    }
    return [
      {
        label: "Total Submissions",
        value: summary.totalCount,
        detail: "all attempts in history"
      },
      {
        label: "Filtered Rows",
        value: summary.filteredCount,
        detail: "active query result"
      },
      {
        label: "Submitted",
        value: summary.statusCounts.submitted,
        detail: "pending queue"
      },
      {
        label: "ACK Rejected",
        value: summary.ackStatusCounts.rejected,
        detail: "needs resubmit"
      },
      {
        label: "Validation Fail",
        value: summary.validationStatusCounts.fail,
        detail: "strict fail rows"
      },
      {
        label: "Canceled",
        value: summary.statusCounts.canceled,
        detail: "reopen candidates"
      }
    ];
  }, [submissionListSummary]);

  const evidenceSummaryCards = useMemo(() => {
    return [
      {
        label: "Scanned Rows",
        value: evidenceSummary.scannedCount,
        detail: `scan limit ${evidenceScanLimit}`
      },
      {
        label: "Submission Notes",
        value: evidenceSummary.submissionNoteCount,
        detail: "submission metadata coverage"
      },
      {
        label: "ACK Notes",
        value: evidenceSummary.ackNoteCount,
        detail: "acknowledgement note coverage"
      },
      {
        label: "Timeline Evidence Rows",
        value: evidenceSummary.timelineEvidenceSubmissionCount,
        detail: `events ${evidenceSummary.timelineEvidenceEventCount}`
      },
      {
        label: "Evidence Gaps",
        value: evidenceSummary.evidenceGapCount,
        detail: "rows with no note evidence"
      },
      {
        label: "Missing Reject Detail",
        value: evidenceSummary.rejectedMissingReasonDetailCount,
        detail: "rejected ACK with empty detail"
      }
    ];
  }, [evidenceSummary, evidenceScanLimit]);

  const drilldownCounts = useMemo<DrilldownCounts>(() => {
    return {
      pending: submissions.filter((submission) => submission.status === "submitted").length,
      rejected: submissions.filter(
        (submission) =>
          submission.status === "acknowledged" && submission.ack?.ackStatus === "rejected"
      ).length,
      validation_fail: submissions.filter((submission) => submission.validationStatus === "fail")
        .length,
      evidence_gap: evidenceGapSubmissionIds.length,
      timeline_failure: timelineFailureSubmissionIds.length
    };
  }, [submissions, evidenceGapSubmissionIds, timelineFailureSubmissionIds]);

  const drilldownRows = useMemo(() => {
    return collectFilingOpsDrilldownRows({
      mode: drilldownMode,
      submissions,
      evidenceGapSubmissionIds,
      timelineFailureSubmissionIds
    });
  }, [drilldownMode, submissions, evidenceGapSubmissionIds, timelineFailureSubmissionIds]);

  const alertRules = useMemo<FilingOpsAlertRule[]>(() => {
    const summary = submissionListSummary;
    const pendingCount = summary ? summary.statusCounts.submitted : drilldownCounts.pending;
    const rejectedCount = summary ? summary.ackStatusCounts.rejected : drilldownCounts.rejected;
    const validationFailCount = summary
      ? summary.validationStatusCounts.fail
      : drilldownCounts.validation_fail;
    const evidenceGapCount = evidenceSummary.evidenceGapCount;
    const timelineFailureCount = evidenceSummary.timelineFailureCount;

    const baseRules = [
      {
        metric: "pending" as const,
        label: "Pending Queue Alert",
        detail: "submitted status rows in current query",
        value: pendingCount,
        watchThreshold: parseThresholdInput(pendingWatchThresholdInput, 1),
        criticalThreshold: parseThresholdInput(pendingCriticalThresholdInput, 3)
      },
      {
        metric: "rejected" as const,
        label: "Rejected ACK Alert",
        detail: "acknowledged rejected rows requiring retry",
        value: rejectedCount,
        watchThreshold: parseThresholdInput(rejectedWatchThresholdInput, 1),
        criticalThreshold: parseThresholdInput(rejectedCriticalThresholdInput, 2)
      },
      {
        metric: "validationFail" as const,
        label: "Validation Fail Alert",
        detail: "strict validation fail rows",
        value: validationFailCount,
        watchThreshold: parseThresholdInput(validationFailWatchThresholdInput, 1),
        criticalThreshold: parseThresholdInput(validationFailCriticalThresholdInput, 2)
      },
      {
        metric: "evidenceGap" as const,
        label: "Evidence Gap Alert",
        detail: "rows with no submission/ack/timeline evidence note",
        value: evidenceGapCount,
        watchThreshold: parseThresholdInput(evidenceGapWatchThresholdInput, 1),
        criticalThreshold: parseThresholdInput(evidenceGapCriticalThresholdInput, 2)
      },
      {
        metric: "timelineFailure" as const,
        label: "Timeline Failure Alert",
        detail: "timeline lookup failures while scanning evidence",
        value: timelineFailureCount,
        watchThreshold: parseThresholdInput(timelineFailureWatchThresholdInput, 1),
        criticalThreshold: parseThresholdInput(timelineFailureCriticalThresholdInput, 1)
      }
    ];

    return baseRules.map((rule) => ({
      ...rule,
      level: resolveFilingOpsAlertLevel(rule.value, rule.watchThreshold, rule.criticalThreshold)
    }));
  }, [
    submissionListSummary,
    drilldownCounts,
    evidenceSummary,
    pendingWatchThresholdInput,
    pendingCriticalThresholdInput,
    rejectedWatchThresholdInput,
    rejectedCriticalThresholdInput,
    validationFailWatchThresholdInput,
    validationFailCriticalThresholdInput,
    evidenceGapWatchThresholdInput,
    evidenceGapCriticalThresholdInput,
    timelineFailureWatchThresholdInput,
    timelineFailureCriticalThresholdInput
  ]);

  const overallAlertLevel = useMemo<FilingOpsAlertLevel>(() => {
    if (alertRules.some((rule) => rule.level === "critical")) {
      return "critical";
    }
    if (alertRules.some((rule) => rule.level === "watch")) {
      return "watch";
    }
    return "normal";
  }, [alertRules]);

  function appendLog(label: string, status: number, ok: boolean) {
    setLogs((prev) => [
      {
        id: Date.now(),
        label,
        status,
        ok,
        at: new Date().toLocaleString("ko-KR")
      },
      ...prev
    ]);
  }

  function buildHeaders() {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
    if (usesBearerToken) {
      headers.authorization = `Bearer ${bearerToken}`;
    } else {
      headers["x-actor-role"] = "payroll_operator";
      headers["x-actor-id"] = adminActorId.trim() || "PAY-1001";
      if (organizationId.trim()) {
        headers["x-actor-organization-id"] = organizationId.trim();
      }
    }
    return headers;
  }

  async function buildEvidenceSummaryFromTimeline(
    targetSubmissions: PayrollYearEndFilingSubmission[],
    requestYear: number,
    requestEmployeeId: string,
    headers: Record<string, string>
  ) {
    const scanSize = parseEvidenceScanLimit(evidenceScanLimit);
    const scanTargets = targetSubmissions.slice(0, scanSize);
    if (scanTargets.length === 0) {
      return EMPTY_EVIDENCE_SCAN_RESULT;
    }

    const timelineResponseRows = await Promise.all(
      scanTargets.map(async (submission) => {
        const response = await fetch(
          `/api/payroll/year-end/filing-submissions/${encodeURIComponent(
            submission.submissionId
          )}/timeline?year=${requestYear}&employeeId=${encodeURIComponent(requestEmployeeId)}`,
          {
            method: "GET",
            headers
          }
        );
        if (!response.ok) {
          return {
            submissionId: submission.submissionId,
            failed: true,
            timeline: [] as PayrollYearEndFilingSubmissionTimelineResponse["timeline"]
          };
        }
        const body = (await response.json()) as PayrollYearEndFilingSubmissionTimelineResponse;
        return {
          submissionId: submission.submissionId,
          failed: false,
          timeline: body.timeline
        };
      })
    );

    const timelineEvidenceSubmissionIds = new Set<string>();
    const timelineFailureSubmissionIds: string[] = [];
    let timelineEvidenceEventCount = 0;
    let latestEvidenceAt: string | null = null;
    for (const row of timelineResponseRows) {
      if (row.failed) {
        timelineFailureSubmissionIds.push(row.submissionId);
        continue;
      }
      const evidenceRows = row.timeline.filter((entry) => entry.action === "evidence_note_added");
      if (evidenceRows.length > 0) {
        timelineEvidenceSubmissionIds.add(row.submissionId);
      }
      timelineEvidenceEventCount += evidenceRows.length;
      for (const evidenceRow of evidenceRows) {
        if (!latestEvidenceAt || evidenceRow.occurredAt > latestEvidenceAt) {
          latestEvidenceAt = evidenceRow.occurredAt;
        }
      }
    }

    let submissionNoteCount = 0;
    let ackNoteCount = 0;
    const evidenceGapSubmissionIds: string[] = [];
    const rejectedMissingReasonDetailSubmissionIds: string[] = [];
    for (const submission of scanTargets) {
      const hasSubmissionNote = Boolean(submission.submissionNote?.trim());
      const hasAckNote = Boolean(submission.ack?.ackNote?.trim());
      const hasTimelineEvidence = timelineEvidenceSubmissionIds.has(submission.submissionId);
      if (hasSubmissionNote) {
        submissionNoteCount += 1;
      }
      if (hasAckNote) {
        ackNoteCount += 1;
      }
      if (!hasSubmissionNote && !hasAckNote && !hasTimelineEvidence) {
        evidenceGapSubmissionIds.push(submission.submissionId);
      }
      if (
        submission.ack?.ackStatus === "rejected" &&
        !(submission.ack.rejectionReasonDetail ?? "").trim()
      ) {
        rejectedMissingReasonDetailSubmissionIds.push(submission.submissionId);
      }
    }

    return {
      summary: {
        scannedCount: scanTargets.length,
        submissionNoteCount,
        ackNoteCount,
        timelineEvidenceSubmissionCount: timelineEvidenceSubmissionIds.size,
        timelineEvidenceEventCount,
        evidenceGapCount: evidenceGapSubmissionIds.length,
        rejectedMissingReasonDetailCount: rejectedMissingReasonDetailSubmissionIds.length,
        timelineFailureCount: timelineFailureSubmissionIds.length,
        latestEvidenceAt
      },
      evidenceGapSubmissionIds,
      rejectedMissingReasonDetailSubmissionIds,
      timelineFailureSubmissionIds
    } satisfies EvidenceScanResult;
  }

  async function runRefreshOpsDashboard() {
    const employeeIdValue = employeeId.trim();
    if (!employeeIdValue) {
      setStatusMessage("employeeId is required");
      return;
    }

    try {
      setPendingLabel("filing ops dashboard refresh");
      const requestYear = parseRequiredInt(year, "year");
      parseEvidenceScanLimit(evidenceScanLimit);
      const query = new URLSearchParams({
        year: String(requestYear),
        employeeId: employeeIdValue
      });
      if (submissionStatusFilter !== "all") {
        query.set("status", submissionStatusFilter);
      }
      if (submissionAckStatusFilter !== "all") {
        query.set("ackStatus", submissionAckStatusFilter);
      }
      if (submissionValidationStatusFilter !== "all") {
        query.set("validationStatus", submissionValidationStatusFilter);
      }
      if (submissionTransportFilter !== "all") {
        query.set("transport", submissionTransportFilter);
      }
      const search = normalizeSearch(submissionSearch);
      if (search) {
        query.set("search", search);
      }
      query.set("sortBy", submissionSortBy);
      query.set("sortDirection", submissionSortDirection);

      const headers = buildHeaders();
      const response = await fetch(`/api/payroll/year-end/filing-submissions?${query.toString()}`, {
        method: "GET",
        headers
      });
      const body = (await response.json()) as PayrollYearEndFilingSubmissionListResponse | { error: string };
      appendLog("refresh filing ops dashboard", response.status, response.ok);
      if (!response.ok || "error" in body) {
        setStatusMessage("dashboard refresh failed; check logs");
        return;
      }

      setSubmissionListSummary(body.summary);
      setSubmissions(body.submissions);
      const evidenceScanResult = await buildEvidenceSummaryFromTimeline(
        body.submissions,
        requestYear,
        employeeIdValue,
        headers
      );
      setEvidenceSummary(evidenceScanResult.summary);
      setEvidenceGapSubmissionIds(evidenceScanResult.evidenceGapSubmissionIds);
      setRejectedMissingReasonDetailSubmissionIds(
        evidenceScanResult.rejectedMissingReasonDetailSubmissionIds
      );
      setTimelineFailureSubmissionIds(evidenceScanResult.timelineFailureSubmissionIds);
      appendLog(
        "scan filing evidence timeline",
        evidenceScanResult.summary.timelineFailureCount === 0 ? 200 : 207,
        true
      );
      setStatusMessage(
        `loaded ${body.submissions.length}/${body.summary.totalCount} rows with evidence scan ${evidenceScanResult.summary.scannedCount}`
      );
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  function applyDrilldownMode(mode: DrilldownMode) {
    setDrilldownMode(mode);
    if (mode === "pending") {
      setSubmissionStatusFilter("submitted");
      setSubmissionAckStatusFilter("all");
      setSubmissionValidationStatusFilter("all");
      return;
    }
    if (mode === "rejected") {
      setSubmissionStatusFilter("acknowledged");
      setSubmissionAckStatusFilter("rejected");
      setSubmissionValidationStatusFilter("all");
      return;
    }
    if (mode === "validation_fail") {
      setSubmissionStatusFilter("all");
      setSubmissionAckStatusFilter("all");
      setSubmissionValidationStatusFilter("fail");
      return;
    }
    setSubmissionStatusFilter("all");
    setSubmissionAckStatusFilter("all");
    setSubmissionValidationStatusFilter("all");
  }

  function resetFilters() {
    setSubmissionStatusFilter("all");
    setSubmissionAckStatusFilter("all");
    setSubmissionValidationStatusFilter("all");
    setSubmissionTransportFilter("all");
    setSubmissionSearch("");
    setSubmissionSortBy("submittedAt");
    setSubmissionSortDirection("desc");
    setDrilldownMode("pending");
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">FlowHR Admin</p>
        <h1>Payroll Year-End Filing Ops Dashboard</h1>
        <p>
          Split operational monitoring from execution console and summarize filing status/evidence
          health using deterministic list and timeline data.
        </p>
      </header>

      <section className="panel-grid">
        <article className="panel" id="filing-ops-controls">
          <h2>Ops Filters and Refresh</h2>
          <p className="small">
            Use the same filing query filters/search/sort and refresh status/evidence cards in one
            dashboard pass.
          </p>
          <div className="input-grid">
            <label>
              Year
              <input value={year} onChange={(event) => setYear(event.target.value)} />
            </label>
            <label>
              Employee ID
              <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
            </label>
            <label>
              Status Filter
              <select
                value={submissionStatusFilter}
                onChange={(event) =>
                  setSubmissionStatusFilter(
                    event.target.value as PayrollYearEndFilingSubmissionStatusFilter
                  )
                }
              >
                <option value="all">all</option>
                <option value="submitted">submitted</option>
                <option value="acknowledged">acknowledged</option>
                <option value="canceled">canceled</option>
              </select>
            </label>
            <label>
              ACK Status Filter
              <select
                value={submissionAckStatusFilter}
                onChange={(event) =>
                  setSubmissionAckStatusFilter(
                    event.target.value as PayrollYearEndFilingSubmissionAckStatusFilter
                  )
                }
              >
                <option value="all">all</option>
                <option value="accepted">accepted</option>
                <option value="rejected">rejected</option>
                <option value="none">none</option>
              </select>
            </label>
            <label>
              Validation Filter
              <select
                value={submissionValidationStatusFilter}
                onChange={(event) =>
                  setSubmissionValidationStatusFilter(
                    event.target.value as PayrollYearEndFilingSubmissionValidationStatusFilter
                  )
                }
              >
                <option value="all">all</option>
                <option value="pass">pass</option>
                <option value="fail">fail</option>
              </select>
            </label>
            <label>
              Transport Filter
              <select
                value={submissionTransportFilter}
                onChange={(event) =>
                  setSubmissionTransportFilter(
                    event.target.value as PayrollYearEndFilingSubmissionTransportFilter
                  )
                }
              >
                <option value="all">all</option>
                <option value="manual_portal">manual_portal</option>
                <option value="hometax_upload">hometax_upload</option>
                <option value="nts_api_mock">nts_api_mock</option>
              </select>
            </label>
            <label>
              Submission Search
              <input
                value={submissionSearch}
                onChange={(event) => setSubmissionSearch(event.target.value)}
                placeholder="submissionId, ackCode, note"
              />
            </label>
            <label>
              Submission Sort By
              <select
                value={submissionSortBy}
                onChange={(event) =>
                  setSubmissionSortBy(event.target.value as PayrollYearEndFilingSubmissionSortBy)
                }
              >
                <option value="submittedAt">submittedAt</option>
                <option value="attempt">attempt</option>
                <option value="status">status</option>
                <option value="ackStatus">ackStatus</option>
                <option value="validationStatus">validationStatus</option>
                <option value="transport">transport</option>
              </select>
            </label>
            <label>
              Submission Sort Direction
              <select
                value={submissionSortDirection}
                onChange={(event) =>
                  setSubmissionSortDirection(
                    event.target.value as PayrollYearEndFilingSubmissionSortDirection
                  )
                }
              >
                <option value="desc">desc</option>
                <option value="asc">asc</option>
              </select>
            </label>
            <label>
              Evidence Scan Limit (max {MAX_EVIDENCE_SCAN_LIMIT})
              <input
                value={evidenceScanLimit}
                onChange={(event) => setEvidenceScanLimit(event.target.value)}
              />
            </label>
          </div>
          <label>
            Access Token (optional)
            <input
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="Bearer token"
            />
          </label>
          <label>
            Actor ID (dev fallback)
            <input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} />
          </label>
          <label>
            Organization ID (dev fallback)
            <input
              value={organizationId}
              onChange={(event) => setOrganizationId(event.target.value)}
            />
          </label>
          <div className="panel-actions">
            <button
              className="btn btn-primary"
              onClick={() => void runRefreshOpsDashboard()}
              disabled={pendingLabel !== null}
            >
              Refresh Ops Dashboard
            </button>
            <button className="btn btn-secondary" onClick={resetFilters} disabled={pendingLabel !== null}>
              Reset Filters
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">Session error: {supabaseSessionError}</p> : null}
        </article>

        <article className="panel" id="filing-status-summary">
          <h2>Filing Status Summary Cards</h2>
          {!submissionListSummary ? (
            <p className="small">No filing status summary yet. Run Refresh Ops Dashboard.</p>
          ) : (
            <p className="small">
              total {submissionListSummary.totalCount} / filtered {submissionListSummary.filteredCount}
            </p>
          )}
          <div className="summary-grid" aria-label="filing status summary cards">
            {statusSummaryCards.map((card) => (
              <article key={card.label} className="summary-card">
                <p>{card.label}</p>
                <strong>{card.value}</strong>
                <p>{card.detail}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="panel" id="filing-evidence-summary">
          <h2>Filing Evidence Summary Cards</h2>
          <p className="small">
            scanned {evidenceSummary.scannedCount} rows / timeline failures {evidenceSummary.timelineFailureCount}
          </p>
          <div className="summary-grid" aria-label="filing evidence summary cards">
            {evidenceSummaryCards.map((card) => (
              <article key={card.label} className="summary-card">
                <p>{card.label}</p>
                <strong>{card.value}</strong>
                <p>{card.detail}</p>
              </article>
            ))}
          </div>
          <ul className="simple-list">
            <li>
              <span>Latest Evidence Event</span>
              <strong>{formatEvidenceTimestamp(evidenceSummary.latestEvidenceAt)}</strong>
            </li>
            <li>
              <span>Rows Missing Rejection Detail</span>
              <strong>{rejectedMissingReasonDetailSubmissionIds.length}</strong>
            </li>
            <li>
              <span>Active Filters</span>
              <strong>
                status={submissionStatusFilter}, ack={submissionAckStatusFilter}, validation=
                {submissionValidationStatusFilter}, transport={submissionTransportFilter}, search=
                {normalizeSearch(submissionSearch) ?? "-"}, sort={submissionSortBy}:{submissionSortDirection}
              </strong>
            </li>
          </ul>
        </article>

        <article className="panel" id="filing-alert-rules">
          <h2>Filing Alert Rules</h2>
          <p className="small">
            overall{" "}
            <strong
              className={
                overallAlertLevel === "critical"
                  ? "fail"
                  : overallAlertLevel === "watch"
                    ? "muted"
                    : "ok"
              }
            >
              {formatAlertLevelLabel(overallAlertLevel)}
            </strong>
          </p>
          <div className="input-grid">
            <label>
              Pending Watch Threshold
              <input
                value={pendingWatchThresholdInput}
                onChange={(event) => setPendingWatchThresholdInput(event.target.value)}
              />
            </label>
            <label>
              Pending Critical Threshold
              <input
                value={pendingCriticalThresholdInput}
                onChange={(event) => setPendingCriticalThresholdInput(event.target.value)}
              />
            </label>
            <label>
              Rejected Watch Threshold
              <input
                value={rejectedWatchThresholdInput}
                onChange={(event) => setRejectedWatchThresholdInput(event.target.value)}
              />
            </label>
            <label>
              Rejected Critical Threshold
              <input
                value={rejectedCriticalThresholdInput}
                onChange={(event) => setRejectedCriticalThresholdInput(event.target.value)}
              />
            </label>
            <label>
              Validation-Fail Watch Threshold
              <input
                value={validationFailWatchThresholdInput}
                onChange={(event) => setValidationFailWatchThresholdInput(event.target.value)}
              />
            </label>
            <label>
              Validation-Fail Critical Threshold
              <input
                value={validationFailCriticalThresholdInput}
                onChange={(event) => setValidationFailCriticalThresholdInput(event.target.value)}
              />
            </label>
            <label>
              Evidence-Gap Watch Threshold
              <input
                value={evidenceGapWatchThresholdInput}
                onChange={(event) => setEvidenceGapWatchThresholdInput(event.target.value)}
              />
            </label>
            <label>
              Evidence-Gap Critical Threshold
              <input
                value={evidenceGapCriticalThresholdInput}
                onChange={(event) => setEvidenceGapCriticalThresholdInput(event.target.value)}
              />
            </label>
            <label>
              Timeline-Failure Watch Threshold
              <input
                value={timelineFailureWatchThresholdInput}
                onChange={(event) => setTimelineFailureWatchThresholdInput(event.target.value)}
              />
            </label>
            <label>
              Timeline-Failure Critical Threshold
              <input
                value={timelineFailureCriticalThresholdInput}
                onChange={(event) => setTimelineFailureCriticalThresholdInput(event.target.value)}
              />
            </label>
          </div>
          <ul className="simple-list" aria-label="filing alert rule list">
            {alertRules.map((rule) => (
              <li key={rule.metric}>
                <span>
                  {rule.label} ({rule.detail})
                </span>
                <strong
                  className={rule.level === "critical" ? "fail" : rule.level === "watch" ? "muted" : "ok"}
                >
                  {formatAlertLevelLabel(rule.level)} / {rule.value} (watch {rule.watchThreshold},
                  critical {rule.criticalThreshold})
                </strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel" id="filing-ops-drilldown">
          <h2>Filing Ops Drilldown</h2>
          <p className="small">
            switch mode to focus queue slice and update filters before refresh.
          </p>
          <div className="ops-drilldown-toolbar">
            {DRILLDOWN_PRESETS.map((preset) => (
              <button
                key={preset.mode}
                className={`btn btn-secondary${drilldownMode === preset.mode ? " active" : ""}`}
                onClick={() => applyDrilldownMode(preset.mode)}
                disabled={pendingLabel !== null}
              >
                {preset.label} ({drilldownCounts[preset.mode]})
              </button>
            ))}
          </div>
          <p className="small">
            active mode: {drilldownMode} / rows {drilldownRows.length}
          </p>
          {drilldownRows.length === 0 ? (
            <p className="small">No rows in current drilldown mode.</p>
          ) : (
            <ul className="log-list" aria-label="filing ops drilldown list">
              {drilldownRows.map((submission) => (
                <li key={submission.submissionId}>
                  <span
                    className={
                      submission.status === "acknowledged"
                        ? "ok"
                        : submission.status === "canceled"
                          ? "fail"
                          : "small"
                    }
                  >
                    {submission.status.toUpperCase()}
                  </span>
                  <span>
                    {submission.submissionId} / attempt {submission.attempt} / {submission.transport} /{" "}
                    {submission.validationStatus}
                    {submission.ack?.ackStatus ? ` / ACK ${submission.ack.ackStatus}` : ""}
                    {evidenceGapSubmissionIds.includes(submission.submissionId) ? " / EVIDENCE_GAP" : ""}
                    {timelineFailureSubmissionIds.includes(submission.submissionId)
                      ? " / TIMELINE_FAIL"
                      : ""}
                  </span>
                  <time>{new Date(submission.submittedAt).toLocaleString("ko-KR")}</time>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>Filing Queue Snapshot</h2>
          {submissions.length === 0 ? (
            <p className="small">No filing rows loaded.</p>
          ) : (
            <ul className="log-list" aria-label="filing ops queue snapshot">
              {submissions.map((submission) => (
                <li key={submission.submissionId}>
                  <span
                    className={
                      submission.status === "acknowledged"
                        ? "ok"
                        : submission.status === "canceled"
                          ? "fail"
                          : "small"
                    }
                  >
                    {submission.status.toUpperCase()}
                  </span>
                  <span>
                    {submission.submissionId} / attempt {submission.attempt} / {submission.transport}
                    {submission.ack?.ackStatus ? ` / ACK ${submission.ack.ackStatus}` : ""}
                    {submission.submissionNote ? ` / NOTE ${submission.submissionNote}` : ""}
                  </span>
                  <time>{new Date(submission.submittedAt).toLocaleString("ko-KR")}</time>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>API Logs</h2>
          <p className="small">
            total {stats.total} / success {stats.success} / fail {stats.fail}
            {pendingLabel ? ` / running ${pendingLabel}` : ""}
          </p>
          {logs.length === 0 ? (
            <p className="small">No API call yet.</p>
          ) : (
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className={log.ok ? "ok" : "fail"}>{log.ok ? "OK" : "FAIL"}</span>
                  <span>
                    {log.label} / {log.status}
                  </span>
                  <time>{log.at}</time>
                </li>
              ))}
            </ul>
          )}
          <div className="panel-actions">
            <Link href="/admin/payroll-year-end-filing" className="btn btn-secondary">
              Open Filing Execution Console
            </Link>
            <Link href="/admin/payroll-year-end" className="btn btn-secondary">
              Back to Year-End
            </Link>
            <Link href="/admin" className="btn btn-secondary">
              Back to Admin
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
