"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsChecklistReviewLoop.module.css";
import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import {
  buildAlertExecutionChecklistRows,
  normalizeAlertLevel,
  normalizeMetric,
  parseOptionalInt,
  type AlertMetric
} from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  buildAlertExecutionLogEntry,
  summarizeAlertExecutionReviewLoop,
  type AlertExecutionLogEntry,
  type AlertExecutionLogStatus
} from "@/components/payroll-year-end-filing/filing-alert-execution-review-loop";

const STAGE_LABELS = {
  execute: "Execute",
  review: "Review",
  close: "Close Ready"
} as const;

export default function PayrollYearEndFilingOpsChecklistReviewLoop() {
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
  const [logs, setLogs] = useState<AlertExecutionLogEntry[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("general");
  const [logStatus, setLogStatus] = useState<AlertExecutionLogStatus>("done");
  const [logNote, setLogNote] = useState("");
  const [logActorId, setLogActorId] = useState(
    () => (searchParams.get("ownerActorId") ?? "").trim() || "REV-1001"
  );

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
    setLogActorId((ownerActorIdParam ?? "").trim() || "REV-1001");
    setCompletedTaskIds([]);
    setLogs([]);
    setSelectedTaskId("general");
    setLogStatus("done");
    setLogNote("");
  }, [metricParam, levelParam, ownerRoleParam, ownerActorIdParam, valueParam]);

  const currentValue = parseOptionalInt(currentValueInput);
  const checklistRows = useMemo(
    () => buildAlertExecutionChecklistRows({ metric, level, ownerRole, ownerActorId, currentValue }),
    [metric, level, ownerRole, ownerActorId, currentValue]
  );

  useEffect(() => {
    const availableTaskIds = new Set(checklistRows.map((row) => row.taskId));
    setCompletedTaskIds((prev) => prev.filter((taskId) => availableTaskIds.has(taskId)));
    setSelectedTaskId((prev) => {
      if (prev === "general") {
        return checklistRows[0]?.taskId ?? "general";
      }
      return availableTaskIds.has(prev) ? prev : (checklistRows[0]?.taskId ?? "general");
    });
  }, [checklistRows]);

  const reviewSummary = useMemo(
    () => summarizeAlertExecutionReviewLoop({ rows: checklistRows, completedTaskIds, logs }),
    [checklistRows, completedTaskIds, logs]
  );

  const checklistHref = useMemo(() => {
    const query = new URLSearchParams({
      metric,
      level
    });
    if (currentValue !== null) {
      query.set("value", String(currentValue));
    }
    if (ownerRole.trim().length > 0) {
      query.set("ownerRole", ownerRole.trim());
    }
    if (ownerActorId.trim().length > 0) {
      query.set("ownerActorId", ownerActorId.trim());
    }
    return `/admin/payroll-year-end-filing/ops/checklist?${query.toString()}`;
  }, [metric, level, currentValue, ownerRole, ownerActorId]);

  function toggleTask(taskId: string) {
    setCompletedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((value) => value !== taskId) : [...prev, taskId]
    );
  }

  function markRequiredComplete() {
    const requiredTaskIds = checklistRows.filter((row) => row.required).map((row) => row.taskId);
    setCompletedTaskIds((prev) => Array.from(new Set([...prev, ...requiredTaskIds])));
  }

  function appendLog() {
    const entry = buildAlertExecutionLogEntry({
      taskId: selectedTaskId,
      status: logStatus,
      note: logNote,
      actorId: logActorId
    });
    setLogs((prev) => [entry, ...prev]);
    setLogNote("");
  }

  return (
    <section className="panel" id="filing-alert-review-loop">
      <h2>Payroll Filing Alert Checklist Review Loop</h2>
      <p className="small">
        Manage execution logs and close-review readiness per alert checklist without changing API contracts.
      </p>
      <div className="panel-actions">
        <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary btn-small">
          Back to Ops Dashboard
        </Link>
        <Link href={checklistHref} className="btn btn-secondary btn-small">
          Back to Checklist
        </Link>
        <button className="btn btn-secondary btn-small" onClick={markRequiredComplete}>
          Mark Required Complete
        </button>
      </div>

      <div className={styles.reviewHeader}>
        <p className="small">
          metric {metric} / level {level.toUpperCase()} / owner {ownerRole || "-"}:
          {ownerActorId || "-"} / value {currentValue ?? "-"}
        </p>
        <p className="small">
          stage{" "}
          <span
            className={`${styles.stageBadge} ${
              reviewSummary.stage === "execute"
                ? styles.stageBadgeExecute
                : reviewSummary.stage === "review"
                  ? styles.stageBadgeReview
                  : styles.stageBadgeClose
            }`}
          >
            {STAGE_LABELS[reviewSummary.stage]}
          </span>
        </p>
      </div>

      <p className={`small ${reviewSummary.readyForClose ? "ok" : "fail"}`}>
        required {reviewSummary.requiredCompleted}/{reviewSummary.requiredTotal}, blocked{" "}
        {reviewSummary.blockedCount}, follow-up {reviewSummary.followUpCount}, logs{" "}
        {reviewSummary.logCount}
      </p>

      <ul className="simple-list" aria-label="filing alert review checklist">
        {checklistRows.map((row) => (
          <li key={row.taskId}>
            <label>
              <input
                type="checkbox"
                checked={completedTaskIds.includes(row.taskId)}
                onChange={() => toggleTask(row.taskId)}
              />{" "}
              <strong>{row.label}</strong>{" "}
              <span className={`small ${row.required ? "fail" : "muted-link"}`}>
                {row.required ? "required" : "optional"}
              </span>
              <p className="small">{row.detail}</p>
            </label>
          </li>
        ))}
      </ul>

      <article className="panel" id="filing-alert-execution-log">
        <h3>Execution Log</h3>
        <div className={styles.logForm}>
          <label>
            Task
            <select value={selectedTaskId} onChange={(event) => setSelectedTaskId(event.target.value)}>
              {checklistRows.map((row) => (
                <option key={row.taskId} value={row.taskId}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={logStatus}
              onChange={(event) => setLogStatus(event.target.value as AlertExecutionLogStatus)}
            >
              <option value="done">done</option>
              <option value="blocked">blocked</option>
              <option value="follow_up">follow_up</option>
            </select>
          </label>
          <label>
            Actor ID
            <input value={logActorId} onChange={(event) => setLogActorId(event.target.value)} />
          </label>
          <label>
            Note
            <textarea value={logNote} onChange={(event) => setLogNote(event.target.value)} />
          </label>
          <div className={styles.logFormActions}>
            <button className="btn btn-secondary btn-small" onClick={appendLog}>
              Append Log
            </button>
            <button className="btn btn-secondary btn-small" onClick={() => setLogs([])}>
              Clear Logs
            </button>
          </div>
        </div>

        {logs.length === 0 ? (
          <p className="small">No execution logs yet.</p>
        ) : (
          <ul className={styles.logList} aria-label="filing alert execution log list">
            {logs.map((log) => (
              <li key={log.logId} className={styles.logRow}>
                <p className="small">
                  <strong>{log.taskId}</strong>
                  <span
                    className={`${styles.statusBadge} ${
                      log.status === "done"
                        ? styles.statusDone
                        : log.status === "blocked"
                          ? styles.statusBlocked
                          : styles.statusFollowUp
                    }`}
                  >
                    {log.status}
                  </span>
                </p>
                <p className="small">
                  actor {log.actorId} / {new Date(log.at).toLocaleString("ko-KR")}
                </p>
                <p className="small">{log.note || "no note"}</p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
