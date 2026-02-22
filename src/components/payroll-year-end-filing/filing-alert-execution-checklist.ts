import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";

export type AlertMetric = "pending" | "rejected" | "validationFail" | "evidenceGap" | "timelineFailure";

type AlertExecutionChecklistTemplate = {
  id: string;
  label: string;
  watchDetail: string;
  criticalDetail: string;
  required: boolean;
};

export type AlertExecutionChecklistRow = {
  taskId: string;
  label: string;
  detail: string;
  required: boolean;
};

export type AlertExecutionChecklistProgressSummary = {
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  completionRate: number;
};

const ALERT_METRIC_LABELS: Record<AlertMetric, string> = {
  pending: "Pending Queue",
  rejected: "Rejected ACK",
  validationFail: "Validation Fail",
  evidenceGap: "Evidence Gap",
  timelineFailure: "Timeline Failures"
};

const ALERT_EXECUTION_CHECKLIST_TEMPLATES: Record<AlertMetric, AlertExecutionChecklistTemplate[]> = {
  pending: [
    {
      id: "queue-triage",
      label: "Triage longest pending submissions",
      watchDetail: "Review top pending attempts and confirm ownership before end of day.",
      criticalDetail: "Prioritize longest pending attempts and start incident queue triage immediately.",
      required: true
    },
    {
      id: "metadata-verify",
      label: "Verify submission metadata and artifact hash",
      watchDetail: "Validate employee/year/format fields against latest finalized payload.",
      criticalDetail: "Validate metadata on every pending row before allowing new submissions.",
      required: true
    },
    {
      id: "owner-sync",
      label: "Sync queue owner handoff note",
      watchDetail: "Log owner and next action in operations handoff notes.",
      criticalDetail: "Escalate owner handoff and manager acknowledgement in the same shift.",
      required: false
    }
  ],
  rejected: [
    {
      id: "reason-validate",
      label: "Validate reject reason and resubmission scope",
      watchDetail: "Confirm reject reason code/detail and identify impacted fields.",
      criticalDetail: "Run reject-reason triage with tax reporting owner before retry.",
      required: true
    },
    {
      id: "retry-package",
      label: "Prepare retry package and owner sign-off",
      watchDetail: "Prepare corrected package with owner assignment for next retry.",
      criticalDetail: "Freeze new retries until retry package owner signs off.",
      required: true
    },
    {
      id: "stakeholder-brief",
      label: "Send stakeholder brief",
      watchDetail: "Share rejection impact summary with payroll and compliance stakeholders.",
      criticalDetail: "Trigger critical incident brief to payroll manager and compliance lead.",
      required: false
    }
  ],
  validationFail: [
    {
      id: "schema-fix",
      label: "Patch failing validation fields",
      watchDetail: "Patch strict validation failures and rerun local artifact check.",
      criticalDetail: "Block submission flow and patch root-cause before re-enabling pipeline.",
      required: true
    },
    {
      id: "regression-verify",
      label: "Run validation regression verification",
      watchDetail: "Verify corrected rows pass strict checks in regression sample.",
      criticalDetail: "Run full validation regression before any production retry.",
      required: true
    },
    {
      id: "platform-escalate",
      label: "Escalate to payroll platform lead",
      watchDetail: "Escalate if identical validation fail appears more than once.",
      criticalDetail: "Immediate escalation to payroll platform lead for incident command.",
      required: false
    }
  ],
  evidenceGap: [
    {
      id: "evidence-backfill",
      label: "Backfill missing submission/ack evidence",
      watchDetail: "Add submission or acknowledgement notes for missing evidence rows.",
      criticalDetail: "Pause acknowledgements until evidence trace is backfilled.",
      required: true
    },
    {
      id: "audit-tag",
      label: "Tag rows for audit traceability",
      watchDetail: "Tag each recovered row with evidence trace owner and timestamp.",
      criticalDetail: "Tag all rows and notify compliance owner before queue resumes.",
      required: true
    },
    {
      id: "followup-scan",
      label: "Schedule follow-up evidence scan",
      watchDetail: "Schedule follow-up scan for next refresh window.",
      criticalDetail: "Schedule immediate rescan and manager checkpoint in same hour.",
      required: false
    }
  ],
  timelineFailure: [
    {
      id: "timeline-retry",
      label: "Retry timeline lookup with actor headers",
      watchDetail: "Retry lookup and verify actor/tenant headers are populated.",
      criticalDetail: "Retry with fallback credentials and capture failing request metadata.",
      required: true
    },
    {
      id: "manual-log",
      label: "Append manual trace log entry",
      watchDetail: "Record manual trace details until timeline API recovers.",
      criticalDetail: "Switch to fail-open manual trace workflow until API stabilizes.",
      required: true
    },
    {
      id: "incident-escalate",
      label: "Escalate timeline API incident",
      watchDetail: "Escalate if failure persists after retry window.",
      criticalDetail: "Trigger incident escalation immediately to admin incident commander.",
      required: false
    }
  ]
};

export function normalizeMetric(value: string | null): AlertMetric {
  if (value === "pending" || value === "rejected" || value === "validationFail") {
    return value;
  }
  if (value === "evidenceGap" || value === "timelineFailure") {
    return value;
  }
  return "pending";
}

export function normalizeAlertLevel(value: string | null): FilingOpsAlertLevel {
  if (value === "watch" || value === "critical") {
    return value;
  }
  return "normal";
}

export function parseOptionalInt(value: string | null) {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

export function buildAlertExecutionChecklistRows(options: {
  metric: AlertMetric;
  level: FilingOpsAlertLevel;
  ownerRole: string;
  ownerActorId: string;
  currentValue: number | null;
}) {
  const templates = ALERT_EXECUTION_CHECKLIST_TEMPLATES[options.metric];
  const ownerRole = options.ownerRole.trim() || "unassigned";
  const ownerActorId = options.ownerActorId.trim();
  const ownerLabel = ownerActorId.length > 0 ? `${ownerRole}:${ownerActorId}` : ownerRole;
  return templates.map((template) => {
    const severityDetail =
      options.level === "critical"
        ? template.criticalDetail
        : options.level === "watch"
          ? template.watchDetail
          : "Keep routine monitoring and confirm queue health in the next refresh.";
    const metricDetail = `${ALERT_METRIC_LABELS[options.metric]} value ${
      options.currentValue ?? "-"
    } (level ${options.level.toUpperCase()})`;
    return {
      taskId: `${options.metric}:${template.id}`,
      label: template.label,
      detail: `${severityDetail} Owner: ${ownerLabel}. ${metricDetail}.`,
      required: template.required || options.level === "critical"
    } satisfies AlertExecutionChecklistRow;
  });
}

export function summarizeAlertExecutionChecklistProgress(
  rows: AlertExecutionChecklistRow[],
  completedTaskIds: readonly string[]
): AlertExecutionChecklistProgressSummary {
  const completed = new Set(completedTaskIds);
  const completedCount = rows.filter((row) => completed.has(row.taskId)).length;
  const totalCount = rows.length;
  const pendingCount = Math.max(0, totalCount - completedCount);
  const completionRate = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  return {
    totalCount,
    completedCount,
    pendingCount,
    completionRate
  };
}
