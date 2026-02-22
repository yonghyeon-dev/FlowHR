import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertExecutionChecklistRow, AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";

export type AlertExecutionLogStatus = "done" | "blocked" | "follow_up";

export type AlertExecutionLogEntry = {
  logId: string;
  taskId: string;
  status: AlertExecutionLogStatus;
  note: string;
  actorId: string;
  at: string;
};

export type AlertExecutionReviewStage = "execute" | "review" | "close";

export type AlertExecutionReviewSummary = {
  requiredTotal: number;
  requiredCompleted: number;
  requiredPending: number;
  blockedCount: number;
  followUpCount: number;
  doneCount: number;
  logCount: number;
  stage: AlertExecutionReviewStage;
  readyForClose: boolean;
};

export function buildChecklistReviewRouteHref(options: {
  metric: AlertMetric;
  level: FilingOpsAlertLevel;
  value: number | null;
  ownerRole: string;
  ownerActorId: string;
}) {
  const query = new URLSearchParams({
    metric: options.metric,
    level: options.level
  });
  if (options.value !== null) {
    query.set("value", String(options.value));
  }
  if (options.ownerRole.trim().length > 0) {
    query.set("ownerRole", options.ownerRole.trim());
  }
  if (options.ownerActorId.trim().length > 0) {
    query.set("ownerActorId", options.ownerActorId.trim());
  }
  return `/admin/payroll-year-end-filing/ops/checklist/review?${query.toString()}`;
}

export function buildAlertExecutionLogEntry(input: {
  taskId: string;
  status: AlertExecutionLogStatus;
  note: string;
  actorId: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const actorId = input.actorId.trim() || "UNASSIGNED-ACTOR";
  const taskId = input.taskId.trim() || "general";
  const status = input.status;
  const note = input.note.trim();
  const timestamp = now.toISOString();
  return {
    logId: `${taskId}:${status}:${timestamp}`,
    taskId,
    status,
    note,
    actorId,
    at: timestamp
  } satisfies AlertExecutionLogEntry;
}

export function summarizeAlertExecutionReviewLoop(options: {
  rows: AlertExecutionChecklistRow[];
  completedTaskIds: readonly string[];
  logs: readonly AlertExecutionLogEntry[];
}): AlertExecutionReviewSummary {
  const requiredRows = options.rows.filter((row) => row.required);
  const completed = new Set(options.completedTaskIds);
  const requiredCompleted = requiredRows.filter((row) => completed.has(row.taskId)).length;
  const requiredTotal = requiredRows.length;
  const requiredPending = Math.max(0, requiredTotal - requiredCompleted);

  const blockedCount = options.logs.filter((log) => log.status === "blocked").length;
  const followUpCount = options.logs.filter((log) => log.status === "follow_up").length;
  const doneCount = options.logs.filter((log) => log.status === "done").length;
  const logCount = options.logs.length;

  const stage: AlertExecutionReviewStage =
    requiredPending > 0 ? "execute" : blockedCount > 0 || followUpCount > 0 ? "review" : "close";
  const readyForClose = stage === "close";

  return {
    requiredTotal,
    requiredCompleted,
    requiredPending,
    blockedCount,
    followUpCount,
    doneCount,
    logCount,
    stage,
    readyForClose
  };
}
