"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsChecklistTracker.module.css";
import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import {
  buildAlertExecutionChecklistRows,
  normalizeAlertLevel,
  normalizeMetric,
  parseOptionalInt,
  summarizeAlertExecutionChecklistProgress,
  type AlertExecutionChecklistRow,
  type AlertMetric
} from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import { buildChecklistReviewRouteHref } from "@/components/payroll-year-end-filing/filing-alert-execution-review-loop";

export {
  buildAlertExecutionChecklistRows,
  summarizeAlertExecutionChecklistProgress
} from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
export type {
  AlertExecutionChecklistProgressSummary,
  AlertExecutionChecklistRow,
  AlertMetric
} from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";

const METRIC_OPTIONS: Array<{ value: AlertMetric; label: string }> = [
  { value: "pending", label: "Pending Queue" },
  { value: "rejected", label: "Rejected ACK" },
  { value: "validationFail", label: "Validation Fail" },
  { value: "evidenceGap", label: "Evidence Gap" },
  { value: "timelineFailure", label: "Timeline Failures" }
];

const ALERT_LEVEL_OPTIONS: Array<{ value: FilingOpsAlertLevel; label: string }> = [
  { value: "normal", label: "NORMAL" },
  { value: "watch", label: "WATCH" },
  { value: "critical", label: "CRITICAL" }
];

export default function PayrollYearEndFilingOpsChecklistTracker() {
  const searchParams = useSearchParams();
  const [metric, setMetric] = useState<AlertMetric>(() => normalizeMetric(searchParams.get("metric")));
  const [level, setLevel] = useState<FilingOpsAlertLevel>(() =>
    normalizeAlertLevel(searchParams.get("level"))
  );
  const [ownerRole, setOwnerRole] = useState(() => (searchParams.get("ownerRole") ?? "").trim());
  const [ownerActorId, setOwnerActorId] = useState(
    () => (searchParams.get("ownerActorId") ?? "").trim()
  );
  const [currentValueInput, setCurrentValueInput] = useState(searchParams.get("value") ?? "");
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  const metricParam = searchParams.get("metric");
  const levelParam = searchParams.get("level");
  const ownerRoleParam = searchParams.get("ownerRole");
  const ownerActorIdParam = searchParams.get("ownerActorId");
  const valueParam = searchParams.get("value");

  useEffect(() => {
    setMetric(normalizeMetric(metricParam));
    setLevel(normalizeAlertLevel(levelParam));
    setOwnerRole((ownerRoleParam ?? "").trim());
    setOwnerActorId((ownerActorIdParam ?? "").trim());
    setCurrentValueInput(valueParam ?? "");
    setCompletedTaskIds([]);
    setCompletedAt(null);
  }, [metricParam, levelParam, ownerRoleParam, ownerActorIdParam, valueParam]);

  const currentValue = parseOptionalInt(currentValueInput);

  const checklistRows = useMemo(
    () => buildAlertExecutionChecklistRows({ metric, level, ownerRole, ownerActorId, currentValue }),
    [metric, level, ownerRole, ownerActorId, currentValue]
  );

  useEffect(() => {
    const validTaskIds = new Set(checklistRows.map((row) => row.taskId));
    setCompletedTaskIds((prev) => prev.filter((taskId) => validTaskIds.has(taskId)));
  }, [checklistRows]);

  const progress = useMemo(
    () => summarizeAlertExecutionChecklistProgress(checklistRows, completedTaskIds),
    [checklistRows, completedTaskIds]
  );

  useEffect(() => {
    if (progress.totalCount > 0 && progress.pendingCount === 0) {
      setCompletedAt((prev) =>
        prev ??
        new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short"
        }).format(new Date())
      );
      return;
    }
    setCompletedAt(null);
  }, [progress.totalCount, progress.pendingCount]);

  function toggleTask(taskId: string) {
    setCompletedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((value) => value !== taskId) : [...prev, taskId]
    );
  }

  function markAllComplete() {
    setCompletedTaskIds(checklistRows.map((row) => row.taskId));
  }

  const reviewLoopHref = buildChecklistReviewRouteHref({
    metric,
    level,
    value: currentValue,
    ownerRole,
    ownerActorId
  });

  return (
    <section className="panel" id="filing-alert-execution-checklist">
      <h2>Payroll Filing Alert Execution Checklist</h2>
      <p className="small">
        Track action completion for each alert metric without expanding the main ops dashboard.
      </p>
      <div className="panel-actions">
        <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary btn-small">
          Back to Ops Dashboard
        </Link>
        <button className="btn btn-secondary btn-small" onClick={markAllComplete}>
          Mark All Complete
        </button>
        <button className="btn btn-secondary btn-small" onClick={() => setCompletedTaskIds([])}>
          Reset
        </button>
        <Link href={reviewLoopHref} className="btn btn-secondary btn-small">
          Open Review Loop
        </Link>
      </div>

      <div className={styles.alertExecutionControls}>
        <label>
          Metric
          <select value={metric} onChange={(event) => setMetric(normalizeMetric(event.target.value))}>
            {METRIC_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Alert Level
          <select value={level} onChange={(event) => setLevel(normalizeAlertLevel(event.target.value))}>
            {ALERT_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Owner Role
          <input value={ownerRole} onChange={(event) => setOwnerRole(event.target.value)} />
        </label>
        <label>
          Owner Actor ID
          <input value={ownerActorId} onChange={(event) => setOwnerActorId(event.target.value)} />
        </label>
        <label>
          Metric Value
          <input value={currentValueInput} onChange={(event) => setCurrentValueInput(event.target.value)} />
        </label>
      </div>

      <p className={`small ${progress.pendingCount === 0 ? "ok" : "fail"}`}>
        completion {progress.completedCount}/{progress.totalCount} ({progress.completionRate}%)
      </p>
      {completedAt ? <p className="small ok">all checklist tasks completed at {completedAt}</p> : null}

      <ul className="simple-list" aria-label="filing alert execution checklist">
        {checklistRows.map((row) => renderChecklistRow(row, completedTaskIds.includes(row.taskId), toggleTask))}
      </ul>
    </section>
  );
}

function renderChecklistRow(
  row: AlertExecutionChecklistRow,
  checked: boolean,
  toggleTask: (taskId: string) => void
) {
  return (
    <li
      key={row.taskId}
      className={`${styles.checklistRow}${checked ? ` ${styles.checklistRowDone}` : ""}`}
    >
      <label className={styles.checklistToggle}>
        <input type="checkbox" checked={checked} onChange={() => toggleTask(row.taskId)} />
        <span>
          <strong>{row.label}</strong>
          <p className="small">{row.detail}</p>
          <span
            className={`${styles.checklistBadge}${row.required ? "" : ` ${styles.checklistBadgeOptional}`}`}
            aria-label={row.required ? "required task" : "optional task"}
          >
            {row.required ? "required" : "optional"}
          </span>
        </span>
      </label>
    </li>
  );
}
